import { Router, type Response } from 'express'
import db from '../db/database.js';
import { type AuthRequest, authMiddleware } from '../middleware/auth.js';

const router = Router()

const MEMBER_LEVELS = {
  normal: {
    name: '普通会员',
    color: '#9ca3af',
    icon: '👤',
    threshold: { tradeAmount: 0, plantArea: 0 },
    benefits: [
      { name: '基础农技咨询', enabled: true },
      { name: '农资采购折扣', value: '98折', enabled: true },
      { name: '优先采购', enabled: false },
      { name: '免运费', enabled: false },
      { name: '免费专家诊断', enabled: false },
      { name: '专属客服', enabled: false }
    ]
  },
  silver: {
    name: '银卡会员',
    color: '#a0aec0',
    icon: '🥈',
    threshold: { tradeAmount: 10000, plantArea: 20 },
    benefits: [
      { name: '基础农技咨询', enabled: true },
      { name: '农资采购折扣', value: '95折', enabled: true },
      { name: '优先采购', enabled: true },
      { name: '免运费', value: '每月2次', enabled: true },
      { name: '免费专家诊断', enabled: false },
      { name: '专属客服', enabled: false }
    ]
  },
  gold: {
    name: '金卡会员',
    color: '#f59e0b',
    icon: '🥇',
    threshold: { tradeAmount: 50000, plantArea: 50 },
    benefits: [
      { name: '基础农技咨询', enabled: true },
      { name: '农资采购折扣', value: '9折', enabled: true },
      { name: '优先采购', enabled: true },
      { name: '免运费', value: '不限次数', enabled: true },
      { name: '免费专家诊断', value: '每月3次', enabled: true },
      { name: '专属客服', enabled: false }
    ]
  },
  diamond: {
    name: '钻石会员',
    color: '#3b82f6',
    icon: '💎',
    threshold: { tradeAmount: 100000, plantArea: 100 },
    benefits: [
      { name: '基础农技咨询', enabled: true },
      { name: '农资采购折扣', value: '85折', enabled: true },
      { name: '优先采购', enabled: true },
      { name: '免运费', value: '不限次数', enabled: true },
      { name: '免费专家诊断', value: '不限次数', enabled: true },
      { name: '专属客服', enabled: true }
    ]
  }
};

router.use(authMiddleware);

router.get('/info', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = db.prepare('SELECT id, name, phone, member_level, total_trade_amount, total_plant_area, points, credit_score FROM users WHERE id = ?').get(req.user!.id) as any;
    
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }
    
    const currentLevel = user.member_level || 'normal';
    const levelInfo = MEMBER_LEVELS[currentLevel as keyof typeof MEMBER_LEVELS];
    
    const nextLevels = ['normal', 'silver', 'gold', 'diamond'];
    const currentIndex = nextLevels.indexOf(currentLevel);
    const nextLevel = currentIndex < nextLevels.length - 1 ? nextLevels[currentIndex + 1] : null;
    const nextLevelInfo = nextLevel ? MEMBER_LEVELS[nextLevel as keyof typeof MEMBER_LEVELS] : null;
    
    const tradeProgress = nextLevelInfo 
      ? Math.min(100, Math.round(user.total_trade_amount / nextLevelInfo.threshold.tradeAmount * 100))
      : 100;
    
    const areaProgress = nextLevelInfo
      ? Math.min(100, Math.round(user.total_plant_area / nextLevelInfo.threshold.plantArea * 100))
      : 100;
    
    const upgradeProgress = Math.max(tradeProgress, areaProgress);
    
    const notifications = db.prepare('SELECT * FROM system_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 10').all(req.user!.id);
    
    res.json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        creditScore: user.credit_score,
        points: user.points
      },
      currentLevel: {
        code: currentLevel,
        ...levelInfo
      },
      stats: {
        totalTradeAmount: user.total_trade_amount || 0,
        totalPlantArea: user.total_plant_area || 0,
        points: user.points || 0
      },
      nextLevel: nextLevel ? {
        code: nextLevel,
        ...nextLevelInfo
      } : null,
      upgradeProgress,
      tradeProgress,
      areaProgress,
      upgradeTips: generateUpgradeTips(user, nextLevelInfo),
      notifications
    });
  } catch (error) {
    console.error('Get member info error:', error);
    res.status(500).json({ error: '获取会员信息失败' });
  }
})

router.get('/levels', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const levels = Object.entries(MEMBER_LEVELS).map(([code, info]) => ({
      code,
      ...info
    }));
    
    res.json(levels);
  } catch (error) {
    console.error('Get member levels error:', error);
    res.status(500).json({ error: '获取会员等级失败' });
  }
})

function generateUpgradeTips(user: any, nextLevel: any): string[] {
  if (!nextLevel) {
    return ['恭喜您已达到最高等级，享受全部会员权益！'];
  }
  
  const tips = [];
  const { total_trade_amount = 0, total_plant_area = 0 } = user;
  
  const tradeDiff = nextLevel.threshold.tradeAmount - total_trade_amount;
  const areaDiff = nextLevel.threshold.plantArea - total_plant_area;
  
  if (tradeDiff > 0) {
    tips.push(`累计交易金额再增加${tradeDiff.toLocaleString()}元即可升级，建议多使用平台进行农资采购和农产品销售`);
  }
  
  if (areaDiff > 0) {
    tips.push(`种植面积再增加${areaDiff}亩即可升级，可通过绑定更多土地或土地流转扩大规模`);
  }
  
  if (tradeDiff <= 0 && areaDiff <= 0) {
    tips.push('您已满足升级条件，系统即将自动为您升级');
  }
  
  tips.push('保持良好的交易记录和信用评价，有助于快速提升会员等级');
  
  return tips;
}

export default router
