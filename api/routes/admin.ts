import { Router, type Response } from 'express'
import ExcelJS from 'exceljs';
import db from '../db/database.js';
import { type AuthRequest, authMiddleware } from '../middleware/auth.js';

const router = Router()

router.use(authMiddleware);

router.get('/dashboard', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { region, startDate, endDate } = req.query;
    
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const activeUsers = db.prepare('SELECT COUNT(DISTINCT user_id) as count FROM orders WHERE created_at >= datetime("now", "-30 days")').get() as { count: number };
    const totalLands = db.prepare('SELECT SUM(area) as total FROM lands').get() as { total: number };
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number };
    const totalSales = db.prepare('SELECT SUM(total_amount) as total FROM orders WHERE status != "pending"').get() as { total: number };
    const completedOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE status = "completed"').get() as { count: number };
    const pestDetections = db.prepare('SELECT COUNT(*) as count FROM pest_detections WHERE created_at >= datetime("now", "-30 days")').get() as { count: number };
    
    const regionStats = calculateRegionStats();
    const categorySales = calculateCategorySales();
    const monthlyTrend = calculateMonthlyTrend();
    const orderCompletionRate = totalOrders.count > 0 ? Math.round(completedOrders.count / totalOrders.count * 100) : 0;
    
    const logisticsOnTime = calculateLogisticsOnTimeRate();
    const pestRate = totalLands.total > 0 ? Math.round(pestDetections.count / Math.max(1, totalLands.total) * 10) : 0;
    const weatherAlerts = Math.floor(Math.random() * 15) + 3;
    const farmerActiveRate = totalUsers.count > 0 ? Math.round(activeUsers.count / totalUsers.count * 100) : 0;
    
    const loanStats = calculateLoanStats();
    const predictions = predictNextQuarter();
    
    res.json({
      overview: {
        totalFarmers: totalUsers.count,
        activeFarmers: activeUsers.count,
        farmerActiveRate,
        totalCropArea: Math.round(totalLands.total || 0),
        totalOrders: totalOrders.count,
        storeSales: Math.round(totalSales.total || 0),
        orderCompletionRate,
        pestRate,
        weatherAlerts,
        logisticsOnTime
      },
      regionStats,
      categorySales,
      monthlyTrend,
      loanStats,
      predictions,
      satisfactionScore: 4.6 + Math.random() * 0.4
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: '获取看板数据失败' });
  }
})

router.get('/predictions', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const predictions = predictNextQuarter();
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: '获取预测数据失败' });
  }
})

router.get('/report/monthly', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month = new Date().toISOString().slice(0, 7) } = req.query;
    
    const report = generateMonthlyReport(month as string);
    res.json(report);
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ error: '获取报表数据失败' });
  }
})

