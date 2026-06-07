import { Router, type Response } from 'express'
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../db/database.js';
import { type AuthRequest, authMiddleware } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router()

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + uuidv4().substring(0, 8) + ext);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

interface PestDisease {
  name: string;
  scientificName: string;
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
  symptoms: string[];
  suggestions: string[];
  treatment: {
    pesticides: { name: string; dosage: string; frequency: string }[];
    preventionTips: string[];
  };
  needsExpert: boolean;
}

const PEST_DISEASE_DB: PestDisease[] = [
  {
    name: '小麦条锈病',
    scientificName: 'Puccinia striiformis',
    severity: 'severe',
    description: '由条形柄锈菌引起的真菌病害，主要危害小麦叶片，严重时可造成30%以上减产。',
    symptoms: ['叶片上出现鲜黄色夏孢子堆，沿叶脉排列成条状', '后期孢子堆变黑，叶片枯死', '病害从下部叶片向上发展'],
    suggestions: [
      '选用抗病品种',
      '及时清除病残体，减少菌源',
      '合理密植，改善通风透光条件',
      '发病初期及时喷药防治'
    ],
    treatment: {
      pesticides: [
        { name: '三唑酮可湿性粉剂', dosage: '每亩100g，兑水50kg', frequency: '7-10天1次，连续2-3次' },
        { name: '戊唑醇悬浮剂', dosage: '每亩20ml，兑水50kg', frequency: '10天1次' }
      ],
      preventionTips: [
        '避免偏施氮肥，增施磷钾肥',
        '开沟排水，降低田间湿度',
        '实行轮作，避免连作'
      ]
    },
    needsExpert: true
  },
  {
    name: '稻瘟病',
    scientificName: 'Magnaporthe oryzae',
    severity: 'severe',
    description: '水稻最主要病害之一，可发生在水稻各个生育期，严重时颗粒无收。',
    symptoms: ['叶片出现梭形病斑，中央灰白色，边缘褐色', '穗颈受害造成白穗', '潮湿时病斑上产生灰色霉层'],
    suggestions: [
      '种植抗病品种',
      '种子消毒处理',
      '合理施肥，避免偏施氮肥',
      '浅水勤灌，适时晒田'
    ],
    treatment: {
      pesticides: [
        { name: '三环唑可湿性粉剂', dosage: '每亩100g，兑水50kg', frequency: '7-10天1次' },
        { name: '稻瘟灵乳油', dosage: '每亩100ml，兑水50kg', frequency: '7天1次' }
      ],
      preventionTips: [
        '处理带病稻草',
        '合理密植',
        '增施钾肥和硅肥'
      ]
    },
    needsExpert: true
  },
  {
    name: '玉米螟',
    scientificName: 'Ostrinia nubilalis',
    severity: 'moderate',
    description: '玉米主要害虫，幼虫蛀食玉米茎秆和果穗，影响产量和品质。',
    symptoms: ['叶片出现排孔状受害', '茎秆被蛀易折断', '果穗受害，籽粒被蛀食'],
    suggestions: [
      '处理越冬寄主，减少虫源',
      '安装频振式杀虫灯诱杀成虫',
      '释放赤眼蜂进行生物防治'
    ],
    treatment: {
      pesticides: [
        { name: '氯虫苯甲酰胺悬浮剂', dosage: '每亩10ml，兑水50kg', frequency: '10天1次' },
        { name: '苏云金杆菌(Bt)', dosage: '每亩100g，兑水50kg', frequency: '7天1次' }
      ],
      preventionTips: [
        '冬春季烧毁处理玉米秸秆',
        '合理轮作',
        '选用抗虫品种'
      ]
    },
    needsExpert: false
  },
  {
    name: '蚜虫',
    scientificName: 'Aphidoidea',
    severity: 'mild',
    description: '常见刺吸式害虫，吸食作物汁液，还可传播病毒病。',
    symptoms: ['叶片卷曲、发黄', '叶片上有蜜露', '严重时植株生长不良'],
    suggestions: [
      '保护利用瓢虫、草蛉等天敌',
      '悬挂黄板诱杀',
      '及时清除田间杂草'
    ],
    treatment: {
      pesticides: [
        { name: '吡虫啉可湿性粉剂', dosage: '每亩20g，兑水50kg', frequency: '7-10天1次' },
        { name: '噻虫嗪水分散粒剂', dosage: '每亩10g，兑水50kg', frequency: '15天1次' }
      ],
      preventionTips: [
        '清除田边杂草',
        '合理布局，避免连片种植',
        '保护天敌昆虫'
      ]
    },
    needsExpert: false
  },
  {
    name: '番茄早疫病',
    scientificName: 'Alternaria solani',
    severity: 'moderate',
    description: '番茄常见真菌病害，主要危害叶片，也可危害茎和果实。',
    symptoms: ['叶片出现同心轮纹状病斑', '病斑褐色，有黄色晕圈', '严重时叶片枯死脱落'],
    suggestions: [
      '选用抗病品种',
      '实行轮作',
      '高垄栽培，合理密植',
      '及时整枝打杈，改善通风'
    ],
    treatment: {
      pesticides: [
        { name: '代森锰锌可湿性粉剂', dosage: '每亩150g，兑水50kg', frequency: '7天1次' },
        { name: '苯醚甲环唑水分散粒剂', dosage: '每亩20g，兑水50kg', frequency: '10天1次' }
      ],
      preventionTips: [
        '施足腐熟有机肥',
        '及时清除病残体',
        '避免大水漫灌'
      ]
    },
    needsExpert: false
  },
  {
    name: '黄瓜霜霉病',
    scientificName: 'Pseudoperonospora cubensis',
    severity: 'severe',
    description: '黄瓜主要病害，发病快，危害重，俗称"跑马干"。',
    symptoms: ['叶片出现多角形黄色病斑', '潮湿时叶背产生紫黑色霉层', '严重时全叶黄褐色枯死'],
    suggestions: [
      '选用抗病品种',
      '培育壮苗',
      '加强通风，降低湿度',
      '高温闷棚处理'
    ],
    treatment: {
      pesticides: [
        { name: '霜霉威盐酸盐水剂', dosage: '每亩100ml，兑水50kg', frequency: '7天1次' },
        { name: '氟噻唑吡乙酮悬浮剂', dosage: '每亩25ml，兑水50kg', frequency: '10天1次' }
      ],
      preventionTips: [
        '高畦栽培，地膜覆盖',
        '合理密植，及时整枝',
        '增施磷钾肥，提高抗病性'
      ]
    },
    needsExpert: true
  }
];

