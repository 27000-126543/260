import { useState, useEffect } from 'react';
import {
  Crown,
  Star,
  Gift,
  Truck,
  Headphones,
  Tag,
  ChevronRight,
  Zap,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/utils/api';
import type { MemberInfo } from '../../shared/types';

const levelConfig = {
  normal: {
    name: '普通会员',
    color: 'from-gray-400 to-gray-500',
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-100',
    required: { amount: 0, area: 0 },
  },
  silver: {
    name: '银卡会员',
    color: 'from-gray-300 to-gray-400',
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-100',
    required: { amount: 10000, area: 10 },
  },
  gold: {
    name: '金卡会员',
    color: 'from-yellow-400 to-yellow-500',
    textColor: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    required: { amount: 50000, area: 30 },
  },
  diamond: {
    name: '钻石会员',
    color: 'from-blue-400 to-purple-500',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    required: { amount: 200000, area: 100 },
  },
};

const benefits = [
  {
    icon: Tag,
    name: '专属折扣',
    description: '农资采购享折扣优惠',
    levels: { normal: '95折', silver: '9折', gold: '85折', diamond: '8折' },
  },
  {
    icon: Truck,
    name: '免运费',
    description: '订单满额免运费',
    levels: { normal: '满200免', silver: '满100免', gold: '全场免', diamond: '全场免' },
  },
  {
    icon: Headphones,
    name: '农技咨询',
    description: '专家在线咨询服务',
    levels: { normal: '3次/月', silver: '10次/月', gold: '30次/月', diamond: '无限次' },
  },
  {
    icon: Zap,
    name: '优先采购',
    description: '紧俏商品优先购买',
    levels: { normal: false, silver: true, gold: true, diamond: true },
  },
  {
    icon: Gift,
    name: '生日礼遇',
    description: '生日当月专属福利',
    levels: { normal: false, silver: true, gold: true, diamond: true },
  },
];

export default function MemberCenter() {
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.member
      .getInfo()
      .then((data) => setMemberInfo(data as MemberInfo))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const currentLevel = memberInfo?.level || 'gold';
  const level = levelConfig[currentLevel as keyof typeof levelConfig];
  const nextLevelKey =
    currentLevel === 'normal'
      ? 'silver'
      : currentLevel === 'silver'
      ? 'gold'
      : currentLevel === 'gold'
      ? 'diamond'
      : null;
  const nextLevel = nextLevelKey ? levelConfig[nextLevelKey as keyof typeof levelConfig] : null;

  const amountProgress = nextLevel
    ? Math.min(100, ((memberInfo?.totalAmount || 0) / nextLevel.required.amount) * 100)
    : 100;
  const areaProgress = nextLevel
    ? Math.min(100, ((memberInfo?.plantArea || 0) / nextLevel.required.area) * 100)
    : 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">会员中心</h1>
        <p className="text-gray-500 mt-1">等级越高，权益越多</p>
      </div>

      {/* Member Card */}
      <Card className={`bg-gradient-to-br ${level.color} text-white overflow-hidden`}>
        <CardContent className="p-8 relative">
          <Crown className="absolute top-6 right-6 w-16 h-16 text-white/20" />
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <Star className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{level.name}</h2>
              <p className="text-white/80">会员ID：{memberInfo?.memberId}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-bold">{memberInfo?.points}</div>
              <div className="text-sm text-white/70">积分余额</div>
            </div>
            <div>
              <div className="text-3xl font-bold">¥{memberInfo?.totalAmount?.toLocaleString()}</div>
              <div className="text-sm text-white/70">累计交易</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{memberInfo?.plantArea}亩</div>
              <div className="text-sm text-white/70">种植面积</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Progress */}
      {nextLevel && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">升级进度</h3>
            <Badge className={level.bgColor + ' ' + level.textColor}>
              距离{nextLevel.name}还需
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">交易金额</span>
                  <span className="text-sm text-gray-600">
                    ¥{memberInfo?.totalAmount?.toLocaleString()} / ¥
                    {nextLevel.required.amount.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all"
                    style={{ width: `${amountProgress}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">种植面积</span>
                  <span className="text-sm text-gray-600">
                    {memberInfo?.plantArea}亩 / {nextLevel.required.area}亩
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all"
                    style={{ width: `${areaProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Benefits */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">会员权益</h3>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {benefits.map((benefit, i) => {
              const BenefitIcon = benefit.icon;
              const value = benefit.levels[currentLevel as keyof typeof benefit.levels];
              const hasBenefit = value !== false;
              return (
                <div
                  key={i}
                  className={`p-4 rounded-xl border transition-all ${
                    hasBenefit
                      ? 'bg-white border-gray-200 hover:border-primary-300'
                      : 'bg-gray-50 border-gray-100 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        hasBenefit ? level.bgColor : 'bg-gray-200'
                      }`}
                    >
                      <BenefitIcon className={`w-6 h-6 ${hasBenefit ? level.textColor : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{benefit.name}</h4>
                        {hasBenefit ? (
                          <Badge variant="success" className="text-xs">
                            已享有
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            升级解锁
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{benefit.description}</p>
                      {hasBenefit && value !== true && (
                        <p className={`text-sm font-medium mt-2 ${level.textColor}`}>
                          {value}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* All Levels */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">等级体系</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(levelConfig).map(([key, config]) => {
              const isCurrent = key === currentLevel;
              return (
                <div
                  key={key}
                  className={`p-4 rounded-xl text-center border-2 transition-all ${
                    isCurrent
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-gradient-to-br ${config.color}`}
                  >
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{config.name}</h4>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <div>交易额 ¥{config.required.amount.toLocaleString()}+</div>
                    <div>种植面积 {config.required.area}亩+</div>
                  </div>
                  {isCurrent && (
                    <Badge variant="success" className="mt-2">
                      <Check className="w-3 h-3 mr-1" />
                      当前等级
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
