import { Router, type Response, type Request } from 'express'
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { type AuthRequest, authMiddleware } from '../middleware/auth.js';

const router = Router()

interface SSEClient {
  id: string;
  orderId: string;
  res: Response;
}

const sseClients = new Map<string, SSEClient[]>();

function addSSEClient(orderId: string, client: SSEClient) {
  if (!sseClients.has(orderId)) {
    sseClients.set(orderId, []);
  }
  sseClients.get(orderId)!.push(client);
  console.log(`[STORE] SSE客户端连接: 订单 ${orderId}, 当前连接数: ${sseClients.get(orderId)!.length}`);
}

function removeSSEClient(orderId: string, clientId: string) {
  const clients = sseClients.get(orderId);
  if (clients) {
    const filtered = clients.filter(c => c.id !== clientId);
    if (filtered.length === 0) {
      sseClients.delete(orderId);
    } else {
      sseClients.set(orderId, filtered);
    }
    console.log(`[STORE] SSE客户端断开: 订单 ${orderId}, 剩余连接数: ${filtered.length}`);
  }
}

function broadcastToSSEClients(orderId: string, data: any) {
  const clients = sseClients.get(orderId);
  if (!clients) return;
  
  console.log(`[STORE] 向 ${clients.length} 个客户端推送物流更新: 订单 ${orderId}, 状态: ${data.status}`);
  
  clients.forEach(client => {
    try {
      client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (err) {
      console.error(`[STORE] SSE推送失败: 订单 ${orderId}`, err);
    }
  });
}

interface Warehouse {
  id: string;
  name: string;
  province: string;
  city: string;
  district: string;
  address: string;
  latitude: number;
  longitude: number;
  manager: string;
  phone: string;
}

const PRODUCTS = [
  { id: 'p001', name: '优质小麦种子-济麦22', category: '种子', price: 5.5, unit: 'kg', image: '🌾', description: '高产抗病，适应性广，亩产可达600kg以上', stock: 10000, specs: ['5kg装', '10kg装', '25kg装'] },
  { id: 'p002', name: '杂交水稻-深两优5814', category: '种子', price: 28.0, unit: 'kg', image: '🌾', description: '超级稻品种，米质优，抗病性强', stock: 5000, specs: ['1kg装', '5kg装'] },
  { id: 'p003', name: '尿素（含氮46%）', category: '化肥', price: 2.2, unit: 'kg', image: '🧪', description: '高含量氮肥，速效性好，适用各类作物', stock: 50000, specs: ['25kg装', '50kg装'] },
  { id: 'p004', name: '氮磷钾复合肥15-15-15', category: '化肥', price: 3.0, unit: 'kg', image: '🧪', description: '均衡营养，肥效持久，通用型复合肥', stock: 30000, specs: ['25kg装', '50kg装'] },
  { id: 'p005', name: '有机肥料（腐熟型）', category: '化肥', price: 0.8, unit: 'kg', image: '🌱', description: '改良土壤，培肥地力，绿色环保', stock: 80000, specs: ['40kg装', '100kg装'] },
  { id: 'p006', name: '草甘膦除草剂', category: '农药', price: 25.0, unit: 'L', image: '☠️', description: '广谱灭生性除草剂，死草彻底', stock: 10000, specs: ['1L装', '5L装', '20L装'] },
  { id: 'p007', name: '吡虫啉杀虫剂', category: '农药', price: 80.0, unit: 'kg', image: '🐛', description: '高效低毒，防治蚜虫、飞虱等刺吸式害虫', stock: 2000, specs: ['100g装', '500g装'] },
  { id: 'p008', name: '多菌灵杀菌剂', category: '农药', price: 45.0, unit: 'kg', image: '🦠', description: '广谱杀菌剂，防治多种真菌病害', stock: 3000, specs: ['200g装', '1kg装'] },
];

function initInventory() {
  const count = db.prepare('SELECT COUNT(*) as count FROM inventory').get() as { count: number };
  if (count.count === 0) {
    const warehouses = db.prepare('SELECT id FROM warehouses').all() as Warehouse[];
    const insertInv = db.prepare('INSERT INTO inventory (id, warehouse_id, product_id, quantity) VALUES (?, ?, ?, ?)');
    
    warehouses.forEach(wh => {
      PRODUCTS.forEach(p => {
        insertInv.run(uuidv4(), wh.id, p.id, Math.floor(Math.random() * 5000) + 500);
      });
    });
  }
}

initInventory();

router.get('/products', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, keyword } = req.query;
    
    let products = [...PRODUCTS];
    
    if (category) {
      products = products.filter(p => p.category === category);
    }
    
    if (keyword) {
      const kw = (keyword as string).toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(kw) || 
        p.description.toLowerCase().includes(kw)
      );
    }
    
    res.json(products);
  } catch (error: any) {
    console.error('[STORE] 获取商品列表失败:', error.message);
    res.status(500).json({ error: '获取商品列表失败' });
  }
})

