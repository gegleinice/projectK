'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Phone, 
  Shield, 
  ArrowRight, 
  Sparkles,
  Building2,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { sendVerificationCode, verifyCode, loginOrRegister, saveUser, getCurrentUser } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code' | 'success'>('phone');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // 检查是否已登录
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      router.push('/');
    }
  }, [router]);

  // 倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 发送验证码
  const handleSendCode = async () => {
    if (!phone || phone.length !== 11) {
      setError('请输入正确的手机号');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = sendVerificationCode(phone);
      if (result.success) {
        setMessage(result.message);
        setStep('code');
        setCountdown(60);
      }
    } catch {
      setError('发送失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 验证并登录
  const handleVerifyAndLogin = async () => {
    if (!code || code.length !== 6) {
      setError('请输入6位验证码');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const isValid = verifyCode(phone, code);
      if (!isValid) {
        setError('验证码错误或已过期');
        setLoading(false);
        return;
      }
      
      // 登录或注册
      const user = loginOrRegister(phone);
      saveUser(user);
      
      setStep('success');
      
      // 延迟跳转
      setTimeout(() => {
        if (user.companyBound) {
          router.push('/');
        } else {
          router.push('/user/bindcompany');
        }
      }, 1500);
    } catch {
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 品牌特性
  const features = [
    { icon: <Sparkles className="w-5 h-5" />, text: 'AI智能识别开票信息' },
    { icon: <Building2 className="w-5 h-5" />, text: '一键绑定企业工商信息' },
    { icon: <Shield className="w-5 h-5" />, text: '银行级数据安全保护' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 flex">
      {/* 左侧品牌区域 */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-40 right-10 w-96 h-96 bg-cyan-300 rounded-full blur-3xl"></div>
          </div>
          {/* 网格线条 */}
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
              backgroundSize: '60px 60px'
            }}
          />
        </div>
        
        {/* 品牌内容 */}
        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24">
          <div className="mb-12">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">AI财税助手</h1>
                <p className="text-blue-200 text-sm mt-1">让财税工作更简单</p>
              </div>
            </div>
            
            <h2 className="text-4xl xl:text-5xl font-light text-white leading-tight mb-6">
              智能开票<br />
              <span className="font-semibold">从这里开始</span>
            </h2>
            
            <p className="text-blue-100 text-lg max-w-md leading-relaxed">
              为中小企业主打造的智能财税工具，<br />
              让开票、报税、审计变得像聊天一样简单。
            </p>
          </div>
          
          {/* 特性列表 */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="flex items-center space-x-4 text-white/90"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  {feature.icon}
                </div>
                <span className="text-base">{feature.text}</span>
              </div>
            ))}
          </div>
          
          {/* 底部装饰 */}
          <div className="absolute bottom-12 left-16 xl:left-24">
            <p className="text-blue-200/60 text-sm">
              已有 <span className="text-white font-semibold">10,000+</span> 企业正在使用
            </p>
          </div>
        </div>
      </div>
      
      {/* 右侧登录区域 */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* 移动端 Logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
              <FileText className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">AI财税助手</h1>
          </div>
          
          {/* 登录卡片 */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
            {step === 'success' ? (
              // 成功状态
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">登录成功</h2>
                <p className="text-slate-500">正在为您跳转...</p>
              </div>
            ) : (
              <>
                {/* 标题 */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    {step === 'phone' ? '欢迎使用' : '输入验证码'}
                  </h2>
                  <p className="text-slate-500 text-sm">
                    {step === 'phone' 
                      ? '手机号快速登录，新用户自动注册' 
                      : message}
                  </p>
                </div>
                
                {/* 表单 */}
                <div className="space-y-5">
                  {step === 'phone' ? (
                    // 手机号输入
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        手机号
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value.replace(/\D/g, '').slice(0, 11));
                            setError('');
                          }}
                          placeholder="请输入手机号"
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-0 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-lg"
                          autoFocus
                        />
                      </div>
                    </div>
                  ) : (
                    // 验证码输入
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        验证码
                      </label>
                      <div className="relative">
                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          value={code}
                          onChange={(e) => {
                            setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                            setError('');
                          }}
                          placeholder="请输入6位验证码"
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-0 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-lg tracking-widest"
                          autoFocus
                        />
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <button
                          onClick={() => setStep('phone')}
                          className="text-sm text-slate-500 hover:text-slate-700"
                        >
                          ← 修改手机号
                        </button>
                        <button
                          onClick={handleSendCode}
                          disabled={countdown > 0}
                          className="text-sm text-blue-600 hover:text-blue-700 disabled:text-slate-400"
                        >
                          {countdown > 0 ? `${countdown}s 后重发` : '重新发送'}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* 错误提示 */}
                  {error && (
                    <p className="text-red-500 text-sm text-center">{error}</p>
                  )}
                  
                  {/* 提交按钮 */}
                  <button
                    onClick={step === 'phone' ? handleSendCode : handleVerifyAndLogin}
                    disabled={loading || (step === 'phone' ? phone.length !== 11 : code.length !== 6)}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/30 hover:shadow-xl"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>{step === 'phone' ? '获取验证码' : '登录'}</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
                
                {/* 开发提示 */}
                <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-amber-800 text-xs text-center">
                    💡 演示模式：验证码输入 <span className="font-mono font-bold">888888</span> 即可登录
                  </p>
                </div>
              </>
            )}
          </div>
          
          {/* 协议 */}
          <p className="text-center text-slate-400 text-xs mt-6">
            登录即表示同意
            <a href="#" className="text-blue-600 hover:underline mx-1">用户协议</a>
            和
            <a href="#" className="text-blue-600 hover:underline mx-1">隐私政策</a>
          </p>
        </div>
      </div>
    </div>
  );
}


