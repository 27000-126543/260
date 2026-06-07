import { Router, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { type AuthRequest, authMiddleware } from '../middleware/auth.js';

const router = Router()

const LOAN_PRODUCTS = [
  {
    id: 'loan001',
    name: '惠农经营贷',
    description: '面向农户的小额经营性贷款，用于购买农资、设备等',
    maxAmount: 500000,
    minAmount: 10000,
    interestRate: 0.048,
    termOptions: [6, 12, 24, 36],
    guaranteeType: '信用/担保',
    requirements: ['年满18周岁', '具有稳定的种植收入', '信用良好']
  },
  {
    id: 'loan002',
    name: '农机购置贷',
    description: '用于购买农业机械的专项贷款，享受政府贴息',
    maxAmount: 1000000,
    minAmount: 50000,
    interestRate: 0.035,
    termOptions: [12, 24, 36, 48, 60],
    guaranteeType: '设备抵押',
    requirements: ['购买农机用途明确', '提供购机合同', '具备还款能力']
  },
  {
    id: 'loan003',
    name: '土地流转贷',
    description: '针对土地流转规模经营主体的流动资金贷款',
    maxAmount: 2000000,
    minAmount: 100000,
    interestRate: 0.042,
    termOptions: [12, 24, 36],
    guaranteeType: '土地经营权抵押',
    requirements: ['土地流转合同', '经营规模50亩以上', '近2年盈利']
  }
];

router.use(authMiddleware);

router.get('/products', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = db.prepare('SELECT credit_score, total_plant_area, total_trade_amount FROM users WHERE id = ?').get(req.user!.id) as any;
    
    const productsWithLimit = LOAN_PRODUCTS.map(p => {
      const maxAvailable = calculateMaxLoanAmount(user, p.maxAmount);
      return {
        ...p,
        maxAvailable,
        userEligible: maxAvailable >= p.minAmount
      };
    });
    
    res.json(productsWithLimit);
  } catch (error) {
    console.error('Get loan products error:', error);
    res.status(500).json({ error: '获取贷款产品失败' });
  }
})

router.get('/credit-limit', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = db.prepare('SELECT credit_score, total_plant_area, total_trade_amount, member_level FROM users WHERE id = ?').get(req.user!.id) as any;
    
    const maxLoan = calculateMaxLoanAmount(user, 2000000);
    const factors = evaluateCreditFactors(user);
    
    res.json({
      userId: req.user!.id,
      creditScore: user?.credit_score || 650,
      maxLoanAmount: maxLoan,
      riskLevel: calculateRiskLevel(user?.credit_score || 650),
      factors,
      suggestion: generateLoanSuggestion(user, maxLoan)
    });
  } catch (error) {
    console.error('Get credit limit error:', error);
    res.status(500).json({ error: '获取授信额度失败' });
  }
})

router.get('/loans', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    
    let query = 'SELECT * FROM loan_applications WHERE user_id = ?';
    const params: any[] = [req.user!.id];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const loans = db.prepare(query).all(...params);
    res.json(loans);
  } catch (error) {
    console.error('Get loans error:', error);
    res.status(500).json({ error: '获取贷款列表失败' });
  }
})

