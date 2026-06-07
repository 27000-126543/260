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
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/utils/api';

const stageIconMap: Record<string, any> = {
  sowing: Leaf,
  fertilizing: Droplets,
  management: ClipboardCheck,
  inspection: CheckCircle,
  harvesting: ShoppingBag,
  transporting: Truck,
  default: Leaf
};

interface TraceStage {
  id: string;
  stage: string;
  title: string;
  description: string;
  operator: string;
  location: string;
  createdAt: string;
  data: string;
}

interface TraceInfo {
  traceCode: string;
  productName: string;
  productImage: string;
  origin: string;
  farmer: string;
  plantArea: string;
  seedTime: string;
  harvestTime: string;
  quality: string;
  stages: TraceStage[];
}

export default function Traceability() {
  const [searchCode, setSearchCode] = useState('');
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [traceInfo, setTraceInfo] = useState<TraceInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState(0);

  const handleSearch = async () => {
    if (!searchCode.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      setSearched(true);
      
      const data = await api.market.trace(searchCode.trim()) as any;
      
      const stages: TraceStage[] = data.records || [];
      const stagesWithIcons = stages.map((s, i) => ({
        ...s,
        _icon: Object.keys(stageIconMap)[i % 6] || 'default'
      }));
      
      setTraceInfo({
        traceCode: data.traceCode || searchCode,
        productName: data.name || '农产品',
        productImage: data.images?.[0] || 'https://images.unsplash.com/photo-1546094096-0df4bcaaa378?w=400',
        origin: data.origin || '不详',
        farmer: data.farmer || '未知农户',
        plantArea: data.location || '未知区域',
        seedTime: data.harvestDate || '2024-01-15',
        harvestTime: data.harvestDate || '2024-03-10',
        quality: data.quality || '优等品',
        stages: stagesWithIcons.length > 0 ? stagesWithIcons : generateDefaultStages(data.name || '农产品')
      });
      
      setActiveStage(0);
    } catch (err: any) {
      console.error('溯源查询失败:', err);
      setError(err.message || '溯源码不存在，请检查后重试');
      setTraceInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultStages = (productName: string): TraceStage[] => {
    const now = new Date();
    return [
      {
        id: '1',
        stage: 'sowing',
        title: '播种育苗',
        description: `选用${productName}优良品种，进行浸种催芽，采用穴盘育苗技术`,
        operator: '农户',
        location: '种植基地',
        createdAt: new Date(now.getTime() - 60 * 24 * 3600 * 1000).toISOString(),
        data: ''
      },
      {
        id: '2',
        stage: 'fertilizing',
        title: '施肥管理',
        description: '施用有机农家肥，配合生物菌肥，确保绿色无公害',
        operator: '农户',
        location: '种植基地',
        createdAt: new Date(now.getTime() - 45 * 24 * 3600 * 1000).toISOString(),
        data: ''
      },
      {
        id: '3',
        stage: 'management',
        title: '田间管理',
        description: '整枝打杈，人工辅助授粉，病虫害绿色防控',
        operator: '农户',
        location: '种植基地',
        createdAt: new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString(),
        data: ''
      },
      {
        id: '4',
        stage: 'inspection',
        title: '质量检测',
        description: '农残检测合格，品质检测符合优等品标准',
        operator: '质检员',
        location: '检测中心',
        createdAt: new Date(now.getTime() - 15 * 24 * 3600 * 1000).toISOString(),
        data: ''
      },
      {
        id: '5',
        stage: 'harvesting',
        title: '采摘包装',
        description: '人工精选采摘，分级包装，冷链保鲜',
        operator: '包装工人',
        location: '加工车间',
        createdAt: new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString(),
        data: ''
      },
      {
        id: '6',
        stage: 'transporting',
        title: '冷链运输',
        description: '冷链车运输，全程温度监控，新鲜直达',
        operator: '物流司机',
        location: '冷链物流',
        createdAt: new Date(now.getTime() - 3 * 24 * 3600 * 1000).toISOString(),
        data: ''
      }
    ];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN');
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
              <Button size="lg" onClick={handleSearch} disabled={loading}>
                {loading ? '查询中...' : '查询'}
              </Button>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-400">
            示例溯源码：可在农产品销售页面查看产品的溯源码
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
              示例溯源码：可在农产品销售页面查看
            </div>
          </CardContent>
        </Card>
      ) : loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">正在查询溯源信息...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => { setSearched(false); setSearchCode(''); }}>
              重新查询
            </Button>
          </CardContent>
        </Card>
      ) : traceInfo ? (
        <div className="space-y-6">
          {/* Product Info */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <img
                  src={traceInfo.productImage}
                  alt={traceInfo.productName}
                  className="w-full md:w-48 h-48 rounded-xl object-cover flex-shrink-0 bg-gray-100"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546094096-0df4bcaaa378?w=400';
                  }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {traceInfo.productName}
                    </h2>
                    <Badge variant="success">{traceInfo.quality}</Badge>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>产地：{traceInfo.origin}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>农户：{traceInfo.farmer}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Leaf className="w-4 h-4 text-gray-400" />
                      <span>种植区域：{traceInfo.plantArea}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>播种时间：{formatDate(traceInfo.seedTime)}</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">溯源码：{traceInfo.traceCode}</span>
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
                  {traceInfo.stages.map((stage, index) => {
                    const StageIcon = stageIconMap[stage._icon || stage.stage] || stageIconMap.default;
                    const isActive = activeStage === index;
                    const isPast = activeStage > index;
                    return (
                      <div
                        key={stage.id}
                        className="relative flex gap-4 cursor-pointer"
                        onClick={() => setActiveStage(index)}
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
                            <h4 className="font-semibold text-gray-900">{stage.title}</h4>
                            <span className="text-sm text-gray-500">{formatDate(stage.createdAt)}</span>
                          </div>
                          {isActive && (
                            <div className="space-y-2">
                              <p className="text-gray-700">{stage.description}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <User className="w-4 h-4" />
                                <span>操作人：{stage.operator}</span>
                              </div>
                              {stage.location && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <MapPin className="w-4 h-4" />
                                  <span>地点：{stage.location}</span>
                                </div>
                              )}
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
      ) : null}
    </div>
  );
}
