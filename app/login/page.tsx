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
  Loader2,
  User,
  CreditCard,
  ChevronRight,
  Check
} from 'lucide-react';
import { sendVerificationCode, verifyCode, loginOrRegister, saveUser, getCurrentUser, verifyRealName, UserCompanyRelation } from '@/lib/auth';
import { bindCompany } from '@/lib/qixiangyun';
import { NaturalPersonAuthFlow } from '@/lib/qixiangyun/natural-person';
import { validatePhoneNumber, validatePassword } from '@/lib/qixiangyun/rsa-utils';
import { AREA_CODES, DEFAULT_AREA_CODE, formatAreaCode } from '@/lib/qixiangyun/area-codes';
import { Lock, Eye, EyeOff, MapPin, ChevronDown } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code' | 'verify' | 'companies' | 'success'>('phone');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // 实名认证相关 - 办税人信息
  const [realName, setRealName] = useState(''); // 办税人姓名
  const [taxPayerPhone, setTaxPayerPhone] = useState(''); // 办税人手机号
  const [taxPayerPassword, setTaxPayerPassword] = useState(''); // 税务APP密码
  const [showPassword, setShowPassword] = useState(false);
  const [selectedArea, setSelectedArea] = useState(DEFAULT_AREA_CODE); // 地区编码
  const [showAreaDropdown, setShowAreaDropdown] = useState(false); // 地区下拉框显示
  
  // 税务短信验证相关
  const [taxSmsCode, setTaxSmsCode] = useState(''); // 税务短信验证码
  const [smsSent, setSmsSent] = useState(false); // 验证码是否已发送
  const [smsCountdown, setSmsCountdown] = useState(0); // 发送按钮倒计时
  const [taskId, setTaskId] = useState(''); // API返回的任务ID
  const [sendingSms, setSendingSms] = useState(false); // 发送中状态
  
  // 名下企业列表
  const [relatedCompanies, setRelatedCompanies] = useState<UserCompanyRelation[]>([]);
  const [selectedCompanyIndex, setSelectedCompanyIndex] = useState<number | null>(null);
  
  // 当前用户临时存储
  const [tempUser, setTempUser] = useState<ReturnType<typeof loginOrRegister> | null>(null);

  // 检查是否已登录
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      router.push('/');
    }
  }, [router]);

  // 倒计时（系统登录验证码）
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 倒计时（税务验证码）
  useEffect(() => {
    if (smsCountdown > 0) {
      const timer = setTimeout(() => setSmsCountdown(smsCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [smsCountdown]);

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
      setTempUser(user);
      
      // 如果已经实名认证且绑定了企业，直接进入
      if (user.verified && user.companyBound) {
        saveUser(user);
        setStep('success');
        setTimeout(() => router.push('/'), 1500);
      } else if (user.verified && user.relatedCompanies && user.relatedCompanies.length > 0) {
        // 已实名但未选择企业
        setRelatedCompanies(user.relatedCompanies);
        setStep('companies');
      } else {
        // 需要实名认证
        setStep('verify');
        setMessage(''); // 清除登录时的消息
      }
    } catch {
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 发送税务验证码
  const handleSendTaxSms = async () => {
    // 验证地区是否已选择
    if (!selectedArea) {
      setError('请先选择所在地区');
      return;
    }
    if (!validatePhoneNumber(taxPayerPhone)) {
      setError('请输入正确的11位手机号');
      return;
    }
    if (!validatePassword(taxPayerPassword)) {
      setError('请先输入密码（至少6位）');
      return;
    }
    
    setSendingSms(true);
    setError('');
    
    // 演示模式：手机号以178开头时直接模拟成功
    if (taxPayerPhone.startsWith('178')) {
      setSmsSent(true);
      setSmsCountdown(60);
      setTaskId('demo-task-id');
      setSendingSms(false);
      return;
    }
    
    try {
      // 导入并调用API，使用格式化后的地区代码
      const { natureTpassLogin } = await import('@/lib/qixiangyun/natural-person');
      const formattedAreaCode = formatAreaCode(selectedArea);
      console.log('发送验证码 - 地区代码:', selectedArea, '->', formattedAreaCode);
      const result = await natureTpassLogin(taxPayerPhone, taxPayerPassword, formattedAreaCode);
      
      if (result.status === 'error') {
        setError(result.message || '发送验证码失败');
        return;
      }
      
      // 保存taskId
      if (result.taskId) {
        setTaskId(result.taskId);
      }
      
      // 标记已发送，开始倒计时
      setSmsSent(true);
      setSmsCountdown(60);
      
    } catch (err: any) {
      console.error('发送验证码失败:', err);
      setError(err.message || '发送验证码失败，请稍后重试');
    } finally {
      setSendingSms(false);
    }
  };

  // 实名认证
  const handleVerifyRealName = async () => {
    // 验证所有字段
    if (!realName || realName.length < 2) {
      setError('请输入办税人姓名');
      return;
    }
    if (!validatePhoneNumber(taxPayerPhone)) {
      setError('请输入正确的手机号');
      return;
    }
    if (!validatePassword(taxPayerPassword)) {
      setError('密码至少6位');
      return;
    }
    if (!smsSent) {
      setError('请先点击"发送"获取验证码');
      return;
    }
    if (!taxSmsCode || taxSmsCode.length < 4) {
      setError('请输入验证码');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // 演示模式
      if (taxPayerPhone.startsWith('178') && taxSmsCode === '888888') {
        // 模拟成功，返回演示企业
        const demoCompanies = [
          { nsrsbh: '91310000MA1FL8XQ30', nsrmc: '演示科技有限公司', sflx: 'BSY', glzt: '00', xh: 0 },
          { nsrsbh: '91310115MA1K4LXE6P', nsrmc: '演示贸易有限公司', sflx: 'BSY', glzt: '00', xh: 1 }
        ];
        handleAuthSuccess(demoCompanies);
        return;
      }
      
      // 步骤1: 验证验证码
      const { submitSmsCode, getZrrOrgList } = await import('@/lib/qixiangyun/natural-person');
      
      if (taskId) {
        const smsResult = await submitSmsCode(taskId, taxSmsCode);
        if (smsResult.status === 'error') {
          setError(smsResult.message || '验证码错误');
          return;
        }
      }
      
      // 步骤2: 获取企业列表（使用格式化后的地区代码）
      const formattedAreaCode = formatAreaCode(selectedArea);
      const companies = await getZrrOrgList(taxPayerPhone, taxPayerPassword, formattedAreaCode);
      
      if (companies.length === 0) {
        setError('该办税人名下暂无可用企业');
        return;
      }
      
      handleAuthSuccess(companies);
      
    } catch (err: any) {
      console.error('办税人认证失败:', err);
      setError(err.message || '认证失败，请检查验证码是否正确');
    } finally {
      setLoading(false);
    }
  };

  // 处理认证成功
  const handleAuthSuccess = (companies: any[]) => {
    const mappedCompanies: UserCompanyRelation[] = companies.map(company => ({
      name: company.nsrmc,
      creditCode: company.nsrsbh,
      role: company.sflx === 'BSY' ? '办税员' : company.sflx,
      bindDate: new Date().toISOString().split('T')[0]
    }));
    
    setRelatedCompanies(mappedCompanies);
    
    if (tempUser) {
      tempUser.verified = true;
      tempUser.realName = realName;
      tempUser.idCard = '';
      tempUser.relatedCompanies = mappedCompanies;
    }
    
    setStep('companies');
  };

  // 获取选中地区的名称
  const getSelectedAreaName = () => {
    const area = AREA_CODES.find(a => a.value === selectedArea);
    return area?.label || '请选择地区';
  };

  // 选择企业并绑定
  const handleSelectCompany = async () => {
    if (selectedCompanyIndex === null || !tempUser) return;
    
    const selectedCompany = relatedCompanies[selectedCompanyIndex];
    setLoading(true);
    setError('');
    
    try {
      const result = await bindCompany(selectedCompany.companyName);
      
      if (result.success && result.companyInfo) {
        tempUser.companyBound = true;
        tempUser.company = result.companyInfo;
        saveUser(tempUser);
        
        setStep('success');
        setTimeout(() => router.push('/'), 1500);
      }
    } catch {
      setError('绑定企业失败，请稍后重试');
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
            ) : step === 'verify' ? (
              // 实名认证
              <>
                {/* 步骤指示器 */}
                <div className="flex items-center justify-center space-x-2 mb-6">
                  <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                  <div className="w-12 h-0.5 bg-emerald-200"></div>
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <div className="w-12 h-0.5 bg-slate-200"></div>
                  <span className="w-6 h-6 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                </div>
                
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">自然人认证</h2>
                  <p className="text-slate-500 text-sm">完成实名认证后自动带出您名下的企业</p>
                </div>
                
                <div className="space-y-4">
                  {/* 办税人 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">办税人</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={realName}
                        onChange={(e) => { setRealName(e.target.value); setError(''); }}
                        placeholder="请输入真实姓名"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-0 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* 所在地区 - 前置，发送验证码需要地区代码 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">所在地区</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                      <button
                        type="button"
                        onClick={() => setShowAreaDropdown(!showAreaDropdown)}
                        className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-blue-200 rounded-xl text-slate-900 text-left focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      >
                        {getSelectedAreaName()}
                      </button>
                      <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-transform ${showAreaDropdown ? 'rotate-180' : ''}`} />
                      
                      {showAreaDropdown && (
                        <div className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 max-h-60 overflow-y-auto">
                          {AREA_CODES.map((area) => (
                            <button
                              key={area.value}
                              type="button"
                              onClick={() => { setSelectedArea(area.value); setShowAreaDropdown(false); setSmsSent(false); }}
                              className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center justify-between ${selectedArea === area.value ? 'bg-blue-50 text-blue-600' : 'text-slate-700'}`}
                            >
                              <span>{area.label}</span>
                              {area.isCity && <span className="text-xs text-slate-400">计划单列市</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">💡 请先选择地区，发送验证码需要地区信息</p>
                  </div>
                  
                  {/* 办税人手机号 + 发送按钮 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">办税人手机号</label>
                    <div className="relative flex space-x-2">
                      <div className="relative flex-1">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="tel"
                          value={taxPayerPhone}
                          onChange={(e) => { setTaxPayerPhone(e.target.value.replace(/\D/g, '').slice(0, 11)); setError(''); setSmsSent(false); }}
                          placeholder="请输入手机号"
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendTaxSms}
                        disabled={sendingSms || smsCountdown > 0 || taxPayerPhone.length !== 11 || taxPayerPassword.length < 6}
                        className="px-5 py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                      >
                        {sendingSms ? <Loader2 className="w-5 h-5 animate-spin" /> : smsCountdown > 0 ? `${smsCountdown}s` : '发送'}
                      </button>
                    </div>
                  </div>
                  
                  {/* 办税人密码(税务APP) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">办税人密码（税务APP）</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={taxPayerPassword}
                        onChange={(e) => { setTaxPayerPassword(e.target.value); setError(''); setSmsSent(false); }}
                        placeholder="请输入密码"
                        className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* 验证码输入框 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      验证码
                      {smsSent && <span className="ml-2 text-emerald-600 text-xs">已发送到 {taxPayerPhone.slice(0, 3)}****{taxPayerPhone.slice(-4)}</span>}
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={taxSmsCode}
                        onChange={(e) => { setTaxSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                        placeholder={smsSent ? "请输入验证码" : "请先点击发送获取验证码"}
                        disabled={!smsSent}
                        className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl text-slate-900 placeholder-slate-400 transition-all ${
                          smsSent 
                            ? 'bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white' 
                            : 'bg-slate-100 border-slate-200 cursor-not-allowed'
                        }`}
                        maxLength={6}
                      />
                    </div>
                    {smsSent && (
                      <p className="mt-1 text-xs text-slate-500">💡 演示模式：输入 888888 即可通过验证</p>
                    )}
                  </div>

                  {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                  
                  <button
                    onClick={handleVerifyRealName}
                    disabled={loading || realName.length < 2 || !validatePhoneNumber(taxPayerPhone) || !validatePassword(taxPayerPassword) || !smsSent || taxSmsCode.length < 4}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/30"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>认证并查询名下企业</span><ArrowRight className="w-5 h-5" /></>}
                  </button>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-blue-700 text-xs text-center">🔒 您的信息将通过税务系统安全认证，仅用于查询关联企业</p>
                </div>
              </>
            ) : step === 'companies' ? (
              // 选择企业
              <>
                {/* 步骤指示器 */}
                <div className="flex items-center justify-center space-x-2 mb-6">
                  <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                  <div className="w-12 h-0.5 bg-emerald-200"></div>
                  <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                  <div className="w-12 h-0.5 bg-emerald-200"></div>
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                </div>
                
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">选择您的企业</h2>
                  <p className="text-slate-500 text-sm">您名下有 <span className="text-blue-600 font-semibold">{relatedCompanies.length}</span> 家关联企业</p>
                </div>
                
                <div className="space-y-3 max-h-64 overflow-y-auto mb-6">
                  {relatedCompanies.map((company, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedCompanyIndex(index)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        selectedCompanyIndex === index 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-slate-200 hover:border-blue-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
                            selectedCompanyIndex === index ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {company.companyName.substring(0, 1)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{company.companyName}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`px-2 py-0.5 text-xs rounded-md ${
                                company.role === '法定代表人' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {company.role}
                              </span>
                              <span className="text-xs text-slate-400">{company.creditCode}</span>
                            </div>
                          </div>
                        </div>
                        {selectedCompanyIndex === index && (
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                
                {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
                
                <button
                  onClick={handleSelectCompany}
                  disabled={loading || selectedCompanyIndex === null}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/30"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>确认并进入</span><ArrowRight className="w-5 h-5" /></>}
                </button>
                
                <button
                  onClick={() => router.push('/user/bindcompany')}
                  className="w-full mt-3 py-3 text-slate-500 hover:text-slate-700 text-sm"
                >
                  + 绑定其他企业
                </button>
              </>
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



