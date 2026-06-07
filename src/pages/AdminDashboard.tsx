import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingCart,
  Package,
  Bug,
  CloudRain,
  Truck,
  Users,
  Calendar,
  Download,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/utils/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import type { DashboardData } from '../../shared/types';

const salesTrendData = [
  { month: '1月', 农资: 120, 农产品: 80, 贷款: 50 },
  { month: '2月', 农资: 150, 农产品: 100, 贷款: 60 },
  { month: '3月', 农资: 180, 农产品: 120, 贷款: 70 },
  { month: '4月', 农资: 220, 农产品: 140, 贷款: 85 },
  { month: '5月', 农资: 190, 农产品: 160, 贷款: 95 },
  { month: '6月', 农资: 250, 农产品: 180, 贷款: 110 },
];

const cropAreaData = [
  { region: '华东', 水稻: 500, 小麦: 300, 蔬菜: 200, 水果: 150 },
  { region: '华中', 水稻: 400, 小麦: 450, 蔬菜: 180, 水果: 120 },
  { region: '华北', 水稻: 200, 小麦: 500, 蔬菜: 150, 水果: 100 },
  { region: '华南', 水稻: 450, 小麦: 100, 蔬菜: 250, 水果: 200 },
  { region: '西南', 水稻: 350, 小麦: 250, 蔬菜: 200, 水果: 180 },
];

const categoryData = [
  { name: '蔬菜', value: 35 },
  { name: '水果', value: 25 },
  { name: '粮食', value: 20 },
  { name: '农资', value: 15 },
  { name: '其他', value: 5 },
];

const COLORS = ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [regionFilter, setRegionFilter] = useState('全国');
  const [timeFilter, setTimeFilter] = useState('本月');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin
      .getDashboard()
      .then((data) => setDashboardData(data as DashboardData))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    {
      label: '总种植面积',
      value: dashboardData?.totalCropArea || 12580,
      unit: '亩',
      change: '+12.5%',
      trend: 'up',
      icon: LayoutDashboard,
      color: 'from-green-400 to-green-600',
    },
    {
      label: '农资销售额',
      value: dashboardData?.storeSales || 326.8,
      unit: '万元',
      change: '+18.2%',
      trend: 'up',
      icon: ShoppingCart,
      color: 'from-blue-400 to-blue-600',
    },
    {
      label: '订单完成率',
      value: dashboardData?.orderCompletionRate || 98.5,
      unit: '%',
      change: '+2.1%',
      trend: 'up',
      icon: Package,
      color: 'from-yellow-400 to-yellow-600',
    },
    {
      label: '病虫害发生率',
      value: dashboardData?.pestRate || 3.2,
      unit: '%',
      change: '-1.5%',
      trend: 'down',
      icon: Bug,
      color: 'from-red-400 to-red-600',
    },
    {
      label: '气象预警数',
      value: dashboardData?.weatherAlerts || 15,
      unit: '条',
      change: '+3',
      trend: 'up',
      icon: CloudRain,
      color: 'from-cyan-400 to-cyan-600',
    },
    {
      label: '物流准时率',
      value: dashboardData?.logisticsOnTime || 96.8,
      unit: '%',
      change: '+1.3%',
      trend: 'up',
      icon: Truck,
      color: 'from-purple-400 to-purple-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">管理员看板</h1>
          <p className="text-gray-500 mt-1">实时监控平台运营数据</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              {regionFilter}
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {timeFilter}
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            导出报表
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <Badge
                    variant={stat.trend === 'up' ? 'success' : 'danger'}
                    className="text-xs"
                  >
                    {stat.change}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                  <span className="text-sm font-normal text-gray-500 ml-1">
                    {stat.unit}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">交易趋势</h3>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="农资"
                  stackId="1"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="农产品"
                  stackId="2"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="贷款"
                  stackId="3"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">各区域作物面积</h3>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cropAreaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="region" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="水稻" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="小麦" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="蔬菜" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="水果" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">品类销售占比</h3>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">关键指标月度对比</h3>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="订单完成率"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: '#22c55e' }}
                />
                <Line
                  type="monotone"
                  dataKey="物流准时率"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                />
                <Line
                  type="monotone"
                  dataKey="农户活跃率"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Report */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">月度运营报表</h3>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            导出Excel
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    指标
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                    本月
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                    上月
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                    同比
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                    状态
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { name: '蔬菜品类收入', current: '¥128.5万', last: '¥115.2万', change: '+11.5%', status: '正常' },
                  { name: '水果品类收入', current: '¥96.8万', last: '¥88.4万', change: '+9.5%', status: '正常' },
                  { name: '粮食品类收入', current: '¥72.3万', last: '¥75.6万', change: '-4.4%', status: '注意' },
                  { name: '农户活跃率', current: '85.6%', last: '82.3%', change: '+3.3%', status: '良好' },
                  { name: '贷款不良率', current: '1.2%', last: '1.5%', change: '-0.3%', status: '良好' },
                  { name: '物流成本', current: '¥18.5万', last: '¥19.2万', change: '-3.6%', status: '正常' },
                  { name: '用户满意度', current: '4.8分', last: '4.7分', change: '+0.1分', status: '优秀' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{row.name}</td>
                    <td className="py-3 px-4 text-sm text-right font-medium">{row.current}</td>
                    <td className="py-3 px-4 text-sm text-right text-gray-500">{row.last}</td>
                    <td className="py-3 px-4 text-sm text-right">
                      <span
                        className={
                          row.change.startsWith('+')
                            ? 'text-green-600'
                            : row.change.startsWith('-')
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }
                      >
                        {row.change}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Badge
                        variant={
                          row.status === '优秀'
                            ? 'success'
                            : row.status === '良好'
                            ? 'info'
                            : row.status === '注意'
                            ? 'warning'
                            : 'secondary'
                        }
                      >
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