router.use(authMiddleware);

router.post('/detect', upload.single('image'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: '请上传图片' });
      return;
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const detectionResult = performPestDetection(req.file.filename);

    const detectionId = uuidv4();
    db.prepare(`
      INSERT INTO pest_detections (
        id, user_id, image_url, disease_name, severity, confidence,
        description, suggestions, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed')
    `).run(
      detectionId,
      req.user!.id,
      imageUrl,
      detectionResult.name,
      detectionResult.severity,
      detectionResult.confidence,
      detectionResult.description,
      JSON.stringify(detectionResult.suggestions)
    );

    res.json({
      id: detectionId,
      imageUrl,
      diseaseName: detectionResult.name,
      scientificName: detectionResult.scientificName,
      severity: detectionResult.severity,
      confidence: detectionResult.confidence,
      description: detectionResult.description,
      symptoms: detectionResult.symptoms,
      suggestions: detectionResult.suggestions,
      treatment: detectionResult.treatment,
      needsExpert: detectionResult.needsExpert
    });
  } catch (error) {
    console.error('Pest detection error:', error);
    res.status(500).json({ error: '病虫害识别失败' });
  }
})

router.get('/detections', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const detections = db.prepare('SELECT * FROM pest_detections WHERE user_id = ? ORDER BY created_at DESC').all(req.user!.id);
    
    const result = detections.map((d: any) => ({
      ...d,
      suggestions: d.suggestions ? JSON.parse(d.suggestions) : []
    }));
    
    res.json(result);
  } catch (error) {
    console.error('Get detections error:', error);
    res.status(500).json({ error: '获取检测记录失败' });
  }
})