router.post('/apply', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId, amount, term, purpose } = req.body;
    
    if (!productId || !amount || !term) {
      res.status(400).json({ error: '请填写完整的贷款信息' });
      return;
    }
    
    const product = LOAN_PRODUCTS.find(p => p.id === productId);
    if (!product) {
      res.status(400).json({ error: '贷款产品不存在' });
      return;
    }
    
    if (amount < product.minAmount || amount > product.maxAmount) {
      res.status(400).json({ error: `贷款金额应在${product.minAmount}-${product.maxAmount}元之间` });
      return;
    }
    
    const user = db.prepare('SELECT credit_score, total_plant_area, total_trade_amount FROM users WHERE id = ?').get(req.user!.id) as any;
    const maxAvailable = calculateMaxLoanAmount(user, product.maxAmount);
    
    if (amount > maxAvailable) {
      res.status(400).json({ error: `您的最大可贷金额为${maxAvailable}元` });
      return;
    }
    
    const applicationId = uuidv4();
    const { approved, approvedAmount, riskLevel, creditScoreUsed } = evaluateLoanApplication(user, amount, product);
    
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + term);
    
    db.prepare(`
      INSERT INTO loan_applications (
        id, user_id, product_name, amount, term, interest_rate, status,
        approved_amount, start_date, end_date, remaining_amount,
        credit_score_used, risk_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      applicationId, req.user!.id, product.name, amount, term, product.interestRate,
      approved ? 'approved' : 'pending',
      approved ? approvedAmount : null,
      approved ? startDate.toISOString().split('T')[0] : null,
      approved ? endDate.toISOString().split('T')[0] : null,
      approved ? approvedAmount : null,
      creditScoreUsed,
      riskLevel
    );
    
    if (approved) {
      db.prepare(`
        INSERT INTO system_notifications (id, user_id, type, title, content)
        VALUES (?, ?, 'loan_approved', '贷款审批通过', 
        '您的${product.name}申请已审批通过，放款金额${approvedAmount}元，请注意查收。')
      `).run(uuidv4(), req.user!.id);
      
      const monthsUntilDue = term;
      setTimeout(() => {
        db.prepare(`
          INSERT INTO system_notifications (id, user_id, type, title, content)
          VALUES (?, ?, 'loan_reminder', '贷款还款提醒', 
          '您的贷款即将到期，请按时还款，保持良好信用记录。')
        `).run(uuidv4(), req.user!.id);
      }, (monthsUntilDue - 1) * 30 * 24 * 60 * 60 * 1000);
    }
    
    const application = db.prepare('SELECT * FROM loan_applications WHERE id = ?').get(applicationId);
    
    res.json({
      application,
      approved,
      approvedAmount,
      message: approved ? '贷款已自动审批通过' : '贷款已提交，等待人工审核'
    });
  } catch (error) {
    console.error('Apply loan error:', error);
    res.status(500).json({ error: '申请贷款失败' });
  }
})

function calculateMaxLoanAmount(user: any, productMax: number): number {
  const baseAmount = 50000;
  
  const creditScoreFactor = Math.max(0.5, Math.min(1.5, ((user?.credit_score || 650) - 550) / 200));
  const areaFactor = Math.min(3, (user?.total_plant_area || 0) / 50);
  const tradeFactor = Math.min(3, (user?.total_trade_amount || 0) / 50000);
  
  const calculatedAmount = baseAmount * (1 + creditScoreFactor + areaFactor + tradeFactor);
  
  return Math.round(Math.min(calculatedAmount, productMax));
}

function evaluateCreditFactors(user: any) {
  const score = user?.credit_score || 650;
  const area = user?.total_plant_area || 0;
  const trade = user?.total_trade_amount || 0;
  const level = user?.member_level || 'normal';
  
  const levelScores: Record<string, number> = { normal: 0, silver: 50, gold: 100, diamond: 150 };
  
  return [
    { name: '信用评分', value: score, max: 850, weight: 0.35, status: score >= 700 ? 'good' : score >= 600 ? 'normal' : 'poor' },
    { name: '种植面积', value: area + '亩', max: 500, weight: 0.25, status: area >= 100 ? 'good' : area >= 30 ? 'normal' : 'poor' },
    { name: '交易流水', value: trade + '元', max: 500000, weight: 0.25, status: trade >= 100000 ? 'good' : trade >= 30000 ? 'normal' : 'poor' },
    { name: '会员等级', value: level, max: 4, weight: 0.15, status: level === 'diamond' ? 'good' : level !== 'normal' ? 'normal' : 'poor' }
  ];
}

function calculateRiskLevel(creditScore: number): string {
  if (creditScore >= 750) return 'low';
  if (creditScore >= 650) return 'medium';
  if (creditScore >= 550) return 'high';
  return 'very_high';
}

function evaluateLoanApplication(user: any, amount: number, product: any) {
  const creditScore = user?.credit_score || 650;
  const area = user?.total_plant_area || 0;
  const trade = user?.total_trade_amount || 0;
  
  let score = 0;
  
  if (creditScore >= 750) score += 35;
  else if (creditScore >= 700) score += 30;
  else if (creditScore >= 650) score += 25;
  else if (creditScore >= 600) score += 15;
  else score += 5;
  
  if (area >= 100) score += 25;
  else if (area >= 50) score += 20;
  else if (area >= 20) score += 15;
  else if (area >= 10) score += 10;
  else score += 5;
  
  if (trade >= 200000) score += 25;
  else if (trade >= 100000) score += 20;
  else if (trade >= 50000) score += 15;
  else if (trade >= 10000) score += 10;
  else score += 5;
  
  if (amount <= 50000) score += 15;
  else if (amount <= 100000) score += 10;
  else if (amount <= 300000) score += 5;
  
  const approved = score >= 60;
  const approvedAmount = approved ? Math.round(amount * (0.7 + score / 200)) : 0;
  const riskLevel = calculateRiskLevel(creditScore);
  
  return {
    approved,
    approvedAmount,
    riskLevel,
    creditScoreUsed: creditScore
  };
}

function generateLoanSuggestion(user: any, maxLoan: number): string {
  const area = user?.total_plant_area || 0;
  
  if (area >= 100) {
    return `您的种植规模较大，建议申请土地流转贷，最高可贷${maxLoan}元，用于扩大生产规模。`;
  } else if (area >= 30) {
    return `您的信用状况良好，建议申请惠农经营贷${maxLoan}元，用于购买农资和设备。`;
  } else {
    return `建议先积累种植经验和交易记录，逐步提高授信额度，目前可申请小额惠农贷款。`;
  }
}

export default router
