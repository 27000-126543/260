import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  Menu,
  User,
  ShoppingCart,
  ChevronDown,
  LogOut,
  Settings,
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';

export function Header() {
  const navigate = useNavigate();
  const { user, cart } = useAppStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const memberLevelColors = {
    normal: 'bg-gray-100 text-gray-600',
    silver: 'bg-gray-200 text-gray-700',
    gold: 'bg-yellow-100 text-yellow-700',
    diamond: 'bg-blue-100 text-blue-700',
  };

  const memberLevelNames = {
    normal: '普通会员',
    silver: '银卡会员',
    gold: '金卡会员',
    diamond: '钻石会员',
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="relative hidden md:block w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索商品、资讯、服务..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/store/cart"
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ShoppingCart className="w-5 h-5 text-gray-600" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </Link>

          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <div className="relative">
            <button
              className="flex items-center gap-2 sm:gap-3 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded ${memberLevelColors[user?.memberLevel || 'normal']}`}>
                  {memberLevelNames[user?.memberLevel || 'normal']}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-medium text-gray-900">{user?.name}</p>
                  <p className="text-sm text-gray-500">{user?.phone}</p>
                </div>
                <button
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                  onClick={() => navigate('/member')}
                >
                  <Settings className="w-4 h-4" />
                  个人中心
                </button>
                <button
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                  onClick={() => {
                    useAppStore.getState().setUser(null);
                    useAppStore.getState().setLoggedIn(false);
                    navigate('/login');
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showMobileMenu && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <nav className="p-4 grid grid-cols-3 gap-2">
            {[
              { path: '/', label: '首页' },
              { path: '/land', label: '土地' },
              { path: '/recommendation', label: '推荐' },
              { path: '/store', label: '商城' },
              { path: '/field', label: '田间' },
              { path: '/weather', label: '气象' },
              { path: '/market', label: '交易' },
              { path: '/finance', label: '金融' },
              { path: '/member', label: '会员' },
            ].map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="py-3 text-center text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
                onClick={() => setShowMobileMenu(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
