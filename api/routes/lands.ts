import { Router, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { type AuthRequest, authMiddleware } from '../middleware/auth.js';

const router = Router()

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lands = db.prepare('SELECT * FROM lands WHERE user_id = ?').all(req.user!.id);
    res.json(lands);
  } catch (error) {
    console.error('Get lands error:', error);
    res.status(500).json({ error: '获取土地列表失败' });
  }
})

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const land = db.prepare('SELECT * FROM lands WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id);
    
    if (!land) {
      res.status(404).json({ error: '土地不存在' });
      return;
    }

    const records = db.prepare('SELECT * FROM planting_records WHERE land_id = ? ORDER BY created_at DESC').all(req.params.id);

    res.json({ ...(land as object), records });
  } catch (error) {
    console.error('Get land detail error:', error);
    res.status(500).json({ error: '获取土地详情失败' });
  }
})

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name, area, province, city, district, location,
      latitude, longitude, soil_type, ph_value, organic_matter,
      nitrogen, phosphorus, potassium, current_crop
    } = req.body;

    if (!name || !area) {
      res.status(400).json({ error: '土地名称和面积为必填项' });
      return;
    }

    const landId = uuidv4();
    
    db.prepare(`
      INSERT INTO lands (
        id, user_id, name, area, province, city, district, location,
        latitude, longitude, soil_type, ph_value, organic_matter,
        nitrogen, phosphorus, potassium, current_crop
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      landId, req.user!.id, name, area, province, city, district, location,
      latitude, longitude, soil_type, ph_value, organic_matter,
      nitrogen, phosphorus, potassium, current_crop
    );

    const user = db.prepare('SELECT total_plant_area FROM users WHERE id = ?').get(req.user!.id) as any;
    const newTotalArea = (user?.total_plant_area || 0) + area;
    db.prepare('UPDATE users SET total_plant_area = ? WHERE id = ?').run(newTotalArea, req.user!.id);

    updateMemberLevel(req.user!.id);

    const land = db.prepare('SELECT * FROM lands WHERE id = ?').get(landId);
    res.json(land);
  } catch (error) {
    console.error('Create land error:', error);
    res.status(500).json({ error: '添加土地失败' });
  }
})

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const land = db.prepare('SELECT * FROM lands WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id);
    
    if (!land) {
      res.status(404).json({ error: '土地不存在' });
      return;
    }

    const {
      name, area, province, city, district, location,
      latitude, longitude, soil_type, ph_value, organic_matter,
      nitrogen, phosphorus, potassium, current_crop
    } = req.body;

    db.prepare(`
      UPDATE lands SET
        name = COALESCE(?, name),
        area = COALESCE(?, area),
        province = COALESCE(?, province),
        city = COALESCE(?, city),
        district = COALESCE(?, district),
        location = COALESCE(?, location),
        latitude = COALESCE(?, latitude),
        longitude = COALESCE(?, longitude),
        soil_type = COALESCE(?, soil_type),
        ph_value = COALESCE(?, ph_value),
        organic_matter = COALESCE(?, organic_matter),
        nitrogen = COALESCE(?, nitrogen),
        phosphorus = COALESCE(?, phosphorus),
        potassium = COALESCE(?, potassium),
        current_crop = COALESCE(?, current_crop)
      WHERE id = ?
    `).run(
      name, area, province, city, district, location,
      latitude, longitude, soil_type, ph_value, organic_matter,
      nitrogen, phosphorus, potassium, current_crop, req.params.id
    );

    const updatedLand = db.prepare('SELECT * FROM lands WHERE id = ?').get(req.params.id);
    res.json(updatedLand);
  } catch (error) {
    console.error('Update land error:', error);
    res.status(500).json({ error: '更新土地失败' });
  }
})

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const land = db.prepare('SELECT * FROM lands WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
    
    if (!land) {
      res.status(404).json({ error: '土地不存在' });
      return;
    }

    const user = db.prepare('SELECT total_plant_area FROM users WHERE id = ?').get(req.user!.id) as any;
    const newTotalArea = Math.max(0, (user?.total_plant_area || 0) - land.area);
    db.prepare('UPDATE users SET total_plant_area = ? WHERE id = ?').run(newTotalArea, req.user!.id);

    db.prepare('DELETE FROM lands WHERE id = ?').run(req.params.id);
    
    updateMemberLevel(req.user!.id);

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete land error:', error);
    res.status(500).json({ error: '删除土地失败' });
  }
})

function updateMemberLevel(userId: string) {
  const user = db.prepare('SELECT total_trade_amount, total_plant_area FROM users WHERE id = ?').get(userId) as any;
  if (!user) return;

  const { total_trade_amount = 0, total_plant_area = 0 } = user;
  
  let level = 'normal';
  if ((total_trade_amount >= 100000 && total_plant_area >= 100) || total_plant_area >= 500) {
    level = 'diamond';
  } else if ((total_trade_amount >= 50000 && total_plant_area >= 50) || total_plant_area >= 200) {
    level = 'gold';
  } else if ((total_trade_amount >= 10000 && total_plant_area >= 20) || total_plant_area >= 50) {
    level = 'silver';
  }

  const currentLevel = db.prepare('SELECT member_level FROM users WHERE id = ?').get(userId) as any;
  if (currentLevel?.member_level !== level) {
    db.prepare('UPDATE users SET member_level = ? WHERE id = ?').run(level, userId);
    
    const levelNames: Record<string, string> = {
      silver: '银卡会员',
      gold: '金卡会员',
      diamond: '钻石会员'
    };
    
    if (level !== 'normal' && levelNames[level]) {
      db.prepare(`
        INSERT INTO system_notifications (id, user_id, type, title, content)
        VALUES (?, ?, 'member_upgrade', ?, ?)
      `).run(
        uuidv4(),
        userId,
        `🎉 恭喜升级为${levelNames[level]}！`,
        `您已升级为${levelNames[level]}，享受更多专属权益：优先采购、免运费、免费农技咨询等。`
      );
    }
  }
}

export default router