router.get('/products/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = PRODUCTS.find(p => p.id === req.params.id);
    
    if (!product) {
      res.status(404).json({ error: '商品不存在' });
      return;
    }
    
    const inventory = db.prepare(`
      SELECT w.*, i.quantity 
      FROM inventory i
      JOIN warehouses w ON i.warehouse_id = w.id
      WHERE i.product_id = ? AND i.quantity > 0
    `).all(req.params.id);
    
    res.json({ ...product, inventory });
  } catch (error: any) {
    console.error('[STORE] 获取商品详情失败:', error.message);
    res.status(500).json({ error: '获取商品详情失败' });
  }
})

router.get('/logistics/stream/:orderId', async (req: Request, res: Response): Promise<void> => {
  const orderId = req.params.orderId;
  const clientId = uuidv4();
  
  const token = req.query.token as string;
  let userId: string | null = null;
  
  if (token) {
    try {
      const { verify } = await import('jsonwebtoken');
      const decoded = verify(token, process.env.JWT_SECRET || 'your_jwt_secret') as any;
      userId = decoded.id;
    } catch (e) {
      res.status(401).json({ error: '未授权访问' });
      return;
    }
  } else {
    res.status(401).json({ error: '未授权访问' });
    return;
  }
  
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, userId);
  if (!order) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  
  res.flushHeaders();
  
  addSSEClient(orderId, { id: clientId, orderId, res });
  
  const existingTracks = db.prepare('SELECT * FROM logistics_tracks WHERE order_id = ? ORDER BY created_at ASC').all(orderId);
  if (existingTracks.length > 0) {
    res.write(`data: ${JSON.stringify({ type: 'init', tracks: existingTracks })}\n\n`);
  }
  
  req.on('close', () => {
    removeSSEClient(orderId, clientId);
  });
});

router.get('/orders', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    
    let query = 'SELECT * FROM orders WHERE user_id = ?';
    const params: any[] = [req.user!.id];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const orders = db.prepare(query).all(...params) as any[];
    
    const ordersWithItems = await Promise.all(orders.map(async (order: any) => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      const tracks = db.prepare('SELECT * FROM logistics_tracks WHERE order_id = ? ORDER BY created_at DESC').all(order.id);
      return { ...order, items, tracks };
    }));
    
    res.json(ordersWithItems);
  } catch (error: any) {
    console.error('[STORE] 获取订单列表失败:', error.message);
    res.status(500).json({ error: '获取订单列表失败' });
  }
})

router.post('/orders', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { items, province, city, district, address, receiver_name, receiver_phone } = req.body;
    
    if (!items || items.length === 0) {
      res.status(400).json({ error: '购物车为空' });
      return;
    }
    
    if (!province || !city || !address || !receiver_name || !receiver_phone) {
      res.status(400).json({ error: '请填写完整的收货信息' });
      return;
    }
    
    const nearestWarehouse = findNearestWarehouse(province, city, items);
    
    if (!nearestWarehouse) {
      res.status(400).json({ error: '附近仓库库存不足，请调整商品数量' });
      return;
    }
    
    const orderId = uuidv4();
    const orderNo = 'AG' + Date.now().toString(36).toUpperCase();
    
    let totalAmount = 0;
    const insertItem = db.prepare(`
      INSERT INTO order_items (id, order_id, product_id, product_name, product_image, spec, price, quantity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const item of items) {
      const product = PRODUCTS.find(p => p.id === item.productId);
      if (!product) continue;
      
      const price = product.price * (item.quantity || 1);
      totalAmount += price;
      
      insertItem.run(
        uuidv4(),
        orderId,
        item.productId,
        product.name,
        product.image,
        item.spec || product.specs[0],
        product.price,
        item.quantity || 1
      );
    }
    
    db.prepare(`
      INSERT INTO orders (
        id, order_no, user_id, total_amount, status,
        province, city, district, address, receiver_name, receiver_phone,
        warehouse_id, paid_at
      ) VALUES (?, ?, ?, ?, 'paid', ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      orderId, orderNo, req.user!.id, totalAmount,
      province, city, district, address, receiver_name, receiver_phone,
      nearestWarehouse.id
    );
    
    await processOrderShipment(orderId, nearestWarehouse);
    
    const user = db.prepare('SELECT total_trade_amount FROM users WHERE id = ?').get(req.user!.id) as any;
    const newTotal = (user?.total_trade_amount || 0) + totalAmount;
    db.prepare('UPDATE users SET total_trade_amount = ? WHERE id = ?').run(newTotal, req.user!.id);
    
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
    
    console.log(`[STORE] 订单创建成功: ${orderNo}, 金额: ¥${totalAmount.toFixed(2)}`);
    res.json({ ...(order as object), items: orderItems });
  } catch (error: any) {
    console.error('[STORE] 创建订单失败:', error.message);
    res.status(500).json({ error: '创建订单失败' });
  }
})

