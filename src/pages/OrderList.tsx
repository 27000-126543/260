import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/utils/api';
import type { Order } from '../../shared/types';

const tabs = [
  { key: '', label: '全部' },
  { key: 'paid', label: '待发货' },
  { key: 'shipped', label: '待收货' },
  { key: 'completed', label: '已完成' },
];

const statusConfig = {
  pending: { label: '待付款', icon: Clock, color: 'text-yellow-600 bg-yellow-100' },
  paid: { label: '待发货', icon: Package, color: 'text-blue-600 bg-blue-100' },
  shipped: { label: '待收货', icon: Truck, color: 'text-orange-600 bg-orange-100' },
  delivered: { label: '已送达', icon: CheckCircle, color: 'text-green-600 bg-green-100' },
  completed: { label: '已完成', icon: CheckCircle, color: 'text-green-600 bg-green-100' },
  cancelled: { label: '已取消', icon: XCircle, color: 'text-gray-600 bg-gray-100' },
};

export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.store
      .orders()
      .then((data) => setOrders(data as Order[]))
      .finally(() => setLoading(false));
  }, []);

  const filteredOrders = activeTab
    ? orders.filter((o) => o.status === activeTab)
    : orders;

  return (
    <div className="space-y-6">
      <Link to="/store" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <ChevronLeft className="w-5 h-5" />
        返回商城
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">我的订单</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">暂无订单</h3>
            <p className="text-gray-500 mb-6">快去商城下单吧</p>
            <Link to="/store">
              <Button>去购物</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const status = statusConfig[order.status];
            const StatusIcon = status.icon;
            return (
              <Card key={order.id}>
                <CardHeader className="flex flex-row items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">订单号：{order.orderNo}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <Badge className={status.color}>
                    <StatusIcon className="w-4 h-4 mr-1" />
                    {status.label}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 mb-4">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex gap-3">
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 line-clamp-1">
                            {item.productName}
                          </h4>
                          <p className="text-sm text-gray-500">{item.spec}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-red-500 font-medium">¥{item.price}</span>
                            <span className="text-gray-500">x{item.quantity}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="text-sm text-gray-600">
                      共 {order.items.reduce((s, i) => s + i.quantity, 0)} 件商品，
                      <span className="text-gray-900 font-medium ml-1">
                        实付 ¥{order.totalAmount}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {order.status === 'shipped' && (
                        <Link to={`/store/orders/${order.id}/logistics`}>
                          <Button variant="outline" size="sm">
                            查看物流
                          </Button>
                        </Link>
                      )}
                      {order.status === 'delivered' && (
                        <Button size="sm">确认收货</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
