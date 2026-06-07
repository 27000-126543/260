import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Leaf, Tractor, Users, TrendingUp, Shield } from 'lucide-react';

export function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, loading } = useAppStore();

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone || !password) {
      setError('请填写手机号和密码');
      return;
    }

    if (isRegister) {
      if (!name) {
        setError('请填写姓名');
        return;
      }
      if (password !== confirmPassword) {
        setError('两次输入的密码不一致');
        return;
      }
      if (password.length < 6) {
        setError('密码至少6位');
        return;
      }
      
      const result = await register(phone, name, password);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.error || '注册失败');
      }
    } else {
      const result = await login(phone, password);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.error || '登录失败');
      }
    }
  };

  const features = [
    { icon: <Leaf className="w-6 h-6" />, title: '智能种植', desc: '土壤检测分析，推荐最优品种' },
    { icon: <Tractor className="w-6 h-6" />, title: '农资商城', desc: '正品保障，仓库就近发货' },
    { icon: <Shield className="w-6 h-6" />, title: '农技服务', desc: 'AI病虫害识别，专家在线诊断' },
    { icon: <TrendingUp className="w-6 h-6" />, title: '产销对接', desc: '智能定价，冷链物流追踪' },
  ];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-green-50 via-white to-green-50">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-700 text-white p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Leaf className="w-7 h-7" />
            </div>
            <span className="text-2xl font-bold">智慧农业平台</span>
          </div>
          
          <h1 className="text-4xl font-bold mb-6 leading-tight">
            科技赋能农业<br />
            智慧创造丰收
          </h1>
          <p className="text-white/80 text-lg mb-12">
            一站式智慧农业综合服务平台，从种植到销售全链条数字化管理
          </p>

          <div className="grid grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-5">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                  {feature.icon}
                </div>
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-white/70">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-white/60">
          <Users className="w-5 h-5" />
          <span>已服务全国 10,000+ 农户</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-primary-600" />
            </div>
            <span className="text-xl font-bold text-gray-800">智慧农业平台</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isRegister ? '注册账号' : '欢迎回来'}
            </h2>
            <p className="text-gray-500">
              {isRegister ? '加入我们，开启智慧农业之旅' : '登录您的账户继续'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Input
              label="手机号"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号"
              maxLength={11}
            />

            {isRegister && (
              <Input
                label="姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入真实姓名"
              />
            )}

            <Input
              label="密码"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
            />

            {isRegister && (
              <Input
                label="确认密码"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入密码"
              />
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base"
              loading={loading}
            >
              {isRegister ? '立即注册' : '登录'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-gray-500">
              {isRegister ? '已有账号？' : '还没有账号？'}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-primary-600 hover:text-primary-700 font-medium ml-1"
            >
              {isRegister ? '立即登录' : '免费注册'}
            </button>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 text-center">
              测试账号：13800138000 / 123456
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
