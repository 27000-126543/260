import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  TrendingUp,
  Clock,
  MapPin,
  Plus,
  Search,
  Tag,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/utils/api';
import type { MarketProduct } from '../../shared/types';

export default function MarketHome() {
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.market
      .products()
      .then((data) => setProducts(data as MarketProduct[]))
      .finally(() => setLoading(false));
  }, []);

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'presale', label: '预售中' },
    { key: 'selling', label: '热卖中' },
  ];

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.includes(searchQuery);
    const matchesTab = activeTab === 'all' || p.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">农产品交易</h1>
          <p className="text-gray-500 mt-1">预售直供，溯源保真，冷链配送</p>
        </div>
        <Link to="/market/my-products">
          <Button>
            <Plus className="w-5 h-5 mr-2" />
            上架产品
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="搜索农产品..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Market Price Banner */}
      <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="font-medium">今日行情</span>
              </div>
              <h3 className="text-xl font-bold">市场均价稳中有升</h3>
              <p className="text-white/80 mt-1">建议把握时机适时出货</p>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">¥3.2</div>
                <div className="text-sm text-white/70">蔬菜均价/斤</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">¥2.8</div>
                <div className="text-sm text-white/70">水果均价/斤</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">¥1.6</div>
                <div className="text-sm text-white/70">粮食均价/斤</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Products */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} hoverable className="group">
              <div className="relative">
                <Link to={`/market/product/${product.id}`}>
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </Link>
                <Badge
                  variant={product.status === 'presale' ? 'warning' : 'success'}
                  className="absolute top-3 left-3"
                >
                  {product.status === 'presale' ? '预售' : '热卖'}
                </Badge>
                {product.smartPricing && (
                  <Badge variant="info" className="absolute top-3 right-3">
                    <Sparkles className="w-3 h-3 mr-1" />
                    智能定价
                  </Badge>
                )}
              </div>
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                  <Link to={`/market/product/${product.id}`} className="hover:text-primary-600">
                    {product.name}
                  </Link>
                </h4>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>{product.origin}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xl font-bold text-red-500">¥{product.price}</span>
                    <span className="text-sm text-gray-500">/{product.unit}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    <span>{product.sales}</span>
                    <span>已售</span>
                  </div>
                </div>
                {product.status === 'presale' && (
                  <div className="mt-3 flex items-center gap-1 text-sm text-orange-600">
                    <Clock className="w-4 h-4" />
                    <span>预计 {product.harvestDate} 上市</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
