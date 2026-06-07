import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  MapPin,
  Sparkles,
  ShoppingCart,
  Sprout,
  Cloud,
  Store,
  Wallet,
  Crown,
  LayoutDashboard,
  FileBarChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/land', label: '土地管理', icon: MapPin },
  { path: '/recommendation', label: '智能推荐', icon: Sparkles },
  { path: '/store', label: '农资商城', icon: ShoppingCart },
  { path: '/field', label: '田间管理', icon: Sprout },
  { path: '/weather', label: '气象预警', icon: Cloud },
  { path: '/market', label: '农产品交易', icon: Store },
  { path: '/finance', label: '农业金融', icon: Wallet },
  { path: '/member', label: '会员中心', icon: Crown },
];

const adminMenuItems = [
  { path: '/admin', label: '数据看板', icon: LayoutDashboard },
  { path: '/admin/reports', label: '运营报表', icon: FileBarChart },
];

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const location = useLocation();
  const items = isAdmin ? adminMenuItems : menuItems;

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
            <Sprout className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900">智慧农业</h1>
            <p className="text-xs text-gray-500">综合服务平台</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>

        {!isAdmin && (
          <>
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="px-4 text-xs font-medium text-gray-400 uppercase mb-3">
                管理员入口
              </p>
              <NavLink
                to="/admin"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>管理员看板</span>
              </NavLink>
            </div>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-900 mb-1">需要帮助？</p>
          <p className="text-xs text-gray-600 mb-3">联系客服获取专业支持</p>
          <button className="w-full py-2 bg-white text-primary-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            联系客服
          </button>
        </div>
      </div>
    </aside>
  );
}
