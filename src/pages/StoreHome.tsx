import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Tag,
  Leaf,
  Droplets,
  Bug,
  Wrench,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/utils/api';
import { useAppStore } from '@/stores/useAppStore';
import type { Product } from '../../shared/types';

const categories = [
  { id: 'seed', name: '种子', icon: Leaf, color: 'from-green-400 to-green-600' },
  { id: 'fertilizer', name: '化肥', icon: Droplets, color: 'from-yellow-400 to-yellow-600' },
  { id: 'pesticide', name: '农药', icon: Bug, color: 'from-red-400 to-red-600' },
  { id: 'tool', name: '农具', icon: Wrench, color: 'from-blue-400 to-blue-600' },
];

export default function StoreHome() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const { addToCart } = useAppStore();

  useEffect(() => {
    loadProducts();
  }, [activeCategory, searchQuery]);

  const loadProducts = () => {
    api.store
      .products({
        category: activeCategory || undefined,
        search: searchQuery || undefined,
      })
      .then((data) => setProducts(data as Product[]))
      .catch(() => {});
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product, 0, 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">农资商城</h1>
          <p className="text-gray-500 mt-1">精选优质农资，正品保障，快速配送</p>
        </div>
        <Link to="/store/cart">
          <Button variant="outline">
            <ShoppingCart className="w-5 h-5 mr-2" />
            购物车
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="搜索商品名称..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Categories */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">商品分类</h3>
          <div className="grid grid-cols-4 gap-4">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(isActive ? '' : cat.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                    isActive
                      ? 'bg-primary-50 ring-2 ring-primary-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-medium text-gray-900">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Promo Banner */}
      <div className="bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl p-6 lg:p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5" />
              <span className="font-medium">限时特惠</span>
            </div>
            <h2 className="text-2xl font-bold mb-1">春耕农资大促</h2>
            <p className="text-white/80">满200减30，满500减100，多买多省！</p>
          </div>
          <Button className="bg-white text-orange-500 hover:bg-gray-100">
            立即抢购
          </Button>
        </div>
      </div>

      {/* Product List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {activeCategory
              ? categories.find((c) => c.id === activeCategory)?.name
              : '全部商品'}
          </h3>
          <Link to="/store/orders" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
            我的订单 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <Card key={product.id} hoverable className="group">
              <Link to={`/store/product/${product.id}`}>
                <div className="aspect-square overflow-hidden">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </Link>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 line-clamp-2 flex-1">
                    <Link to={`/store/product/${product.id}`} className="hover:text-primary-600">
                      {product.name}
                    </Link>
                  </h4>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary">{product.supplierName}</Badge>
                  <span className="text-xs text-gray-500">已售 {product.sales}</span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-xl font-bold text-red-500">¥{product.price}</span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-400 line-through ml-2">
                        ¥{product.originalPrice}
                      </span>
                    )}
                  </div>
                  <Button size="sm" onClick={() => handleAddToCart(product)}>
                    <ShoppingCart className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
