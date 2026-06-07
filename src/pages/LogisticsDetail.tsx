import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Thermometer,
  Droplets,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/utils/api';

interface LogisticsTrack {
  id: string;
  status: string;
  location: string;
  description: string;
  temperature: number | null;
  humidity: number | null;
  createdAt: string;
}

interface OrderInfo {
  id: string;
  orderNo: string;
  status: string;
  trackingNo: string;
  logisticsCompany: string;
  receiverName: string;
  receiverPhone: string;
  address: string;
  items: Array<{
    productName: string;
    productImage: string;
    spec: string;
    quantity: number;
  }>;
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: '待发货', icon: Clock, color: 'text-yellow-600 bg-yellow-100' },
  paid: { label: '待发货', icon: Package, color: 'text-blue-600 bg-blue-100' },
  shipped: { label: '运输中', icon: Truck, color: 'text-orange-600 bg-orange-100' },
  delivering: { label: '配送中', icon: Truck, color: 'text-blue-600 bg-blue-100' },
  delivered: { label: '已送达', icon: CheckCircle, color: 'text-green-600 bg-green-100' },
  completed: { label: '已完成', icon: CheckCircle, color: 'text-green-600 bg-green-100' },
};

export default function LogisticsDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [tracks, setTracks] = useState<LogisticsTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    loadOrderDetail();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [orderId]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await api.store.order(orderId!) as any;
      setOrder(data);
      
      if (data.tracks) {
        setTracks(data.tracks || []);
      }
      
      if (data.status === 'shipped' || data.status === 'delivering') {
        startSSEStream();
      }
    } catch (err: any) {
      console.error('加载订单详情失败:', err);
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const startSSEStream = () => {
    if (!orderId) return;
    
    try {
      const eventSource = api.store.streamLogistics(orderId);
      eventSourceRef.current = eventSource;
      setStreaming(true);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'update' && data.track) {
            setTracks((prev) => {
              const exists = prev.some((t) => t.id === data.track.id);
              if (!exists) {
                return [data.track, ...prev];
              }
              return prev;
            });
          }
          if (data.type === 'complete') {
            setStreaming(false);
            eventSource.close();
          }
        } catch (e) {
          console.error('解析SSE消息失败:', e);
        }
      };

      eventSource.onerror = () => {
        console.warn('SSE连接断开');
        setStreaming(false);
        eventSource.close();
      };

      eventSource.addEventListener('connected', () => {
        console.log('SSE物流推送已连接');
      });
    } catch (err) {
      console.error('启动SSE失败:', err);
      setStreaming(false);
    }
  };

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isLatest = (index: number) => index === 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <Link to="/store/orders" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ChevronLeft className="w-5 h-5" />
          返回订单列表
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
            <p className="text-gray-600 mb-4">{error || '订单不存在'}</p>
            <Button onClick={loadOrderDetail}>重试</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      <Link to="/store/orders" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <ChevronLeft className="w-5 h-5" />
        返回订单列表
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">物流详情</h1>
          <p className="text-gray-500 mt-1">订单号：{order.orderNo}</p>
        </div>
        <Badge className={status.color}>
          <StatusIcon className="w-4 h-4 mr-1" />
          {status.label}
        </Badge>
      </div>

      {/* 实时推送状态 */}
      {streaming && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3 flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
            <span className="text-blue-700 font-medium">物流轨迹实时更新中...</span>
          </CardContent>
        </Card>
      )}

      {/* 收货信息 */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">收货信息</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">
                {order.receiverName} {order.receiverPhone}
              </p>
              <p className="text-gray-600">{order.address}</p>
            </div>
          </div>
          {order.logisticsCompany && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                承运商：{order.logisticsCompany}
                {order.trackingNo && ` | 运单号：${order.trackingNo}`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 商品信息 */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">商品信息</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex gap-3">
                <img
                  src={item.productImage}
                  alt={item.productName}
                  className="w-16 h-16 rounded-lg object-cover bg-gray-100"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 line-clamp-1">
                    {item.productName}
                  </h4>
                  <p className="text-sm text-gray-500">{item.spec}</p>
                  <p className="text-sm text-gray-500">x{item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 物流轨迹 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">物流轨迹</h3>
          {streaming && (
            <Badge variant="info" className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              实时推送中
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {tracks.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>暂无物流轨迹</p>
              <p className="text-sm mt-1">商家已发货后将显示物流信息</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-200" />
              
              <div className="space-y-6">
                {tracks.map((track, index) => (
                  <div key={track.id} className="relative flex gap-4">
                    <div
                      className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isLatest(index)
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isLatest(index) ? (
                        <Truck className="w-4 h-4" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className={`font-medium ${isLatest(index) ? 'text-primary-600' : 'text-gray-900'}`}>
                            {track.description}
                          </p>
                          {track.location && (
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {track.location}
                            </p>
                          )}
                          {(track.temperature !== null || track.humidity !== null) && (
                            <div className="flex gap-4 mt-1">
                              {track.temperature !== null && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Thermometer className="w-3 h-3" />
                                  {track.temperature}°C
                                </span>
                              )}
                              {track.humidity !== null && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Droplets className="w-3 h-3" />
                                  {track.humidity}%
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-gray-400 whitespace-nowrap">
                          {formatTime(track.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