router.get('/orders/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
    
    if (!order) {
      res.status(404).json({ error: '订单不存在' });
      return;
    }
    
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(req.params.id);
    const tracks = db.prepare('SELECT * FROM logistics_tracks WHERE order_id = ? ORDER BY created_at ASC').all(req.params.id);
    const warehouse = order.warehouse_id ? db.prepare('SELECT * FROM warehouses WHERE id = ?').get(order.warehouse_id) : null;
    
    res.json({ ...order, items, tracks, warehouse });
  } catch (error: any) {
    console.error('[STORE] 获取订单详情失败:', error.message);
    res.status(500).json({ error: '获取订单详情失败' });
  }
})

function findNearestWarehouse(province: string, city: string, items: any[]): Warehouse | null {
  const warehouses = db.prepare('SELECT * FROM warehouses').all() as Warehouse[];
  
  if (warehouses.length === 0) return null;
  
  const scoredWarehouses = warehouses.map(wh => {
    let score = 0;
    
    if (wh.province === province) score += 50;
    if (wh.city === city) score += 30;
    
    const hasStock = items.every(item => {
      const inv = db.prepare('SELECT quantity FROM inventory WHERE warehouse_id = ? AND product_id = ?').get(wh.id, item.productId) as any;
      return inv && inv.quantity >= (item.quantity || 1);
    });
    
    if (!hasStock) return null;
    
    return { warehouse: wh, score };
  }).filter(Boolean) as { warehouse: Warehouse; score: number }[];
  
  if (scoredWarehouses.length === 0) return null;
  
  scoredWarehouses.sort((a, b) => b.score - a.score);
  return scoredWarehouses[0].warehouse;
}

const LOGISTICS_STAGES = [
  {
    status: 'warehouse',
    location: '{warehouse}',
    description: '货物已从仓库发出，正在分拣打包',
    delay: 2000,
    tempRange: [14, 18],
    humidityRange: [60, 70]
  },
  {
    status: 'transit',
    location: '运输途中',
    description: '货物正在冷链运输中，全程温控',
    delay: 8000,
    tempRange: [8, 15],
    humidityRange: [65, 75]
  },
  {
    status: 'delivering',
    location: '配送站',
    description: '货物已到达目的地城市，正在安排配送',
    delay: 8000,
    tempRange: [6, 12],
    humidityRange: [70, 80]
  },
  {
    status: 'delivered',
    location: '已签收',
    description: '货物已成功签收，感谢您的购买',
    delay: 12000,
    tempRange: [null, null],
    humidityRange: [null, null]
  }
];

async function processOrderShipment(orderId: string, warehouse: Warehouse) {
  const trackingNo = 'SF' + Date.now().toString();
  
  db.prepare(`
    UPDATE orders SET 
      status = 'shipped',
      logistics_company = '顺丰冷链',
      tracking_no = ?,
      shipped_at = datetime('now')
    WHERE id = ?
  `).run(trackingNo, orderId);
  
  const insertTrack = db.prepare(`
    INSERT INTO logistics_tracks (id, order_id, status, location, description, temperature, humidity, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  
  for (let i = 0; i < LOGISTICS_STAGES.length; i++) {
    const stage = LOGISTICS_STAGES[i];
    
    await new Promise(resolve => setTimeout(resolve, stage.delay));
    
    const temp = stage.tempRange[0] !== null 
      ? Math.round(stage.tempRange[0] + Math.random() * (stage.tempRange[1] - stage.tempRange[0]))
      : null;
    
    const humidity = stage.humidityRange[0] !== null
      ? Math.round(stage.humidityRange[0] + Math.random() * (stage.humidityRange[1] - stage.humidityRange[0]))
      : null;
    
    const location = stage.location.replace('{warehouse}', `${warehouse.province}${warehouse.city}`);
    
    const trackId = uuidv4();
    insertTrack.run(trackId, orderId, stage.status, location, stage.description, temp, humidity);
    
    if (stage.status === 'delivered') {
      db.prepare(`
        UPDATE orders SET 
          status = 'completed',
          delivered_at = datetime('now'),
          completed_at = datetime('now')
        WHERE id = ?
      `).run(orderId);
    }
    
    const trackData = {
      id: trackId,
      orderId,
      status: stage.status,
      location,
      description: stage.description,
      temperature: temp,
      humidity,
      createdAt: new Date().toISOString()
    };
    
    broadcastToSSEClients(orderId, { type: 'update', track: trackData });
    
    console.log(`[STORE] 物流更新: 订单 ${orderId}, 状态: ${stage.status}, 温度: ${temp}°C, 湿度: ${humidity}%`);
  }
}

export default router
