import { Link } from 'react-router-dom';
import { Trash2, ChevronLeft, Minus, Plus, ShoppingCart as ShoppingCartIcon } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/stores/useAppStore';

export default function ShoppingCart() {
  const { cart, updateCartQuantity, removeFromCart, clearCart } = useAppStore();

  const subtotal = cart.reduce(
    (sum, item) => sum + (item.product.price + (item.product.specs[item.specIndex]?.priceAdjust || 0)) * item.quantity,
    0
  );

  const shipping = subtotal > 200 ? 0 : 15;
  const total = subtotal + shipping;

  if (cart.length === 0) {
    return (
      <div className="space-y-6">
        <Link to="/store" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ChevronLeft className="w-5 h-5" />
          返回商城
        </Link>
        <Card>
          <CardContent className="py-16 text-center">
            <ShoppingCartIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">购物车是空的</h3>
            <p className="text-gray-500 mb-6">快去挑选心仪的农资商品吧</p>
            <Link to="/store">
              <Button>去逛逛</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">购物车</h1>
          <p className="text-gray-500 mt-1">共 {cart.reduce((s, i) => s + i.quantity, 0)} 件商品</p>
        </div>
        <button
          onClick={clearCart}
          className="text-sm text-gray-500 hover:text-red-500"
        >
          清空购物车
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => {
            const itemPrice = item.product.price + (item.product.specs[item.specIndex]?.priceAdjust || 0);
            return (
              <Card key={`${item.productId}-${item.specIndex}`}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-gray-900 line-clamp-2">
                          <Link to={`/store/product/${item.productId}`} className="hover:text-primary-600">
                            {item.product.name}
                          </Link>
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.productId, item.specIndex)}
                          className="p-2 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <Badge variant="secondary" className="mt-1">
                        {item.product.specs[item.specIndex]?.value}
                      </Badge>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-lg font-bold text-red-500">¥{itemPrice}</span>
                        <div className="flex items-center border border-gray-200 rounded-lg">
                          <button
                            onClick={() => updateCartQuantity(item.productId, item.specIndex, item.quantity - 1)}
                            className="p-2 hover:bg-gray-50"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-10 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.productId, item.specIndex, item.quantity + 1)}
                            className="p-2 hover:bg-gray-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div>
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">订单摘要</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">商品小计</span>
                  <span className="font-medium">¥{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">运费</span>
                  <span className="font-medium">
                    {shipping === 0 ? <Badge variant="success">免运费</Badge> : `¥${shipping}`}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-gray-500">
                    满200元免运费，还差¥{(200 - subtotal).toFixed(2)}
                  </p>
                )}
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">应付总额</span>
                    <span className="text-2xl font-bold text-red-500">¥{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Button className="w-full" size="lg">
                去结算
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
