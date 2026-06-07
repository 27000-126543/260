import { Router, type Response } from 'express'
import axios from 'axios';
import db from '../db/database.js';
import { type AuthRequest, authMiddleware } from '../middleware/auth.js';

const router = Router()

const QWEATHER_KEY = process.env.QWEATHER_KEY || 'demo_key';
const USE_MOCK = !QWEATHER_KEY || QWEATHER_KEY === 'demo_key';

router.get('/current', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { city, province } = req.query;
    const cityName = (city as string) || '北京';
    
    if (USE_MOCK) {
      const data = generateMockWeather(cityName);
      res.json(data);
      return;
    }

    const geoResp = await axios.get(`https://geoapi.qweather.com/v2/city/lookup`, {
      params: { location: cityName, key: QWEATHER_KEY }
    });
    
    if (!geoResp.data.location || geoResp.data.location.length === 0) {
      res.status(400).json({ error: '未找到该城市' });
      return;
    }

    const locationId = geoResp.data.location[0].id;
    
    const [weatherResp, airResp] = await Promise.all([
      axios.get(`https://devapi.qweather.com/v7/weather/now`, {
        params: { location: locationId, key: QWEATHER_KEY }
      }),
      axios.get(`https://devapi.qweather.com/v7/air/now`, {
        params: { location: locationId, key: QWEATHER_KEY }
      })
    ]);

    const data = {
      city: cityName,
      temperature: parseInt(weatherResp.data.now.temp),
      humidity: parseInt(weatherResp.data.now.humidity),
      windLevel: weatherResp.data.now.windScale,
      condition: weatherResp.data.now.text,
      windDirection: weatherResp.data.now.windDir,
      feelsLike: parseInt(weatherResp.data.now.feelsLike),
      aqi: airResp.data.now?.aqi || 50,
      updateTime: weatherResp.data.updateTime
    };

    res.json(data);
  } catch (error) {
    console.error('Get weather error:', error);
    const data = generateMockWeather(req.query.city as string || '北京');
    res.json(data);
  }
})

router.get('/forecast', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { city, days = '7' } = req.query;
    const cityName = (city as string) || '北京';
    
    if (USE_MOCK) {
      const forecast = generateMockForecast(parseInt(days as string));
      res.json(forecast);
      return;
    }

    const geoResp = await axios.get(`https://geoapi.qweather.com/v2/city/lookup`, {
      params: { location: cityName, key: QWEATHER_KEY }
    });
    
    const locationId = geoResp.data.location[0].id;
    
    const forecastResp = await axios.get(`https://devapi.qweather.com/v7/weather/7d`, {
      params: { location: locationId, key: QWEATHER_KEY }
    });

    const forecast = forecastResp.data.daily.map((d: any) => ({
      date: d.fxDate,
      day: new Date(d.fxDate).toLocaleDateString('zh-CN', { weekday: 'short' }),
      high: parseInt(d.tempMax),
      low: parseInt(d.tempMin),
      highTemp: parseInt(d.tempMax),
      lowTemp: parseInt(d.tempMin),
      condition: d.textDay,
      icon: d.iconDay,
      precipitation: parseFloat(d.precip),
      windSpeed: parseInt(d.windSpeedDay)
    }));

    res.json(forecast);
  } catch (error) {
    console.error('Get forecast error:', error);
    const forecast = generateMockForecast(parseInt(req.query.days as string || '7'));
    res.json(forecast);
  }
})

router.get('/alerts', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { city } = req.query;
    const cityName = (city as string) || '北京';
    
    if (USE_MOCK) {
      const alerts = generateMockAlerts(cityName);
      res.json(alerts);
      return;
    }

    const geoResp = await axios.get(`https://geoapi.qweather.com/v2/city/lookup`, {
      params: { location: cityName, key: QWEATHER_KEY }
    });
    
    const locationId = geoResp.data.location[0].id;
    
    const alertResp = await axios.get(`https://devapi.qweather.com/v7/warning/now`, {
      params: { location: locationId, key: QWEATHER_KEY }
    });

    const alerts = (alertResp.data.warning || []).map((w: any) => ({
      id: w.id,
      type: w.typeName,
      level: w.level,
      title: `${w.typeName}${w.level}预警`,
      content: w.text,
      pubTime: w.pubTime,
      suggestions: generateSafetyTips(w.typeName, w.level)
    }));

    res.json(alerts);
  } catch (error) {
    console.error('Get alerts error:', error);
    const alerts = generateMockAlerts(req.query.city as string || '北京');
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
  } catch (error) {
    res.status(500).json({ error: '获取农事建议失败' });
  }
})

function generateMockWeather(city: string) {
  const temp = 15 + Math.floor(Math.random() * 20);
  const humidity = 40 + Math.floor(Math.random() * 40);
  const conditions = ['晴', '多云', '阴', '小雨', '雷阵雨'];
  const winds = ['东风', '南风', '西风', '北风', '东南风'];
  
  return {
    city,
    temperature: temp,
    humidity,
    windLevel: String(2 + Math.floor(Math.random() * 4)),
    condition: conditions[Math.floor(Math.random() * conditions.length)],
    windDirection: winds[Math.floor(Math.random() * winds.length)],
    feelsLike: temp + Math.floor(Math.random() * 5) - 2,
    aqi: 30 + Math.floor(Math.random() * 120),
    updateTime: new Date().toISOString()
  };
}

function generateMockForecast(days: number) {
  const conditions = ['晴', '多云', '阴', '小雨', '雷阵雨', '晴间多云'];
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const today = new Date();
  
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const high = 18 + Math.floor(Math.random() * 15);
    return {
      date: date.toISOString().split('T')[0],
      day: i === 0 ? '今天' : i === 1 ? '明天' : weekdays[date.getDay()],
      high,
      low: high - 8 - Math.floor(Math.random() * 8),
      highTemp: high,
      lowTemp: high - 8 - Math.floor(Math.random() * 8),
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      icon: String(100 + Math.floor(Math.random() * 10)),
      precipitation: Math.floor(Math.random() * 20),
      windSpeed: 2 + Math.floor(Math.random() * 6)
    };
  });
}

function generateMockAlerts(city: string) {
  const alerts = [];
  
  if (Math.random() > 0.3) return [];
  
  const alertTypes = [
    { type: '暴雨', level: '蓝色', content: '预计未来24小时将有大到暴雨，请注意防范。' },
    { type: '高温', level: '黄色', content: '最高气温将升至35℃以上，请注意防暑降温。' },
    { type: '大风', level: '蓝色', content: '预计将有6-8级大风，请注意设施农业加固。' },
    { type: '寒潮', level: '橙色', content: '气温将下降8-10℃，注意作物防冻。' }
  ];
  
  const alert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
  
  return [{
    id: 'alert_' + Date.now(),
    type: alert.type,
    level: alert.level,
    title: `${city}发布${alert.type}${alert.level}预警`,
    content: alert.content,
    pubTime: new Date().toISOString(),
    suggestions: generateSafetyTips(alert.type, alert.level)
  }];
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
  
  return tips.length > 0 ? tips : ['密切关注天气变化，做好防范准备'];
}

export default router
