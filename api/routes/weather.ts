import { Router, type Response } from 'express'
import axios from 'axios';
import db from '../db/database.js';
import { type AuthRequest, authMiddleware } from '../middleware/auth.js';

const router = Router()

const QWEATHER_KEY = process.env.QWEATHER_KEY as string;

if (!QWEATHER_KEY || QWEATHER_KEY === 'demo_key_here' || QWEATHER_KEY === 'your_demo_key_here') {
  console.error('⚠️  [WEATHER] 警告：未配置有效的和风天气API Key，请在.env文件中配置QWEATHER_KEY');
  console.error('⚠️  [WEATHER] 注册地址：https://dev.qweather.com/');
}

async function getLocationId(cityName: string): Promise<string> {
  try {
    const geoResp = await axios.get('https://geoapi.qweather.com/v2/city/lookup', {
      params: { location: encodeURIComponent(cityName), key: QWEATHER_KEY },
      timeout: 10000
    });
    
    if (geoResp.data.code !== '200' || !geoResp.data.location || geoResp.data.location.length === 0) {
      throw new Error(`城市查询失败: ${geoResp.data.message || '未知城市'}`);
    }
    
    return geoResp.data.location[0].id;
  } catch (error: any) {
    console.error(`[WEATHER] 获取城市ID失败 [${cityName}]:`, error.message);
    throw error;
  }
}

router.get('/current', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { city, province } = req.query;
    const cityName = (city as string) || '北京';
    
    if (!QWEATHER_KEY || QWEATHER_KEY === 'demo_key_here' || QWEATHER_KEY === 'your_demo_key_here') {
      res.status(500).json({ 
        error: '天气服务未配置',
        detail: '请在.env文件中配置有效的QWEATHER_KEY'
      });
      return;
    }

    const locationId = await getLocationId(cityName);
    
    const [weatherResp, airResp] = await Promise.all([
      axios.get('https://devapi.qweather.com/v7/weather/now', {
        params: { location: locationId, key: QWEATHER_KEY },
        timeout: 10000
      }),
      axios.get('https://devapi.qweather.com/v7/air/now', {
        params: { location: locationId, key: QWEATHER_KEY },
        timeout: 10000
      })
    ]);

    if (weatherResp.data.code !== '200') {
      throw new Error(`天气API错误: ${weatherResp.data.message}`);
    }

    const data = {
      city: cityName,
      temperature: parseInt(weatherResp.data.now.temp),
      humidity: parseInt(weatherResp.data.now.humidity),
      windLevel: weatherResp.data.now.windScale,
      condition: weatherResp.data.now.text,
      windDirection: weatherResp.data.now.windDir,
      feelsLike: parseInt(weatherResp.data.now.feelsLike),
      aqi: airResp.data.now?.aqi ? parseInt(airResp.data.now.aqi) : 50,
      updateTime: weatherResp.data.updateTime
    };

    console.log(`[WEATHER] 获取天气成功 [${cityName}]: ${data.condition} ${data.temperature}°C`);
    res.json(data);
  } catch (error: any) {
    console.error('[WEATHER] 获取当前天气失败:', error.message);
    res.status(500).json({ 
      error: '获取天气数据失败',
      detail: error.message
    });
  }
})

router.get('/forecast', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { city, days = '7' } = req.query;
    const cityName = (city as string) || '北京';
    
    if (!QWEATHER_KEY || QWEATHER_KEY === 'demo_key_here' || QWEATHER_KEY === 'your_demo_key_here') {
      res.status(500).json({ 
        error: '天气服务未配置',
        detail: '请在.env文件中配置有效的QWEATHER_KEY'
      });
      return;
    }

    const locationId = await getLocationId(cityName);
    
    const forecastResp = await axios.get('https://devapi.qweather.com/v7/weather/7d', {
      params: { location: locationId, key: QWEATHER_KEY },
      timeout: 10000
    });

    if (forecastResp.data.code !== '200') {
      throw new Error(`预报API错误: ${forecastResp.data.message}`);
    }

    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const forecast = forecastResp.data.daily.map((d: any, idx: number) => {
      const date = new Date(d.fxDate);
      return {
        date: d.fxDate,
        day: idx === 0 ? '今天' : idx === 1 ? '明天' : weekdays[date.getDay()],
        high: parseInt(d.tempMax),
        low: parseInt(d.tempMin),
        highTemp: parseInt(d.tempMax),
        lowTemp: parseInt(d.tempMin),
        condition: d.textDay,
        icon: d.iconDay,
        precipitation: parseFloat(d.precip),
        windSpeed: parseInt(d.windSpeedDay)
      };
    });

    console.log(`[WEATHER] 获取7天预报成功 [${cityName}]: ${forecast.length}天`);
    res.json(forecast);
  } catch (error: any) {
    console.error('[WEATHER] 获取天气预报失败:', error.message);
    res.status(500).json({ 
      error: '获取天气预报失败',
      detail: error.message
    });
  }
})

