import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Sparkles,
  ShoppingCart,
  Sprout,
  Cloud,
  Store,
  Wallet,
  Crown,
  Thermometer,
  Droplets,
  Wind,
  AlertTriangle,
  TrendingUp,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/utils/api';
import type { CurrentWeather, WeatherWarning, NewsItem, Land } from '../../shared/types';

const quickActions = [
  { path: '/land', label: '土地管理', icon: MapPin, color: 'from-blue-500 to-blue-600' },
  { path: '/recommendation', label: '智能推荐', icon: Sparkles, color: 'from-purple-500 to-purple-600' },
  { path: '/store', label: '农资商城', icon: ShoppingCart, color: 'from-orange-500 to-orange-600' },
  { path: '/field', label: '田间管理', icon: Sprout, color: 'from-green-500 to-green-600' },
  { path: '/weather', label: '气象预警', icon: Cloud, color: 'from-cyan-500 to-cyan-600' },
  { path: '/market', label: '农产品交易', icon: Store, color: 'from-pink-500 to-pink-600' },
  { path: '/finance', label: '农业金融', icon: Wallet, color: 'from-yellow-500 to-yellow-600' },
  { path: '/member', label: '会员中心', icon: Crown, color: 'from-amber-500 to-amber-600' },
];

export default function FarmerHome() {
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [warnings, setWarnings] = useState<WeatherWarning[]>([]);
  const [lands, setLands] = useState<Land[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    api.weather.current().then(setWeather).catch(() => {});
    api.weather.warnings().then(setWarnings).catch(() => {});
    api.lands.list().then(setLands).catch(() => {});
    api.admin.news().then(setNews).catch(() => {});
  }, []);

  const totalArea = lands.reduce((sum, land) => sum + land.area, 0);

  const warningColors = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    red: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 lg:p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">您好，张农夫 👋</h1>
            <p className="text-primary-100">今天天气适宜，是田间管理的好日子</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4 text-center">
              <p className="text-3xl font-bold">{totalArea}</p>
              <p className="text-sm text-primary-100">总亩数</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4 text-center">
              <p className="text-3xl font-bold">{lands.length}</p>
              <p className="text-sm text-primary-100">地块数</p>
            </div>
          </div>
        </div>
      </div>

      {/* Weather Card */}
      {weather && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                  <Cloud className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gray-900">{weather.temperature}°</span>
                    <span className="text-gray-500">{weather.condition}</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    体感温度 {weather.feelsLike}° · {weather.updateTime} 更新
                  </p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-orange-500" />
                  <span className="text-sm text-gray-600">湿度 {weather.humidity}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-gray-600">{weather.windDirection}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wind className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-600">{weather.windSpeed}km/h</span>
                </div>
              </div>
              <Link to="/weather">
                <Button variant="outline" size="sm">查看详情</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weather Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-3">
          {warnings.map((warning) => (
            <div
              key={warning.id}
              className={`border rounded-xl p-4 ${warningColors[warning.level]}`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{warning.title}</span>
                    <Badge variant="warning" className="text-xs">
                      {warning.type}
                    </Badge>
                  </div>
                  <p className="text-sm opacity-80 mb-2">{warning.content}</p>
                  <div className="flex flex-wrap gap-2">
                    {warning.suggestions.map((s, i) => (
                      <span key={i} className="text-xs bg-white/50 px-2 py-1 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">快捷服务</h2>
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.path}
                to={action.path}
                className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl hover:shadow-md transition-all duration-200 group"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-gray-700 font-medium">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Stats & News */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Lands */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">我的土地</h3>
              <Link to="/land" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                查看全部 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {lands.slice(0, 3).map((land) => (
                <div
                  key={land.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{land.name}</p>
                    <p className="text-sm text-gray-500">{land.area} 亩 · {land.soilType}</p>
                  </div>
                  <Badge variant="primary">{land.location.split(' ')[0]}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* News */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">农业资讯</h3>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="w-4 h-4" /> 最新
              </span>
            </div>
            <div className="space-y-4">
              {news.slice(0, 3).map((item) => (
                <div key={item.id} className="flex gap-3">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-20 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <Badge variant="secondary" className="mb-1">{item.category}</Badge>
                    <h4 className="font-medium text-gray-900 text-sm line-clamp-2 hover:text-primary-600 cursor-pointer">
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">市场行情</h3>
            <Link to="/market" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              交易大厅 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: '番茄', price: '3.2', change: '+5.2%', up: true },
              { name: '黄瓜', price: '2.8', change: '-2.1%', up: false },
              { name: '小麦', price: '1.5', change: '+1.5%', up: true },
              { name: '玉米', price: '1.3', change: '+0.8%', up: true },
            ].map((item) => (
              <div key={item.name} className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">{item.name}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-gray-900">¥{item.price}</span>
                  <span className={`text-sm flex items-center ${item.up ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendingUp className={`w-4 h-4 ${!item.up && 'rotate-180'}`} />
                    {item.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
