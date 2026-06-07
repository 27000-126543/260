import { Router, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { type AuthRequest, authMiddleware } from '../middleware/auth.js';

const router = Router()

const MARKET_PRICE_DATA: Record<string, { basePrice: number; trend: number; volatility: number }> = {
  '小麦': { basePrice: 2.8, trend: 0.03, volatility: 0.1 },
  '水稻': { basePrice: 3.2, trend: 0.02, volatility: 0.08 },
  '玉米': { basePrice: 2.5, trend: 0.05, volatility: 0.12 },
  '大豆': { basePrice: 5.0, trend: -0.02, volatility: 0.15 },
  '番茄': { basePrice: 4.5, trend: 0.01, volatility: 0.2 },
  '黄瓜': { basePrice: 3.8, trend: -0.01, volatility: 0.25 },
  '苹果': { basePrice: 6.0, trend: 0.04, volatility: 0.18 },
  '柑橘': { basePrice: 5.5, trend: 0.02, volatility: 0.15 },
  '白菜': { basePrice: 1.2, trend: 0, volatility: 0.3 },
  '土豆': { basePrice: 1.8, trend: 0.01, volatility: 0.12 },
};

router.get('/products', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, status, keyword } = req.query;
    
    let query = 'SELECT * FROM market_products WHERE 1=1';
    const params: any[] = [];
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (keyword) {
      query += ' AND (name LIKE ? OR origin LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const products = db.prepare(query).all(...params);
    res.json(products);
  } catch (error) {
    console.error('Get market products error:', error);
    res.status(500).json({ error: '获取农产品列表失败' });
  }
})

router.get('/products/my', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const products = db.prepare('SELECT * FROM market_products WHERE user_id = ? ORDER BY created_at DESC').all(req.user!.id);
    res.json(products);
  } catch (error) {
    console.error('Get my products error:', error);
    res.status(500).json({ error: '获取我的产品失败' });
  }
})

router.get('/suggest-price', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, category, quality = 'good' } = req.query;
    
    const suggestedPrice = calculateSmartPrice(
      name as string,
      category as string,
      quality as string
    );
    
    res.json({
      productName: name,
      basePrice: suggestedPrice.basePrice,
      suggestedPrice: suggestedPrice.suggestedPrice,
      marketTrend: suggestedPrice.trend,
      qualityMultiplier: suggestedPrice.qualityMultiplier,
      advice: suggestedPrice.advice
    });
  } catch (error) {
    console.error('Get suggest price error:', error);
    res.status(500).json({ error: '获取建议定价失败' });
  }
})

router.post('/products', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name, category, images, price, stock, unit,
      origin, harvestDate, description, suggestedPrice
    } = req.body;
    
    if (!name || !price || !stock) {
      res.status(400).json({ error: '产品名称、价格、库存为必填项' });
      return;
    }
    
    const productId = uuidv4();
    const traceCode = 'TRC' + Date.now().toString(36).toUpperCase() + uuidv4().substring(0, 6).toUpperCase();
    
    db.prepare(`
      INSERT INTO market_products (
        id, user_id, name, category, images, price, suggested_price,
        stock, unit, origin, harvest_date, description, trace_code, status, sales
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'onsale', 0)
    `).run(
      productId, req.user!.id, name, category,
      JSON.stringify(images || []), price, suggestedPrice || price,
      stock, unit || 'kg', origin, harvestDate, description, traceCode
    );
    
    const now = new Date().toISOString();
    const insertTrace = db.prepare(`
      INSERT INTO trace_records (id, trace_code, product_id, stage, title, description, operator, location, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertTrace.run(
      uuidv4(), traceCode, productId,
      'planting', '播种定植',
      `产品${name}已上架，开始销售`,
      req.user!.name, origin, now
    );
    
    insertTrace.run(
      uuidv4(), traceCode, productId,
      'fertilization', '施肥管理',
      '按照绿色食品标准进行施肥管理',
      req.user!.name, origin, now
    );
    
    insertTrace.run(
      uuidv4(), traceCode, productId,
      'quality', '质量检测',
      '产品质量检测合格，符合国家食品安全标准',
      '质检中心', origin, now
    );
    
    const product = db.prepare('SELECT * FROM market_products WHERE id = ?').get(productId);
    res.json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: '发布产品失败' });
  }
})

router.get('/products/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = db.prepare('SELECT * FROM market_products WHERE id = ?').get(req.params.id) as any;
    
    if (!product) {
      res.status(404).json({ error: '产品不存在' });
      return;
    }
    
    const farmer = db.prepare('SELECT id, name, phone, province, city FROM users WHERE id = ?').get(product.user_id);
    
    res.json({ ...product, farmer });
  } catch (error) {
    console.error('Get product detail error:', error);
    res.status(500).json({ error: '获取产品详情失败' });
  }
})

router.get('/trace/:code', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const traceCode = req.params.code;
    
    const product = db.prepare('SELECT * FROM market_products WHERE trace_code = ?').get(traceCode) as any;
    
    if (!product) {
      res.status(404).json({ error: '溯源码不存在' });
      return;
    }
    
    const records = db.prepare('SELECT * FROM trace_records WHERE trace_code = ? ORDER BY created_at ASC').all(traceCode);
    const farmer = db.prepare('SELECT id, name, phone, province, city FROM users WHERE id = ?').get(product.user_id);
    
    res.json({
      product,
      farmer,
      records
    });
  } catch (error) {
    console.error('Get trace error:', error);
    res.status(500).json({ error: '获取溯源信息失败' });
  }
})

router.post('/orders', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId, quantity, address } = req.body;
    
    const product = db.prepare('SELECT * FROM market_products WHERE id = ?').get(productId) as any;
    
    if (!product) {
      res.status(404).json({ error: '产品不存在' });
      return;
    }
    
    if (product.stock < quantity) {
      res.status(400).json({ error: '库存不足' });
      return;
    }
    
    const orderId = uuidv4();
    const orderNo = 'MK' + Date.now().toString(36).toUpperCase();
    const totalAmount = product.price * quantity;
    
    db.prepare(`
      INSERT INTO orders (
        id, order_no, user_id, type, total_amount, status,
        province, city, district, address, receiver_name, receiver_phone
      ) VALUES (?, ?, ?, 'market', ?, 'paid', ?, ?, ?, ?, ?, ?)
    `).run(
      orderId, orderNo, req.user!.id, totalAmount,
      address?.province, address?.city, address?.district,
      address?.detail, address?.name, address?.phone
    );
    
    db.prepare(`
      INSERT INTO order_items (id, order_id, product_id, product_name, product_image, price, quantity)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), orderId, productId, product.name,
      product.images ? JSON.parse(product.images)[0] : '', product.price, quantity
    );
    
    db.prepare('UPDATE market_products SET stock = stock - ?, sales = sales + ? WHERE id = ?').run(quantity, quantity, productId);
    
    setTimeout(() => {
      processColdChainLogistics(orderId, product);
    }, 5000);
    
    const user = db.prepare('SELECT total_trade_amount FROM users WHERE id = ?').get(req.user!.id) as any;
    const newTotal = (user?.total_trade_amount || 0) + totalAmount;
    db.prepare('UPDATE users SET total_trade_amount = ? WHERE id = ?').run(newTotal, req.user!.id);
    
    res.json({ orderId, orderNo, totalAmount });
  } catch (error) {
    console.error('Create market order error:', error);
    res.status(500).json({ error: '下单失败' });
  }
})