router.get('/alerts', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { city } = req.query;
    const cityName = (city as string) || '北京';
    
    if (!QWEATHER_KEY || QWEATHER_KEY === 'demo_key_here' || QWEATHER_KEY === 'your_demo_key_here') {
      res.status(500).json({ 
        error: '天气服务未配置',
        detail: '请在.env文件中配置有效的QWEATHER_KEY'
      });
      return;
    }

    const locationId = await getLocationId(cityName);
    
    const alertResp = await axios.get('https://devapi.qweather.com/v7/warning/now', {
      params: { location: locationId, key: QWEATHER_KEY },
      timeout: 10000
    });

    if (alertResp.data.code !== '200') {
      throw new Error(`预警API错误: ${alertResp.data.message}`);
    }

    const alerts = (alertResp.data.warning || []).map((w: any) => ({
      id: w.id,
      type: w.typeName,
      level: w.level,
      title: `${w.typeName}${w.level}预警`,
      content: w.text,
      pubTime: w.pubTime,
      suggestions: generateSafetyTips(w.typeName, w.level)
    }));

    console.log(`[WEATHER] 获取预警成功 [${cityName}]: ${alerts.length}条预警`);
    res.json(alerts);
  } catch (error: any) {
    console.error('[WEATHER] 获取气象预警失败:', error.message);
    res.status(500).json({ 
      error: '获取气象预警失败',
      detail: error.message
    });
  }
})

router.get('/tips', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tips = [
      { icon: '🌾', title: '当前农事建议', content: '近期气温适宜，适合春播作物播种，注意做好种子消毒处理。' },
      { icon: '💧', title: '灌溉建议', content: '土壤墒情适中，建议采用滴灌或喷灌，避免大水漫灌。' },
      { icon: '🦟', title: '病虫害防治', content: '注意监测蚜虫、红蜘蛛等害虫，及时喷施吡虫啉或阿维菌素。' },
      { icon: '🌿', title: '施肥建议', content: '根据作物长势，适量追施氮肥，配合磷钾肥施用。' },
      { icon: '🌤️', title: '天气提醒', content: '未来3天以晴好天气为主，适宜开展田间作业。' }
    ];
    res.json(tips);
  } catch (error: any) {
    console.error('[WEATHER] 获取农事建议失败:', error.message);
    res.status(500).json({ error: '获取农事建议失败' });
  }
})

function generateSafetyTips(type: string, level: string) {
  const tips: string[] = [];
  
  if (type.includes('暴雨') || type.includes('雨')) {
    tips.push('及时疏通田间排水沟，防止积水');
    tips.push('低洼地块注意排水防涝');
    tips.push('雨后及时喷施杀菌剂，预防病害发生');
    tips.push('注意设施大棚及时关闭棚膜');
  }
  
  if (type.includes('高温')) {
    tips.push('午间采取遮阳降温，避免高温灼伤');
    tips.push('增加灌溉次数，保持土壤湿润');
    tips.push('叶面喷施磷酸二氢钾，提高抗逆性');
    tips.push('田间作业避开高温时段');
  }
  
  if (type.includes('大风')) {
    tips.push('加固大棚等农业设施');
    tips.push('高秆作物注意培土防倒伏');
    tips.push('收回室外晾晒的农产品');
  }
  
  if (type.includes('寒潮') || type.includes('降温')) {
    tips.push('做好作物防冻保温工作');
    tips.push('设施农业及时加盖保温被');
    tips.push('喷施抗冻剂，提高作物抗寒能力');
    tips.push('热带作物注意防寒保暖');
  }
  
  return tips.length > 0 ? tips : ['密切关注天气变化，做好防范准备'];
}

export default router