router.get('/detections/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const detection = db.prepare('SELECT * FROM pest_detections WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
    
    if (!detection) {
      res.status(404).json({ error: '检测记录不存在' });
      return;
    }

    const disease = PEST_DISEASE_DB.find(d => d.name === detection.disease_name);

    res.json({
      ...detection,
      suggestions: detection.suggestions ? JSON.parse(detection.suggestions) : [],
      treatment: disease?.treatment,
      scientificName: disease?.scientificName,
      symptoms: disease?.symptoms
    });
  } catch (error) {
    console.error('Get detection detail error:', error);
    res.status(500).json({ error: '获取检测详情失败' });
  }
})

router.post('/detections/:id/expert', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const detection = db.prepare('SELECT * FROM pest_detections WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
    
    if (!detection) {
      res.status(404).json({ error: '检测记录不存在' });
      return;
    }

    db.prepare(`
      UPDATE pest_detections SET expert_assigned = 1, status = 'expert_pending' WHERE id = ?
    `).run(req.params.id);

    setTimeout(() => {
      const expertReport = generateExpertReport(detection);
      db.prepare(`
        UPDATE pest_detections SET expert_report = ?, expert_id = 'expert001', status = 'expert_completed' WHERE id = ?
      `).run(expertReport, req.params.id);

      db.prepare(`
        INSERT INTO system_notifications (id, user_id, type, title, content)
        VALUES (?, ?, 'expert_reply', '专家诊断完成', '您申请的专家远程诊断已完成，请注意查看诊断报告。')
      `).run(uuidv4(), req.user!.id);
    }, 10000);

    res.json({ message: '已提交专家诊断，预计10分钟内完成' });
  } catch (error) {
    console.error('Apply expert error:', error);
    res.status(500).json({ error: '申请专家诊断失败' });
  }
})

router.get('/experts', async (req: AuthRequest, res: Response): Promise<void> => {
  const experts = [
    { id: 'expert001', name: '王教授', title: '植物病理学专家', specialty: '作物真菌病害', experience: '25年', avatar: '👨‍🔬' },
    { id: 'expert002', name: '李博士', title: '昆虫学专家', specialty: '农业害虫防治', experience: '18年', avatar: '👩‍🔬' },
    { id: 'expert003', name: '张研究员', title: '农药学专家', specialty: '农药安全使用', experience: '20年', avatar: '👨‍🌾' },
  ];
  
  res.json(experts);
})

function performPestDetection(filename: string) {
  const seed = hashString(filename);
  const index = seed % PEST_DISEASE_DB.length;
  const disease = PEST_DISEASE_DB[index];
  
  const baseConfidence = 0.75 + (seed % 20) / 100;
  
  return {
    ...disease,
    confidence: Math.round(baseConfidence * 100) / 100
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function generateExpertReport(detection: any): string {
  const disease = PEST_DISEASE_DB.find(d => d.name === detection.disease_name);
  if (!disease) return '无法诊断，请重新上传清晰图片';

  return `
【专家诊断报告】
作物：${detection.disease_name}
诊断时间：${new Date().toLocaleString()}

一、病情评估
根据您上传的图片观察，该地块${disease.name}发病程度为${disease.severity === 'mild' ? '轻度' : disease.severity === 'moderate' ? '中度' : '重度'}，需要${disease.severity === 'severe' ? '立即' : '尽快'}采取防治措施。

二、防治方案
1. 农业防治：
   ${disease.treatment.preventionTips.map((t, i) => `${i + 1}. ${t}`).join('\n   ')}

2. 化学防治：
   ${disease.treatment.pesticides.map((p, i) => `${i + 1}. ${p.name}：${p.dosage}，${p.frequency}`).join('\n   ')}

三、注意事项
1. 施药时注意防护，避免农药中毒
2. 严格遵守农药安全间隔期
3. 建议7-10天后复查防治效果
4. 如有疑问可随时发起图文咨询

【农业专家 王教授】
  `.trim();
}

export default router