function calculateSmartPrice(productName: string, category: string, quality: string) {
  let basePrice = 3.0;
  
  for (const [name, data] of Object.entries(MARKET_PRICE_DATA)) {
    if (productName.includes(name) || name.includes(productName)) {
      basePrice = data.basePrice;
      
      const seasonalFactor = 1 + Math.sin(Date.now() / 1000 / 60 / 60 / 24 / 30 * Math.PI / 6) * data.volatility;
      const trendFactor = 1 + data.trend;
      
      const qualityMultipliers: Record<string, number> = {
        'premium': 1.3,
        'good': 1.0,
        'normal': 0.85
      };
      const qualityMultiplier = qualityMultipliers[quality] || 1.0;
      
      const suggestedPrice = Math.round(basePrice * seasonalFactor * trendFactor * qualityMultiplier * 100) / 100;
      
      let advice = '';
      if (data.trend > 0) {
        advice = '市场价格呈上涨趋势，建议适当提高定价，把握销售时机';
      } else if (data.trend < 0) {
        advice = '市场价格呈下降趋势，建议尽快出货，避免价格进一步下跌';
      } else {
        advice = '市场价格相对稳定，建议保持合理定价，保证销量';
      }
      
      return {
        basePrice: Math.round(basePrice * 100) / 100,
        suggestedPrice,
        trend: data.trend > 0 ? 'up' : data.trend < 0 ? 'down' : 'stable',
        qualityMultiplier,
        advice
      };
    }
  }
  
  return {
    basePrice,
    suggestedPrice: basePrice,
    trend: 'stable',
    qualityMultiplier: 1.0,
    advice: '建议参考当地市场行情定价'
  };
}

function processColdChainLogistics(orderId: string, product: any) {
  const trackingNo = 'CC' + Date.now().toString();
  
  db.prepare(`
    UPDATE orders SET 
      status = 'shipped',
      logistics_company = '冷链专车',
      tracking_no = ?,
      temperature = 8,
      humidity = 75,
      shipped_at = datetime('now')
    WHERE id = ?
  `).run(trackingNo, orderId);
  
  const insertTrack = db.prepare(`
    INSERT INTO logistics_tracks (id, order_id, status, location, description, temperature, humidity, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  
  insertTrack.run(
    uuidv4(), orderId, 'warehouse',
    product.origin,
    '货物已从产地发出，冷链运输车已启动制冷系统',
    8, 75
  );
  
  setTimeout(() => {
    insertTrack.run(
      uuidv4(), orderId, 'transit',
      '运输途中',
      '冷链运输中，温度稳定在5-10℃',
      6, 78
    );
  }, 20000);
  
  setTimeout(() => {
    insertTrack.run(
      uuidv4(), orderId, 'delivering',
      '配送站',
      '货物已到达目的地冷链配送中心',
      7, 72
    );
  }, 40000);
  
  setTimeout(() => {
    db.prepare(`
      UPDATE orders SET 
        status = 'completed',
        delivered_at = datetime('now'),
        completed_at = datetime('now')
      WHERE id = ?
    `).run(orderId);
    
    insertTrack.run(
      uuidv4(), orderId, 'delivered',
      '已签收',
      '货物已送达，全程冷链保障，请及时验货',
      null, null
    );
  }, 80000);
}

export default router
