import { Router, type Response } from 'express'
import db from '../db/database.js';
import { type AuthRequest, authMiddleware } from '../middleware/auth.js';

const router = Router()

router.use(authMiddleware);

interface CropData {
  name: string;
  category: string;
  minPh: number;
  maxPh: number;
  minOrganic: number;
  optimalN: [number, number];
  optimalP: [number, number];
  optimalK: [number, number];
  growthDays: number;
  baseYield: number;
  pricePerUnit: number;
  suitableRegions: string[];
}

const CROP_DATABASE: CropData[] = [
  { name: '优质小麦', category: '粮食作物', minPh: 6.0, maxPh: 7.5, minOrganic: 1.0, optimalN: [80, 120], optimalP: [60, 90], optimalK: [40, 70], growthDays: 230, baseYield: 600, pricePerUnit: 2.8, suitableRegions: ['北京', '河北', '山东', '河南', '陕西'] },
  { name: '杂交水稻', category: '粮食作物', minPh: 5.5, maxPh: 7.0, minOrganic: 1.5, optimalN: [120, 180], optimalP: [50, 80], optimalK: [60, 100], growthDays: 140, baseYield: 750, pricePerUnit: 3.2, suitableRegions: ['江苏', '浙江', '湖南', '湖北', '四川', '广东'] },
  { name: '玉米', category: '粮食作物', minPh: 5.5, maxPh: 8.0, minOrganic: 0.8, optimalN: [150, 200], optimalP: [80, 120], optimalK: [50, 90], growthDays: 120, baseYield: 650, pricePerUnit: 2.5, suitableRegions: ['黑龙江', '吉林', '辽宁', '内蒙古', '山东', '河南'] },
  { name: '大豆', category: '经济作物', minPh: 6.0, maxPh: 7.5, minOrganic: 1.2, optimalN: [40, 60], optimalP: [80, 110], optimalK: [60, 90], growthDays: 110, baseYield: 220, pricePerUnit: 5.0, suitableRegions: ['黑龙江', '吉林', '辽宁', '山东', '河南'] },
  { name: '棉花', category: '经济作物', minPh: 6.5, maxPh: 8.0, minOrganic: 0.6, optimalN: [120, 180], optimalP: [60, 100], optimalK: [100, 150], growthDays: 160, baseYield: 120, pricePerUnit: 18.0, suitableRegions: ['新疆', '山东', '河北', '河南', '湖北'] },
  { name: '番茄', category: '蔬菜', minPh: 6.0, maxPh: 7.0, minOrganic: 2.0, optimalN: [180, 250], optimalP: [100, 150], optimalK: [200, 280], growthDays: 90, baseYield: 5000, pricePerUnit: 4.5, suitableRegions: ['山东', '河北', '河南', '江苏', '浙江'] },
  { name: '黄瓜', category: '蔬菜', minPh: 5.5, maxPh: 7.0, minOrganic: 2.0, optimalN: [200, 280], optimalP: [80, 120], optimalK: [180, 250], growthDays: 60, baseYield: 4000, pricePerUnit: 3.8, suitableRegions: ['山东', '河南', '江苏', '四川', '广东'] },
  { name: '苹果', category: '水果', minPh: 5.5, maxPh: 7.0, minOrganic: 1.5, optimalN: [80, 120], optimalP: [40, 60], optimalK: [100, 150], growthDays: 180, baseYield: 1500, pricePerUnit: 6.0, suitableRegions: ['山东', '陕西', '山西', '河北', '甘肃'] },
  { name: '柑橘', category: '水果', minPh: 5.5, maxPh: 6.5, minOrganic: 2.0, optimalN: [100, 150], optimalP: [50, 80], optimalK: [120, 180], growthDays: 210, baseYield: 1200, pricePerUnit: 5.5, suitableRegions: ['广东', '广西', '福建', '浙江', '四川'] },
  { name: '茶叶', category: '经济作物', minPh: 4.5, maxPh: 5.5, minOrganic: 2.0, optimalN: [100, 150], optimalP: [40, 60], optimalK: [60, 100], growthDays: 300, baseYield: 180, pricePerUnit: 80.0, suitableRegions: ['福建', '浙江', '云南', '四川', '安徽'] },
];

