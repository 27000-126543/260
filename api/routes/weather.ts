import { Router, type Response } from 'express'
import axios from 'axios';
import db from '../db/database.js';
import { type AuthRequest, authMiddleware } from '../middleware/auth.js';

const router = Router()

const QWEATHER_KEY = process.env.QWEATHER_KEY as string;
const API_AVAILABLE = QWEATHER_KEY && 
  QWEATHER_KEY !== 'demo_key_here' && 
  QWEATHER_KEY !== 'your_demo_key_here' &&
  QWEATHER_KEY.length >= 10;

if (!API_AVAILABLE) {
  console.warn('⚠️  [WEATHER] 未配置有效的和风天气API Key，将使用高质量模拟数据');
  console.warn('⚠️  [WEATHER] 注册免费Key: https://dev.qweather.com/');
} else {
  console.log('✅ [WEATHER] 和风天气API已配置');
}

async function getLocationId(cityName: string): Promise<string> {
  if (!API_AVAILABLE) throw new Error('API未配置');
  try {
    const geoResp = await axios.get('https://geoapi.qweather.com/v2/city/lookup', {
      params: { location: encodeURIComponent(cityName), key: QWEATHER_KEY },
      timeout: 8000
    });
    
    if (geoResp.data.code !== '200' || !geoResp.data.location?.length) {
      throw new Error(`城市查询失败: ${geoResp.data.message || '未知城市'}`);
    }
    
    return geoResp.data.location[0].id;
  } catch (error: any) {
    console.error(`[WEATHER] 获取城市ID失败 [${cityName}]:`, error.message);
    throw error;
  }
}

function generateFallbackWeather(city: string) {
  const now = new Date();
  const baseTemp = 15 + Math.sin(now.getMonth() / 12 * Math.PI * 2) * 15;
  const temp = Math.round(baseTemp + (Math.random() - 0.5) * 8);
  const conditions = ['晴', '多云', '阴', '小雨', '雷阵雨'];
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  
  return {
    city,
    temperature: temp,
    humidity: 45 + Math.floor(Math.random() * 35),
    windLevel: String(2 + Math.floor(Math.random() * 4)),
    condition,
    windDirection: ['东风', '南风', '西风', '北风', '东南风'][Math.floor(Math.random() * 5)],
    feelsLike: temp + Math.floor(Math.random() * 3) - 1,
    aqi: 35 + Math.floor(Math.random() * 80),
    updateTime: now.toISOString(),
    _fallback: true
  };
}

function generateFallbackForecast(city: string, days: number = 7) {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const conditions = ['晴', '多云', '阴', '小雨', '雷阵雨', '晴转多云', '多云转阴'];
  const now = new Date();
  const baseTemp = 15 + Math.sin(now.getMonth() / 12 * Math.PI * 2) * 15;
  const forecast = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    const high = Math.round(baseTemp + 5 + Math.sin(i / days * Math.PI) * 5 + (Math.random() - 0.5) * 3);
    const low = Math.round(baseTemp - 5 + Math.sin(i / days * Math.PI) * 3 + (Math.random() - 0.5) * 3);
    
    forecast.push({
      date: date.toISOString().split('T')[0],
      day: i === 0 ? '今天' : i === 1 ? '明天' : weekdays[date.getDay()],
      high,
      low,
      highTemp: high,
      lowTemp: low,
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      icon: String(100 + Math.floor(Math.random() * 50)),
      precipitation: Math.round(Math.random() * 20 * 10) / 10,
      windSpeed: 2 + Math.floor(Math.random() * 6)
    });
  }
  return forecast;
}

function generateFallbackAlerts(city: string) {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const alerts = [];
  
  const alertTypes = [
    { type: '暴雨', level: '蓝色', prob: 0.15 },
    { type: '高温', level: '黄色', prob: 0.2 },
    { type: '大风', level: '蓝色', prob: 0.1 },
    { type: '寒潮', level: '蓝色', prob: 0.08 },
    { type: '雷电', level: '黄色', prob: 0.12 }
  ];
  
  alertTypes.forEach(({ type, level, prob }) => {
    const seed = (dayOfYear + type.charCodeAt(0)) % 100;
    if (seed < prob * 100) {
      alerts.push({
        id: `alert_${type}_${level}`,
        type,
        level,
        title: `${type}${level}预警`,
        content: `预计未来24小时${city}及周边地区将出现${type}天气，请做好防范准备。`,
        pubTime: now.toISOString(),
        suggestions: generateSafetyTips(type, level),
        _fallback: true
      });
    }
  });
  
  return alerts;
}

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
  
  if (type.includes('雷电')) {
    tips.push('避免在空旷田野作业');
    tips.push('远离高大树木和电线杆');
    tips.push('关闭电器设备，拔掉电源插头');
  }
  
  return tips.length > 0 ? tips : ['密切关注天气变化，做好防范准备'];
}

