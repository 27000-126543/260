import { useState } from 'react';
import {
  Search,
  QrCode,
  Leaf,
  Droplets,
  ClipboardCheck,
  Truck,
  ShoppingBag,
  MapPin,
  Calendar,
  User,
  FileText,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const mockTraceInfo = {
  traceCode: 'AGRI202403150001',
  productName: '有机西红柿',
  productImage: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa378?w=400',
  origin: '山东省寿光市蔬菜基地',
  farmer: '李建国',
  plantArea: '5号大棚',
  seedTime: '2024-01-15',
  harvestTime: '2024-03-10',
  quality: '优等品',
  stages: [
    {
      id: 1,
      name: '播种育苗',
      time: '2024-01-15',
      icon: Leaf,
      details: '选用优良品种，进行浸种催芽，采用穴盘育苗技术',
      operator: '李建国',
    },
    {
      id: 2,
      name: '施肥管理',
      time: '2024-02-01',
      icon: Droplets,
      details: '施用有机农家肥200kg/亩，配合生物菌肥',
      operator: '李建国',
    },
    {
      id: 3,
      name: '田间管理',
      time: '2024-02-20',
      icon: ClipboardCheck,
      details: '整枝打杈，人工授粉，病虫害绿色防控',
      operator: '李建国',
    },
    {
      id: 4,
      name: '质量检测',
      time: '2024-03-08',
      icon: CheckCircle,
      details: '农残检测合格，糖度检测7.5°，符合有机标准',
      operator: '张质检',
    },
    {
      id: 5,
      name: '采摘包装',
      time: '2024-03-10',
      icon: ShoppingBag,
      details: '人工精选采摘，分级包装，每盒2.5kg',
      operator: '王包装',
    },
    {
      id: 6,
      name: '冷链运输',
      time: '2024-03-11',
      icon: Truck,
      details: '冷链车运输，温度控制在2-8°C，预计3月12日送达',
      operator: '刘司机',
    },
  ],
};

export default function Traceability() {
  const [searchCode, setSearchCode] = useState('');
  const [searched, setSearched] = useState(false);
  const [activeStage, setActiveStage] = useState(1);

  const handleSearch = () => {
    if (searchCode.trim()) {
      setSearched(true);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">产品溯源</h1>
        <p className="text-gray-500 mt-1">扫一扫溯源码，查看全链条信息</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="输入溯源码或扫描二维码"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="lg">
                <QrCode className="w-5 h-5 mr-2" />
                扫码
              </Button>
              <Button size="lg" onClick={handleSearch}>
                查询
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {!searched ? (
        <Card>
          <CardContent className="py-16 text-center">
            <QrCode className="w-20 h-20 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">输入溯源码查询</h3>
            <p className="text-gray-500 mb-6">或点击扫码按钮扫描产品包装上的溯源二维码</p>
            <div className="text-sm text-gray-400">
              示例溯源码：AGRI202403150001
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Product Info */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <img
                  src={mockTraceInfo.productImage}
                  alt={mockTraceInfo.productName}
                  className="w-full md:w-48 h-48 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {mockTraceInfo.productName}
                    </h2>
                    <Badge variant="success">{mockTraceInfo.quality}</Badge>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>产地：{mockTraceInfo.origin}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>农户：{mockTraceInfo.farmer}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Leaf className="w-4 h-4 text-gray-400" />
                      <span>种植区域：{mockTraceInfo.plantArea}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>播种时间：{mockTraceInfo.seedTime}</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">溯源码：{mockTraceInfo.traceCode}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">溯源全流程</h3>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-200" />
                <div className="space-y-6">
                  {mockTraceInfo.stages.map((stage, index) => {
                    const StageIcon = stage.icon;
                    const isActive = activeStage === stage.id;
                    const isPast = activeStage > stage.id;
                    return (
                      <div
                        key={stage.id}
                        className="relative flex gap-4 cursor-pointer"
                        onClick={() => setActiveStage(stage.id)}
                      >
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                            isPast || isActive
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          <StageIcon className="w-6 h-6" />
                        </div>
                        <div
                          className={`flex-1 p-4 rounded-xl transition-colors ${
                            isActive ? 'bg-primary-50 ring-2 ring-primary-500' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{stage.name}</h4>
                            <span className="text-sm text-gray-500">{stage.time}</span>
                          </div>
                          {isActive && (
                            <div className="space-y-2">
                              <p className="text-gray-700">{stage.details}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <User className="w-4 h-4" />
                                <span>操作人：{stage.operator}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quality Report */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">质检报告</h3>
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                查看详情
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-xl text-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <div className="font-medium text-gray-900">农残检测</div>
                  <div className="text-sm text-green-600">合格</div>
                </div>
                <div className="p-4 bg-green-50 rounded-xl text-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <div className="font-medium text-gray-900">重金属检测</div>
                  <div className="text-sm text-green-600">合格</div>
                </div>
                <div className="p-4 bg-green-50 rounded-xl text-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <div className="font-medium text-gray-900">微生物检测</div>
                  <div className="text-sm text-green-600">合格</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
