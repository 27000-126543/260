import { useState, useEffect } from 'react';
import {
  Wallet,
  CreditCard,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  FileText,
  Plus,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/utils/api';
import type { LoanProduct, LoanApplication } from '../../shared/types';

export default function AgricultureFinance() {
  const [loanProducts, setLoanProducts] = useState<LoanProduct[]>([]);
  const [myLoans, setMyLoans] = useState<LoanApplication[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'my'>('products');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.finance.getProducts(), api.finance.getMyLoans()])
      .then(([products, loans]) => {
        setLoanProducts(products as LoanProduct[]);
        setMyLoans(loans as LoanApplication[]);
      })
      .finally(() => setLoading(false));
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'repaying':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      pending: '审核中',
      approved: '已通过',
      rejected: '已拒绝',
      repaying: '还款中',
      completed: '已结清',
    };
    return map[status] || status;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">农业金融</h1>
        <p className="text-gray-500 mt-1">低息贷款，快速审批，助力农业生产</p>
      </div>

      {/* Credit Info */}
      <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-6 h-6" />
                <span className="font-medium">我的授信额度</span>
              </div>
              <div className="text-5xl font-bold mb-2">¥80,000</div>
              <div className="text-white/80">
                信用分：720 <Badge className="ml-2 bg-white/20 text-white">优秀</Badge>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="text-xl font-semibold">3笔</div>
                <div className="text-sm text-white/70">历史借款</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div className="text-xl font-semibold">100%</div>
                <div className="text-sm text-white/70">还款率</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="text-xl font-semibold">2年</div>
                <div className="text-sm text-white/70">合作时长</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
            activeTab === 'products'
              ? 'bg-primary-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          贷款产品
        </button>
        <button
          onClick={() => setActiveTab('my')}
          className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
            activeTab === 'my'
              ? 'bg-primary-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          我的贷款
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : activeTab === 'products' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loanProducts.map((product) => (
            <Card key={product.id} hoverable>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                  </div>
                  <Badge variant="info">{product.guaranteeType}</Badge>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">额度范围</span>
                    <span className="font-medium text-gray-900">
                      ¥{product.minAmount} - ¥{product.maxAmount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">年利率</span>
                    <span className="font-medium text-red-500">{product.interestRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">贷款期限</span>
                    <span className="font-medium text-gray-900">{product.term}个月</span>
                  </div>
                </div>
                <Button className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  立即申请
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {myLoans.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Wallet className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">暂无贷款记录</h3>
                <p className="text-gray-500 mb-6">去看看有哪些适合的贷款产品吧</p>
                <Button onClick={() => setActiveTab('products')}>查看产品</Button>
              </CardContent>
            </Card>
          ) : (
            myLoans.map((loan) => (
              <Card key={loan.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{loan.productName}</h4>
                        <Badge className={getStatusStyle(loan.status)}>
                          {getStatusText(loan.status)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">贷款金额</span>
                          <div className="font-medium text-gray-900">¥{loan.amount}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">年利率</span>
                          <div className="font-medium text-gray-900">{loan.interestRate}%</div>
                        </div>
                        <div>
                          <span className="text-gray-500">借款日期</span>
                          <div className="font-medium text-gray-900">{loan.startDate}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">到期日期</span>
                          <div className="font-medium text-gray-900">{loan.endDate}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {loan.status === 'repaying' && (
                        <>
                          <Button variant="outline">查看详情</Button>
                          <Button>立即还款</Button>
                        </>
                      )}
                      {loan.status === 'pending' && (
                        <Button variant="outline">取消申请</Button>
                      )}
                    </div>
                  </div>
                  {loan.status === 'repaying' && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">剩余应还</span>
                        <span className="text-xl font-bold text-red-500">
                          ¥{loan.remainingAmount}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Tips */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">温馨提示</h4>
              <p className="text-sm text-gray-700">
                按时还款有助于提升您的信用额度。系统会在还款日自动从您的账户扣款，请确保账户余额充足。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