router.get('/crops/:landId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const land = db.prepare('SELECT * FROM lands WHERE id = ? AND user_id = ?').get(req.params.landId, req.user!.id) as any;
    
    if (!land) {
      res.status(404).json({ error: '土地不存在' });
      return;
    }

    const recommendations = calculateCropRecommendations(land);
    res.json(recommendations);
  } catch (error) {
    console.error('Get crop recommendations error:', error);
    res.status(500).json({ error: '获取种植推荐失败' });
  }
})

router.get('/fertilization/:landId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const land = db.prepare('SELECT * FROM lands WHERE id = ? AND user_id = ?').get(req.params.landId, req.user!.id) as any;
    
    if (!land) {
      res.status(404).json({ error: '土地不存在' });
      return;
    }

    const scheme = calculateFertilizationScheme(land);
    res.json(scheme);
  } catch (error) {
    console.error('Get fertilization scheme error:', error);
    res.status(500).json({ error: '获取施肥方案失败' });
  }
})

function calculateCropRecommendations(land: any) {
  const { ph_value = 6.5, organic_matter = 1.5, nitrogen = 80, phosphorus = 60, potassium = 50, area = 0, province, city } = land;
  
  const scoredCrops = CROP_DATABASE.map(crop => {
    let score = 0;
    
    if (ph_value >= crop.minPh && ph_value <= crop.maxPh) {
      const phIdeal = (crop.minPh + crop.maxPh) / 2;
      const phDiff = Math.abs(ph_value - phIdeal) / ((crop.maxPh - crop.minPh) / 2);
      score += (1 - phDiff) * 25;
    } else {
      score -= 20;
    }
    
    if (organic_matter >= crop.minOrganic) {
      score += 15;
    } else {
      score -= 10;
    }
    
    const nScore = calculateNutrientScore(nitrogen, crop.optimalN);
    const pScore = calculateNutrientScore(phosphorus, crop.optimalP);
    const kScore = calculateNutrientScore(potassium, crop.optimalK);
    score += (nScore + pScore + kScore) / 3 * 25;
    
    if (province && crop.suitableRegions.includes(province)) {
      score += 20;
    } else if (province) {
      score -= 5;
    }
    
    const estimatedYield = crop.baseYield * (1 + (organic_matter - 1) * 0.1);
    const estimatedIncome = estimatedYield * area * crop.pricePerUnit;
    const roi = estimatedIncome / (crop.optimalN[0] * 3 + crop.optimalP[0] * 4 + crop.optimalK[0] * 3.5);
    
    return {
      crop,
      score: Math.max(0, Math.min(100, score)),
      estimatedYield: Math.round(estimatedYield),
      estimatedIncome: Math.round(estimatedIncome),
      roi: Math.round(roi * 100) / 100,
      growthDays: crop.growthDays,
      reasons: generateReasons(crop, land, score)
    };
  });
  
  return scoredCrops
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function calculateNutrientScore(value: number, optimal: [number, number]): number {
  const mid = (optimal[0] + optimal[1]) / 2;
  const range = optimal[1] - optimal[0];
  
  if (value >= optimal[0] && value <= optimal[1]) {
    return 100;
  } else if (value < optimal[0]) {
    return Math.max(0, 100 - (optimal[0] - value) / range * 50);
  } else {
    return Math.max(0, 100 - (value - optimal[1]) / range * 30);
  }
}

function generateReasons(crop: CropData, land: any, score: number): string[] {
  const reasons: string[] = [];
  
  if (land.ph_value >= crop.minPh && land.ph_value <= crop.maxPh) {
    reasons.push('pH值适宜');
  } else {
    reasons.push('pH值需要调整');
  }
  
  if ((land.organic_matter || 0) >= crop.minOrganic) {
    reasons.push('有机质含量充足');
  } else {
    reasons.push('建议增加有机肥');
  }
  
  if (land.province && crop.suitableRegions.includes(land.province)) {
    reasons.push('气候区域适宜');
  }
  
  if (score >= 80) {
    reasons.push('综合匹配度高，推荐优先考虑');
  }
  
  return reasons;
}

function calculateFertilizationScheme(land: any) {
  const { ph_value = 6.5, organic_matter = 1.5, nitrogen = 80, phosphorus = 60, potassium = 50, area = 0, current_crop } = land;
  
  const targetCrop = current_crop ? CROP_DATABASE.find(c => c.name.includes(current_crop) || current_crop.includes(c.name)) : null;
  const reference = targetCrop || CROP_DATABASE[1];
  
  const nDeficit = Math.max(0, reference.optimalN[1] - nitrogen);
  const pDeficit = Math.max(0, reference.optimalP[1] - phosphorus);
  const kDeficit = Math.max(0, reference.optimalK[1] - potassium);
  
  const stages = [
    {
      stage: '基肥期',
      timing: '播种前7-10天',
      fertilizers: [
        { name: '腐熟有机肥', quantity: Math.round(area * 2000), unit: 'kg', purpose: '改善土壤结构，提供基础养分' },
        { name: '尿素', quantity: Math.round(area * nDeficit * 0.4 * 2.2), unit: 'kg', purpose: '提供速效氮素' },
        { name: '过磷酸钙', quantity: Math.round(area * pDeficit * 0.7 * 5), unit: 'kg', purpose: '补充磷元素' },
        { name: '硫酸钾', quantity: Math.round(area * kDeficit * 0.5 * 1.8), unit: 'kg', purpose: '补充钾元素' }
      ]
    },
    {
      stage: '追肥期（苗期）',
      timing: '出苗后15-20天',
      fertilizers: [
        { name: '尿素', quantity: Math.round(area * nDeficit * 0.3 * 2.2), unit: 'kg', purpose: '促进幼苗生长' },
        { name: '磷酸二氢钾', quantity: Math.round(area * 2), unit: 'kg', purpose: '叶面喷施，增强抗性' }
      ]
    },
    {
      stage: '追肥期（旺长期）',
      timing: '现蕾/开花前',
      fertilizers: [
        { name: '尿素', quantity: Math.round(area * nDeficit * 0.2 * 2.2), unit: 'kg', purpose: '维持营养生长' },
        { name: '硫酸钾', quantity: Math.round(area * kDeficit * 0.3 * 1.8), unit: 'kg', purpose: '促进开花结果' }
      ]
    },
    {
      stage: '追肥期（结果期）',
      timing: '坐果后',
      fertilizers: [
        { name: '氮磷钾复合肥(15-15-15)', quantity: Math.round(area * 25), unit: 'kg', purpose: '全面补充营养' },
        { name: '微量元素肥', quantity: Math.round(area * 5), unit: 'kg', purpose: '补充硼、锌、镁等' }
      ]
    }
  ];
  
  const totalCost = stages.reduce((sum, stage) => {
    return sum + stage.fertilizers.reduce((s, f) => s + calculateFertilizerCost(f.name, f.quantity), 0);
  }, 0);
  
  const notes = [];
  if (ph_value < 5.5) notes.push('土壤偏酸，建议施用石灰调节pH值，每亩50-100kg');
  if (ph_value > 8.0) notes.push('土壤偏碱，建议施用石膏或硫磺调节');
  if (organic_matter < 1.0) notes.push('土壤有机质偏低，建议增加绿肥或秸秆还田');
  notes.push('施肥量仅供参考，实际用量请根据苗情调整');
  notes.push('建议进行测土配方施肥，每2-3年复测一次土壤');
  
  return {
    crop: reference.name,
    area,
    stages,
    totalCost: Math.round(totalCost),
    costPerMu: Math.round(totalCost / Math.max(1, area) * 100) / 100,
    notes,
    soilSummary: {
      ph: ph_value,
      organic: organic_matter,
      nitrogen,
      phosphorus,
      potassium
    }
  };
}

function calculateFertilizerCost(name: string, quantity: number): number {
  const prices: Record<string, number> = {
    '腐熟有机肥': 0.5,
    '尿素': 2.2,
    '过磷酸钙': 0.8,
    '硫酸钾': 3.5,
    '磷酸二氢钾': 8.0,
    '氮磷钾复合肥(15-15-15)': 3.0,
    '微量元素肥': 5.0
  };
  return quantity * (prices[name] || 2.0);
}

export default router