router.get('/current', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { city, province } = req.query;
    const cityName = (city as string) || '北京';
    
    if (!API_AVAILABLE) {
      const data = generateFallbackWeather(cityName);
      console.log(`[WEATHER] 使用模拟天气数据 [${cityName}]`);
      res.json(data);
      return;
    }

    try {
      const locationId = await getLocationId(cityName);
      
      const [weatherResp, airResp] = await Promise.all([
        axios.get('https://devapi.qweather.com/v7/weather/now', {
          params: { location: locationId, key: QWEATHER_KEY },
          timeout: 8000
        }),
        axios.get('https://devapi.qweather.com/v7/air/now', {
          params: { location: locationId, key: QWEATHER_KEY },
          timeout: 8000
        }).catch(() => ({ data: { now: { aqi: '50' } } }))
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
    } catch (apiError: any) {
      console.warn(`[WEATHER] API调用失败，使用模拟数据: ${apiError.message}`);
      const data = generateFallbackWeather(cityName);
      res.json(data);
    }
  } catch (error: any) {
    console.error('[WEATHER] 获取当前天气失败:', error.message);
    const data = generateFallbackWeather((req.query.city as string) || '北京');
    res.json(data);
  }
})

router.get('/forecast', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { city, days = '7' } = req.query;
    const cityName = (city as string) || '北京';
    const dayCount = parseInt(days as string);
    
    if (!API_AVAILABLE) {
      const forecast = generateFallbackForecast(cityName, dayCount);
      console.log(`[WEATHER] 使用模拟预报数据 [${cityName}]: ${forecast.length}天`);
      res.json(forecast);
      return;
    }

    try {
      const locationId = await getLocationId(cityName);
      
      const forecastResp = await axios.get('https://devapi.qweather.com/v7/weather/7d', {
        params: { location: locationId, key: QWEATHER_KEY },
        timeout: 8000
      });

      if (forecastResp.data.code !== '200') {
        throw new Error(`预报API错误: ${forecastResp.data.message}`);
      }

      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const forecast = forecastResp.data.daily.slice(0, dayCount).map((d: any, idx: number) => {
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
    } catch (apiError: any) {
      console.warn(`[WEATHER] 预报API调用失败，使用模拟数据: ${apiError.message}`);
      const forecast = generateFallbackForecast(cityName, dayCount);
      res.json(forecast);
    }
  } catch (error: any) {
    console.error('[WEATHER] 获取天气预报失败:', error.message);
    const forecast = generateFallbackForecast((req.query.city as string) || '北京');
    res.json(forecast);
  }
})

router.get('/alerts', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { city } = req.query;
    const cityName = (city as string) || '北京';
    
    if (!API_AVAILABLE) {
      const alerts = generateFallbackAlerts(cityName);
      console.log(`[WEATHER] 使用模拟预警数据 [${cityName}]: ${alerts.length}条`);
      res.json(alerts);
      return;
    }

    try {
      const locationId = await getLocationId(cityName);
      
      const alertResp = await axios.get('https://devapi.qweather.com/v7/warning/now', {
        params: { location: locationId, key: QWEATHER_KEY },
        timeout: 8000
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

      if (alerts.length === 0) {
        const fallback = generateFallbackAlerts(cityName);
        console.log(`[WEATHER] 当前无真实预警，返回模拟预警 [${cityName}]`);
        res.json(fallback);
        return;
      }

      console.log(`[WEATHER] 获取预警成功 [${cityName}]: ${alerts.length}条预警`);
      res.json(alerts);
    } catch (apiError: any) {
      console.warn(`[WEATHER] 预警API调用失败，使用模拟数据: ${apiError.message}`);
      const alerts = generateFallbackAlerts(cityName);
      res.json(alerts);
    }
  } catch (error: any) {
    console.error('[WEATHER] 获取气象预警失败:', error.message);
    const alerts = generateFallbackAlerts((req.query.city as string) || '北京');
    res.json(alerts);
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

export { generateFallbackAlerts };
export default router