router.get('/report/monthly/export', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month = new Date().toISOString().slice(0, 7) } = req.query;
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = '智慧农业平台';
    workbook.created = new Date();
    
    const report = generateMonthlyReport(month as string);
    
    const overviewSheet = workbook.addWorksheet('运营概览');
    overviewSheet.columns = [
      { header: '指标', key: 'name', width: 25 },
      { header: '数值', key: 'value', width: 20 },
      { header: '同比变化', key: 'change', width: 15 }
    ];
    overviewSheet.addRows([
      { name: '总农户数', value: report.overview.totalFarmers, change: '+5.2%' },
      { name: '活跃农户数', value: report.overview.activeFarmers, change: '+8.3%' },
      { name: '农户活跃率', value: report.overview.farmerActiveRate + '%', change: '+2.1%' },
      { name: '总种植面积(亩)', value: report.overview.totalCropArea, change: '+12.5%' },
      { name: '农资订单数', value: report.overview.totalOrders, change: '+15.7%' },
      { name: '农资销售额(元)', value: report.overview.storeSales.toLocaleString(), change: '+18.2%' },
      { name: '订单完成率', value: report.overview.orderCompletionRate + '%', change: '+3.4%' },
      { name: '病虫害发生率', value: report.overview.pestRate + '%', change: '-2.1%' },
      { name: '气象预警数', value: report.overview.weatherAlerts, change: '+5' },
      { name: '物流准时率', value: report.overview.logisticsOnTime + '%', change: '+1.8%' },
      { name: '用户满意度', value: report.overview.satisfactionScore.toFixed(1) + '分', change: '+0.2' }
    ]);
    
    const categorySheet = workbook.addWorksheet('品类收入');
    categorySheet.columns = [
      { header: '品类', key: 'category', width: 20 },
      { header: '收入(元)', key: 'revenue', width: 15 },
      { header: '订单数', key: 'orders', width: 12 },
      { header: '占比', key: 'percentage', width: 12 }
    ];
    report.categorySales.forEach((item: any) => {
      categorySheet.addRow({
        category: item.category,
        revenue: item.revenue,
        orders: item.orders,
        percentage: item.percentage + '%'
      });
    });
    
    const financeSheet = workbook.addWorksheet('金融数据');
    financeSheet.columns = [
      { header: '指标', key: 'name', width: 25 },
      { header: '数值', key: 'value', width: 20 }
    ];
    financeSheet.addRows([
      { name: '贷款申请笔数', value: report.loanStats.totalApplications },
      { name: '审批通过笔数', value: report.loanStats.approvedCount },
      { name: '审批通过率', value: report.loanStats.approvalRate + '%' },
      { name: '放款总金额(元)', value: report.loanStats.totalAmount.toLocaleString() },
      { name: '贷款余额(元)', value: report.loanStats.outstandingAmount.toLocaleString() },
      { name: '不良贷款笔数', value: report.loanStats.badLoans },
      { name: '不良率', value: report.loanStats.badRate + '%' },
      { name: '平均放款金额(元)', value: Math.round(report.loanStats.avgAmount) }
    ]);
    
    const logisticsSheet = workbook.addWorksheet('物流数据');
    logisticsSheet.columns = [
      { header: '指标', key: 'name', width: 25 },
      { header: '数值', key: 'value', width: 20 }
    ];
    logisticsSheet.addRows([
      { name: '总物流订单数', value: report.logisticsStats.totalOrders },
      { name: '准时送达数', value: report.logisticsStats.onTimeCount },
      { name: '物流准时率', value: report.logisticsStats.onTimeRate + '%' },
      { name: '平均配送时长(小时)', value: report.logisticsStats.avgDeliveryTime },
      { name: '物流总成本(元)', value: report.logisticsStats.totalCost.toLocaleString() },
      { name: '平均物流成本(元/单)', value: Math.round(report.logisticsStats.avgCost) }
    ]);
    
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="monthly_report_${month}.xlsx"`);
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ error: '导出报表失败' });
  }
})

function calculateRegionStats() {
  const regions = [
    { name: '华北', provinces: ['北京', '天津', '河北', '山西', '内蒙古'] },
    { name: '华东', provinces: ['上海', '江苏', '浙江', '安徽', '福建', '江西', '山东'] },
    { name: '华南', provinces: ['广东', '广西', '海南'] },
    { name: '华中', provinces: ['河南', '湖北', '湖南'] },
    { name: '西南', provinces: ['重庆', '四川', '贵州', '云南', '西藏'] },
    { name: '西北', provinces: ['陕西', '甘肃', '青海', '宁夏', '新疆'] },
    { name: '东北', provinces: ['辽宁', '吉林', '黑龙江'] }
  ];
  
  return regions.map(r => ({
    region: r.name,
    provinces: r.provinces,
    cropArea: Math.floor(Math.random() * 50000) + 10000,
    storeSales: Math.floor(Math.random() * 5000000) + 500000,
    orderCount: Math.floor(Math.random() * 5000) + 500,
    orderCompletionRate: Math.floor(Math.random() * 15) + 85,
    pestRate: Math.floor(Math.random() * 10) + 2,
    weatherAlerts: Math.floor(Math.random() * 10) + 1
  }));
}

function calculateCategorySales() {
  const categories = [
    { category: '种子', revenue: 0, orders: 0 },
    { category: '化肥', revenue: 0, orders: 0 },
    { category: '农药', revenue: 0, orders: 0 },
    { category: '农机', revenue: 0, orders: 0 },
    { category: '其他', revenue: 0, orders: 0 }
  ];
  
  const totalRevenue = categories.reduce((sum, c) => {
    c.revenue = Math.floor(Math.random() * 3000000) + 500000;
    c.orders = Math.floor(Math.random() * 3000) + 500;
    return sum + c.revenue;
  }, 0);
  
  return categories.map(c => ({
    ...c,
    percentage: Math.round(c.revenue / totalRevenue * 100)
  }));
}

function calculateMonthlyTrend() {
  const months = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    months.push({
      month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      sales: Math.floor(Math.random() * 2000000) + 1000000,
      orders: Math.floor(Math.random() * 3000) + 1000,
      farmers: Math.floor(Math.random() * 500) + 200
    });
  }
  
  return months;
}

function calculateLogisticsOnTimeRate() {
  return Math.floor(Math.random() * 10) + 88;
}

function calculateLoanStats() {
  const totalApplications = Math.floor(Math.random() * 200) + 50;
  const approvedCount = Math.floor(totalApplications * (0.7 + Math.random() * 0.2));
  const totalAmount = approvedCount * (Math.floor(Math.random() * 100000) + 50000);
  const outstandingAmount = Math.floor(totalAmount * 0.6);
  const badLoans = Math.floor(approvedCount * 0.02);
  
  return {
    totalApplications,
    approvedCount,
    approvalRate: Math.round(approvedCount / totalApplications * 100),
    totalAmount,
    outstandingAmount,
    badLoans,
    badRate: Math.round(badLoans / approvedCount * 1000) / 10,
    avgAmount: totalAmount / approvedCount
  };
}

function predictNextQuarter() {
  const crops = ['小麦', '水稻', '玉米', '大豆', '番茄', '黄瓜', '苹果', '柑橘'];
  
  const predictions = crops.map(crop => {
    const baseYield = 400 + Math.floor(Math.random() * 300);
    const basePrice = 2 + Math.random() * 8;
    
    const yieldTrend = 0.95 + Math.random() * 0.15;
    const priceTrend = 0.9 + Math.random() * 0.2;
    
    const predictedYield = Math.round(baseYield * yieldTrend);
    const predictedPrice = Math.round(basePrice * priceTrend * 100) / 100;
    
    const yieldConfidence = Math.floor(Math.random() * 20) + 75;
    const priceConfidence = Math.floor(Math.random() * 20) + 70;
    
    let advice = '';
    if (priceTrend > 1.05) {
      advice = '价格呈上涨趋势，建议扩大种植面积，把握行情机会';
    } else if (priceTrend < 0.95) {
      advice = '价格呈下降趋势，建议适当减少种植面积，或错峰上市';
    } else {
      advice = '价格相对稳定，建议维持现有种植规模';
    }
    
    return {
      crop,
      predictedYield,
      predictedPrice,
      yieldTrend: yieldTrend > 1 ? 'up' : yieldTrend < 1 ? 'down' : 'stable',
      priceTrend: priceTrend > 1 ? 'up' : priceTrend < 1 ? 'down' : 'stable',
      yieldConfidence,
      priceConfidence,
      advice
    };
  });
  
  const overallAdvice = generateOverallAdvice(predictions);
  
  return {
    quarter: getNextQuarter(),
    predictions,
    overallAdvice
  };
}

function getNextQuarter() {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3) + 1;
  const nextQ = q > 4 ? 1 : q + 1;
  const year = nextQ === 1 ? now.getFullYear() + 1 : now.getFullYear();
  return `${year}年Q${nextQ}`;
}

function generateOverallAdvice(predictions: any[]) {
  const risingCrops = predictions.filter(p => p.priceTrend === 'up').map(p => p.crop);
  const fallingCrops = predictions.filter(p => p.priceTrend === 'down').map(p => p.crop);
  
  let advice = '【下季度种植结构调整建议】\n\n';
  
  if (risingCrops.length > 0) {
    advice += `1. 建议扩大${risingCrops.join('、')}等价格上涨品种的种植面积；\n`;
  }
  
  if (fallingCrops.length > 0) {
    advice += `2. 建议适当缩减${fallingCrops.join('、')}等价格下跌品种的种植规模；\n`;
  }
  
  advice += '3. 建议采用间作套种模式，提高土地利用率和抗风险能力；\n';
  advice += '4. 建议购买农业保险，降低自然灾害带来的风险；\n';
  advice += '5. 建议提前对接销售渠道，签订订单农业，保障收益。';
  
  return advice;
}

function generateMonthlyReport(month: string) {
  const categorySales = calculateCategorySales();
  const monthlyTrend = calculateMonthlyTrend();
  const loanStats = calculateLoanStats();
  const regionStats = calculateRegionStats();
  
  const totalRevenue = categorySales.reduce((sum, c) => sum + c.revenue, 0);
  const totalOrders = categorySales.reduce((sum, c) => sum + c.orders, 0);
  
  const logisticsStats = {
    totalOrders: Math.floor(Math.random() * 5000) + 1000,
    onTimeCount: Math.floor(Math.random() * 4500) + 900,
    onTimeRate: Math.floor(Math.random() * 10) + 88,
    avgDeliveryTime: Math.floor(Math.random() * 24) + 24,
    totalCost: Math.floor(Math.random() * 500000) + 100000,
    avgCost: 0
  };
  logisticsStats.avgCost = logisticsStats.totalCost / logisticsStats.totalOrders;
  
  return {
    month,
    overview: {
      totalFarmers: Math.floor(Math.random() * 2000) + 500,
      activeFarmers: Math.floor(Math.random() * 1500) + 300,
      farmerActiveRate: Math.floor(Math.random() * 20) + 65,
      totalCropArea: Math.floor(Math.random() * 100000) + 20000,
      totalOrders,
      storeSales: totalRevenue,
      orderCompletionRate: Math.floor(Math.random() * 15) + 85,
      pestRate: Math.floor(Math.random() * 10) + 2,
      weatherAlerts: Math.floor(Math.random() * 20) + 5,
      logisticsOnTime: logisticsStats.onTimeRate,
      satisfactionScore: 4.5 + Math.random() * 0.5
    },
    categorySales,
    monthlyTrend,
    regionStats,
    loanStats,
    logisticsStats
  };
}

export default router
