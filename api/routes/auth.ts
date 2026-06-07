import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { generateToken, type AuthRequest, authMiddleware } from '../middleware/auth.js';

const router = Router()

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password, name, role = 'farmer' } = req.body;
    
    if (!phone || !password || !name) {
      res.status(400).json({ error: '手机号、密码、姓名为必填项' });
      return;
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existingUser) {
      res.status(400).json({ error: '该手机号已注册' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    db.prepare(`
      INSERT INTO users (id, phone, password, name, role, credit_score, member_level)
      VALUES (?, ?, ?, ?, ?, 650, 'normal')
    `).run(userId, phone, hashedPassword, name, role);

    const user = db.prepare('SELECT id, phone, name, role, credit_score, member_level FROM users WHERE id = ?').get(userId);
    const token = generateToken(user as any);

    res.json({
      token,
      user
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: '注册失败' });
  }
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      res.status(400).json({ error: '手机号和密码为必填项' });
      return;
    }

    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any;
    if (!user) {
      res.status(401).json({ error: '手机号或密码错误' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      res.status(401).json({ error: '手机号或密码错误' });
      return;
    }

    const token = generateToken({
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role
    });

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登录失败' });
  }
})

router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = db.prepare('SELECT id, phone, name, role, avatar, credit_score, member_level, total_trade_amount, total_plant_area, points, province, city, district, address, created_at FROM users WHERE id = ?').get(req.user!.id);
    
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
})

router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, avatar, province, city, district, address } = req.body;
    const userId = req.user!.id;

    db.prepare(`
      UPDATE users 
      SET name = COALESCE(?, name),
          avatar = COALESCE(?, avatar),
          province = COALESCE(?, province),
          city = COALESCE(?, city),
          district = COALESCE(?, district),
          address = COALESCE(?, address)
      WHERE id = ?
    `).run(name, avatar, province, city, district, address, userId);

    const user = db.prepare('SELECT id, phone, name, role, avatar, credit_score, member_level, total_trade_amount, total_plant_area, points, province, city, district, address, created_at FROM users WHERE id = ?').get(userId);
    
    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: '更新用户信息失败' });
  }
})

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  res.json({ message: '退出登录成功' });
})

export default router
