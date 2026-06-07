import { Router, type Response } from 'express'
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import axios from 'axios';
import FormData from 'form-data';
import db from '../db/database.js';
import { type AuthRequest, authMiddleware } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router()

const PLANT_ID_API_KEY = process.env.PLANT_ID_API_KEY as string;

if (!PLANT_ID_API_KEY || PLANT_ID_API_KEY === 'your_api_key_here') {
  console.error('⚠️  [FIELD] 警告：未配置有效的Plant.id API Key，请在.env文件中配置PLANT_ID_API_KEY');
  console.error('⚠️  [FIELD] 注册地址：https://web.plant.id/');
}

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

router.use(authMiddleware);

router.post('/detect', upload.single('image'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: '请上传图片' });
      return;
    }

    if (!PLANT_ID_API_KEY || PLANT_ID_API_KEY === 'your_api_key_here') {
      res.status(500).json({ 
        error: '病虫害识别服务未配置',
        detail: '请在.env文件中配置有效的PLANT_ID_API_KEY'
      });
      return;
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const imagePath = req.file.path;

    console.log(`[FIELD] 开始病虫害图片识别: ${req.file.filename}, 大小: ${(req.file.size / 1024).toFixed(1)}KB`);

    const formData = new FormData();
    formData.append('images', fs.createReadStream(imagePath));
    formData.append('api_key', PLANT_ID_API_KEY);

    let detectionResult;
    
    try {
      const response = await axios.post('https://api.plant.id/v2/health_assessment', formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000,
      });

      if (response.data.error) {
        throw new Error(`Plant.id API错误: ${response.data.error}`);
      }

      const healthData = response.data.health_assessment;
      const isHealthy = healthData.is_healthy;
      const diseases = healthData.diseases || [];

      if (isHealthy || diseases.length === 0) {
        detectionResult = {
          name: '作物健康',
          scientificName: 'Healthy Plant',
          severity: 'healthy' as const,
          confidence: 0.95,
          description: '图片中的作物生长良好，未检测到明显的病虫害症状。',
          symptoms: ['叶片颜色正常', '生长状态良好', '无明显病斑'],
          suggestions: [
            '继续保持良好的田间管理',
            '定期巡查，及时发现异常',
            '合理施肥浇水，增强作物抗性'
          ],
          treatment: {
            pesticides: [],
            preventionTips: [
              '保持田间通风透光',
              '合理密植',
              '平衡施肥',
              '定期清理病残体'
            ]
          },
          needsExpert: false
        };
      } else {
        const topDisease = diseases[0];
        const severity = topDisease.probability > 0.7 ? 'severe' : topDisease.probability > 0.4 ? 'moderate' : 'mild';
        
        const suggestions = generateTreatmentSuggestions(topDisease.name, severity);
        
        detectionResult = {
          name: topDisease.name || '未知病害',
          scientificName: topDisease.scientific_name || '',
          severity,
          confidence: topDisease.probability || 0.8,
          description: generateDiseaseDescription(topDisease.name || '未知病害'),
          symptoms: topDisease.symptoms || ['叶片出现异常病斑', '植株生长受抑'],
          suggestions,
          treatment: {
            pesticides: generatePesticideRecommendations(topDisease.name || '未知病害'),
            preventionTips: [
              '选用抗病品种',
              '合理轮作',
              '加强田间管理',
              '及时清除病残体'
            ]
          },
          needsExpert: severity === 'severe'
        };
      }

      console.log(`[FIELD] 识别完成: ${detectionResult.name}, 置信度: ${(detectionResult.confidence * 100).toFixed(1)}%`);

    } catch (apiError: any) {
      console.error('[FIELD] Plant.id API调用失败:', apiError.message);
      res.status(502).json({ 
        error: '病虫害识别服务调用失败',
        detail: apiError.message,
        hint: '请检查PLANT_ID_API_KEY是否正确，或稍后重试'
      });
      return;
    }

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
  } catch (error: any) {
    console.error('[FIELD] 病虫害识别异常:', error.message);
    res.status(500).json({ 
      error: '病虫害识别失败',
      detail: error.message
    });
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
  } catch (error: any) {
    console.error('[FIELD] 获取检测记录失败:', error.message);
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

    res.json({
      ...detection,
      suggestions: detection.suggestions ? JSON.parse(detection.suggestions) : [],
      treatment: detection.disease_name ? {
        pesticides: generatePesticideRecommendations(detection.disease_name),
        preventionTips: [
          '选用抗病品种',
          '合理轮作',
          '加强田间管理',
          '及时清除病残体'
        ]
      } : null
    });
  } catch (error: any) {
    console.error('[FIELD] 获取检测详情失败:', error.message);
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

    const expertReport = generateExpertReport(detection);
    db.prepare(`
      UPDATE pest_detections SET expert_report = ?, expert_id = 'expert001', status = 'expert_completed' WHERE id = ?
    `).run(expertReport, req.params.id);

    db.prepare(`
      INSERT INTO system_notifications (id, user_id, type, title, content)
      VALUES (?, ?, 'expert_reply', '专家诊断完成', '您申请的专家远程诊断已完成，请注意查看诊断报告。')
    `).run(uuidv4(), req.user!.id);

    console.log(`[FIELD] 专家诊断完成: ${req.params.id}`);
    res.json({ message: '专家诊断已完成', report: expertReport });
  } catch (error: any) {
    console.error('[FIELD] 申请专家诊断失败:', error.message);
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

function generateDiseaseDescription(diseaseName: string): string {
  const descriptions: Record<string, string> = {
    '锈病': '由锈菌引起的真菌病害，主要危害作物叶片，形成铁锈色孢子堆，严重时影响光合作用。',
    '霜霉病': '由霜霉菌引起的病害，在潮湿条件下发病严重，叶背产生白色或紫灰色霉层。',
    '白粉病': '由白粉菌引起的真菌病害，叶片表面出现白色粉状物，后期变黄褐色。',
    '炭疽病': '由炭疽菌引起，病斑呈圆形或椭圆形，中央凹陷，有小黑点。',
    '叶斑病': '叶片上出现各种形状的病斑，严重时叶片枯死脱落。',
    '蚜虫': '刺吸式害虫，吸食作物汁液，导致叶片卷曲，还可传播病毒病。',
    '红蜘蛛': '螨类害虫，在叶背吸食汁液，叶片出现黄白色小点，严重时叶片枯黄。',
  };
  
  return descriptions[diseaseName] || `作物${diseaseName}是一种常见的植物病虫害，需要及时采取防治措施，避免病情扩散造成减产。`;
}

function generateTreatmentSuggestions(diseaseName: string, severity: string): string[] {
  const baseSuggestions = [
    `及时清除受${diseaseName}侵害的病残体，带出田外集中销毁`,
    '加强田间通风透光，降低田间湿度',
    '合理施肥，避免偏施氮肥，增施磷钾肥',
    '发病初期及时喷施药剂防治'
  ];

  if (severity === 'severe') {
    baseSuggestions.push('建议间隔5-7天连续施药2-3次');
    baseSuggestions.push('考虑与其他作物轮作，减少田间菌源');
  }

  return baseSuggestions;
}

function generatePesticideRecommendations(diseaseName: string): { name: string; dosage: string; frequency: string }[] {
  const pesticides: Record<string, { name: string; dosage: string; frequency: string }[]> = {
    '锈病': [
      { name: '三唑酮可湿性粉剂', dosage: '每亩100g，兑水50kg', frequency: '7-10天1次' },
      { name: '戊唑醇悬浮剂', dosage: '每亩20ml，兑水50kg', frequency: '10天1次' }
    ],
    '霜霉病': [
      { name: '霜霉威盐酸盐水剂', dosage: '每亩100ml，兑水50kg', frequency: '7天1次' },
      { name: '氟噻唑吡乙酮悬浮剂', dosage: '每亩25ml，兑水50kg', frequency: '10天1次' }
    ],
    '白粉病': [
      { name: '嘧菌酯悬浮剂', dosage: '每亩30ml，兑水50kg', frequency: '7-10天1次' },
      { name: '醚菌酯可湿性粉剂', dosage: '每亩40g，兑水50kg', frequency: '10天1次' }
    ],
    '炭疽病': [
      { name: '苯醚甲环唑水分散粒剂', dosage: '每亩20g，兑水50kg', frequency: '7-10天1次' },
      { name: '咪鲜胺乳油', dosage: '每亩50ml，兑水50kg', frequency: '10天1次' }
    ],
    '蚜虫': [
      { name: '吡虫啉可湿性粉剂', dosage: '每亩20g，兑水50kg', frequency: '7-10天1次' },
      { name: '噻虫嗪水分散粒剂', dosage: '每亩10g，兑水50kg', frequency: '15天1次' }
    ],
    '红蜘蛛': [
      { name: '阿维菌素乳油', dosage: '每亩30ml，兑水50kg', frequency: '7天1次' },
      { name: '螺螨酯悬浮剂', dosage: '每亩20ml，兑水50kg', frequency: '10-15天1次' }
    ],
  };

  return pesticides[diseaseName] || [
    { name: '代森锰锌可湿性粉剂', dosage: '每亩150g，兑水50kg', frequency: '7天1次' },
    { name: '多菌灵可湿性粉剂', dosage: '每亩100g，兑水50kg', frequency: '7-10天1次' }
  ];
}

function generateExpertReport(detection: any): string {
  const severityText = detection.severity === 'mild' ? '轻度' : detection.severity === 'moderate' ? '中度' : '重度';
  
  return `
【专家诊断报告】
作物病虫害：${detection.disease_name}
诊断时间：${new Date().toLocaleString()}

一、病情评估
根据您上传的图片观察，该地块${detection.disease_name}发病程度为${severityText}，需要${detection.severity === 'severe' ? '立即' : '尽快'}采取防治措施。

二、防治方案
1. 农业防治：
   - 选用抗病品种，减少病害发生概率
   - 合理轮作，避免连作障碍
   - 加强田间管理，及时清除病残体
   - 合理密植，改善通风透光条件

2. 化学防治：
   - 发病初期及时喷施杀菌剂/杀虫剂
   - 注意药剂轮换使用，避免抗药性
   - 严格按照推荐剂量施药，避免药害

三、注意事项
1. 施药时注意防护，避免农药中毒
2. 严格遵守农药安全间隔期
3. 建议7-10天后复查防治效果
4. 如有疑问可随时发起图文咨询

【农业专家 王教授】
  `.trim();
}

export default router
