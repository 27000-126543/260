import { useState, useEffect } from 'react';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  Wind,
  Thermometer,
  Droplets,
  AlertTriangle,
  Shield,
  ChevronRight,
  MapPin,
  CloudLightning,
  Leaf,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/utils/api';
import type { WeatherInfo, WeatherAlert as WeatherAlertType } from '../../shared/types';

export default function WeatherAlert() {
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlertType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeatherData();
  }, []);

  const loadWeatherData = () => {
    Promise.all([api.weather.getCurrent(), api.weather.getAlerts()])
      .then(([weatherData, alertsData]) => {
        setWeather(weatherData as WeatherInfo);
        setAlerts(alertsData as WeatherAlertType[]);
      })
      .finally(() => setLoading(false));
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny':
        return <Sun className="w-12 h-12 text-yellow-500" />;
      case 'cloudy':
        return <Cloud className="w-12 h-12 text-gray-500" />;
      case 'rainy':
        return <CloudRain className="w-12 h-12 text-blue-500" />;
      case 'snowy':
        return <CloudSnow className="w-12 h-12 text-blue-300" />;
      case 'storm':
        return <CloudLightning className="w-12 h-12 text-purple-500" />;
      default:
        return <Sun className="w-12 h-12 text-yellow-500" />;
    }
  };

  const getWeatherText = (condition: string) => {
    const map: Record<string, string> = {
      sunny: '晴',
      cloudy: '多云',
      rainy: '雨',
      snowy: '雪',
      storm: '雷暴',
    };
    return map[condition] || condition;
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'red':
        return 'border-red-500 bg-red-50';
      case 'orange':
        return 'border-orange-500 bg-orange-50';
      case 'yellow':
        return 'border-yellow-500 bg-yellow-50';
      case 'blue':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const getAlertLevelText = (level: string) => {
    const map: Record<string, string> = {
      red: '红色预警',
      orange: '橙色预警',
      yellow: '黄色预警',
      blue: '蓝色预警',
    };
    return map[level] || level;
  };

  const getAlertLevelBadge = (level: string) => {
    switch (level) {
      case 'red':
        return 'text-red-600 bg-red-100';
      case 'orange':
        return 'text-orange-600 bg-orange-100';
      case 'yellow':
        return 'text-yellow-600 bg-yellow-100';
      case 'blue':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">气象预警</h1>
        <p className="text-gray-500 mt-1">实时天气监测，灾害预警推送</p>
      </div>

      {/* Current Weather */}
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4 text-white/80">
                <MapPin className="w-5 h-5" />
                <span>{weather?.location || '湖南省长沙市'}</span>
              </div>
              <div className="flex items-center gap-6">
                {weather && getWeatherIcon(weather.condition)}
                <div>
                  <div className="text-6xl font-bold">
                    {weather?.temperature || 26}°
                  </div>
                  <div className="text-xl text-white/80 mt-1">
                    {weather && getWeatherText(weather.condition)}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
                  <Thermometer className="w-6 h-6" />
                </div>
                <div className="text-2xl font-semibold">{weather?.temperature || 26}°</div>
                <div className="text-sm text-white/70">体感温度</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
                  <Droplets className="w-6 h-6" />
                </div>
                <div className="text-2xl font-semibold">{weather?.humidity || 75}%</div>
                <div className="text-sm text-white/70">空气湿度</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
                  <Wind className="w-6 h-6" />
                </div>
                <div className="text-2xl font-semibold">{weather?.windLevel || 3}级</div>
                <div className="text-sm text-white/70">风力等级</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">气象预警</h3>
          <Badge variant="info">{alerts.length} 条预警</Badge>
        </div>
        {alerts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">当前无预警</h3>
              <p className="text-gray-500">天气状况良好，请注意田间管理</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card
                key={alert.id}
                className={`border-l-4 ${getAlertColor(alert.level)}`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <AlertTriangle
                          className={`w-6 h-6 ${
                            alert.level === 'red'
                              ? 'text-red-500'
                              : alert.level === 'orange'
                              ? 'text-orange-500'
                              : 'text-yellow-500'
                          }`}
                        />
                        <h4 className="text-lg font-bold text-gray-900">{alert.title}</h4>
                        <Badge className={getAlertLevelBadge(alert.level)}>
                          {getAlertLevelText(alert.level)}
                        </Badge>
                      </div>
                      <p className="text-gray-700 mb-3">{alert.content}</p>
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <span>发布时间：{alert.publishTime}</span>
                        <span>影响区域：{alert.affectedArea}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      防护建议
                    </h5>
                    <ul className="grid sm:grid-cols-2 gap-2">
                      {alert.suggestions.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-primary-500 font-medium">•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 7-Day Forecast */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">7天天气预报</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weather?.forecast?.map((day, i) => (
              <div key={i} className="text-center p-3 rounded-xl hover:bg-gray-50">
                <div className="text-sm text-gray-500 mb-2">{day.day}</div>
                <div className="flex justify-center mb-2">
                  {getWeatherIcon(day.condition)}
                </div>
                <div className="text-sm text-gray-900 font-medium">
                  {day.high}°
                </div>
                <div className="text-sm text-gray-500">
                  {day.low}°
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Agri Tips */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">今日农事建议</h4>
              <p className="text-gray-700">
                根据当前天气条件，建议加强田间通风，及时排水防涝。早晚温差较大，注意预防作物病害发生。
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
