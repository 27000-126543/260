import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Truck,
  Shield,
  RotateCcw,
  Star,
  ChevronLeft,
  Minus,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/utils/api';
import { useAppStore } from '@/stores/useAppStore';
import type { Product } from '../../shared/types';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSpec, setSelectedSpec] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useAppStore();

  useEffect(() => {
    if (id) {
      api.store
        .product(id)
        .then((data) => setProduct(data as Product))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!product) {
    return <div className="text-center py-20">商品不存在</div>;
  }

  const currentPrice = product.price + (product.specs[selectedSpec]?.priceAdjust || 0);

  const handleAddToCart = () => {
    addToCart(product, selectedSpec, quantity);
    navigate('/store/cart');
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ChevronLeft className="w-5 h-5" />
        返回
      </button>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <Card>
          <CardContent className="p-6">
            <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 mb-4">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary-500 transition-colors"
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Product Info */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{product.supplierName}</Badge>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm text-gray-600">4.9</span>
                    </div>
                    <span className="text-sm text-gray-500">销量 {product.sales}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 mb-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-red-500">¥{currentPrice}</span>
                  {product.originalPrice && (
                    <span className="text-lg text-gray-400 line-through">
                      ¥{product.originalPrice + (product.specs[selectedSpec]?.priceAdjust || 0)}
                    </span>
                  )}
                </div>
              </div>

              {/* Specs */}
              {product.specs.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">
                    {product.specs[0]?.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {product.specs.map((spec, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedSpec(i)}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          selectedSpec === i
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {spec.value}
                        {spec.priceAdjust > 0 && (
                          <span className="text-red-500 ml-1">+¥{spec.priceAdjust}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">数量</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-gray-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-3 hover:bg-gray-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">库存 {product.stock} 件</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleAddToCart}>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  加入购物车
                </Button>
                <Button className="flex-1">立即购买</Button>
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium text-gray-900 mb-4">服务保障</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-700">极速配送</span>
                  <span className="text-xs text-gray-500">就近仓库发货</span>
                </div>
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-700">正品保障</span>
                  <span className="text-xs text-gray-500">厂家直供</span>
                </div>
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <RotateCcw className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="text-sm text-gray-700">7天退换</span>
                  <span className="text-xs text-gray-500">无忧售后</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Product Description */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">商品详情</h3>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">{product.description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
