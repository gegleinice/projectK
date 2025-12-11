'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, TrendingUp, Search, Receipt, Sparkles, Send, ArrowRight, BarChart3, Clock, DollarSign, X, RefreshCw, User, LogOut, ChevronDown, Building2, Settings, BadgeCheck, Check, MessageSquare, Edit3 } from 'lucide-react';
import { searchProducts, Product } from '@/lib/productCatalog';
import { getAllCustomers, CustomerInfo } from '@/lib/mockData';
import { getCurrentUser, logout, User as UserType, UserCompanyRelation } from '@/lib/auth';
import { bindCompany } from '@/lib/qixiangyun';
import {
  getCustomerHistory,
  getProductHistory,
  addCustomerToHistory,
  addProductToHistory,
  searchCustomerHistory,
  searchProductHistory,
  CustomerHistoryItem,
  ProductHistoryItem
} from '@/lib/invoiceHistory';

export default function Home() {
  const router = useRouter();
  const [showInvoiceInput, setShowInvoiceInput] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // 当前开票企业选择
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [switchingCompany, setSwitchingCompany] = useState(false);

  // 检查登录状态
  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  // 登出
  const handleLogout = () => {
    logout();
    setUser(null);
    setShowUserMenu(false);
  };
  
  // 输入模式：template（模板输入）或 freeform（自由输入）
  const [inputMode, setInputMode] = useState<'template' | 'freeform'>('template');
  
  // 槽位数据
  const [invoiceType, setInvoiceType] = useState<'普票' | '专票'>('普票');
  const [customerValue, setCustomerValue] = useState('');
  const [productValue, setProductValue] = useState('');
  const [amountValue, setAmountValue] = useState('');
  const [quantityValue, setQuantityValue] = useState('');
  const [unitPriceValue, setUnitPriceValue] = useState('');
  
  // 智能建议
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [productSuggestions, setProductSuggestions] = useState<Product[]>([]);
  const [customerSuggestions, setCustomerSuggestions] = useState<string[]>([]);
  // 历史记录
  const [customerHistory, setCustomerHistory] = useState<CustomerHistoryItem[]>([]);
  const [productHistory, setProductHistory] = useState<ProductHistoryItem[]>([]);
  // 该企业常用商品
  const [companyProducts, setCompanyProducts] = useState<ProductHistoryItem[]>([]);
  
  // 统计数据状态 - 从企业信息获取
  const [stats, setStats] = useState({
    monthlyCount: 127,
    monthlyAmount: 1856320,
    remainingQuota: 5000000
  });
  const [statsUpdateTime, setStatsUpdateTime] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 当用户变化时，更新统计数据
  useEffect(() => {
    if (user?.companyBound && user.company) {
      setStats({
        monthlyCount: 127, // 模拟数据
        monthlyAmount: 1856320,
        remainingQuota: user.company.invoiceQuota || 5000000
      });
    }
  }, [user]);
  
  // 格式化时间
  const formatUpdateTime = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  // 刷新统计数据
  const handleRefreshStats = () => {
    setIsRefreshing(true);
    // 模拟API请求延迟
    setTimeout(() => {
      // Mock: 随机增加一些数据模拟实时变化
      setStats(prev => ({
        monthlyCount: prev.monthlyCount + Math.floor(Math.random() * 3),
        monthlyAmount: prev.monthlyAmount + Math.floor(Math.random() * 50000),
        remainingQuota: Math.max(0, prev.remainingQuota - Math.floor(Math.random() * 50000))
      }));
      setStatsUpdateTime(new Date());
      setIsRefreshing(false);
    }, 800);
  };

  // 切换开票企业
  const handleSwitchCompany = async (company: UserCompanyRelation) => {
    if (!user) return;
    
    setSwitchingCompany(true);
    try {
      const result = await bindCompany(company.companyName);
      if (result.success && result.companyInfo) {
        const updatedUser: UserType = {
          ...user,
          companyBound: true,
          company: result.companyInfo
        };
        // 更新本地存储
        localStorage.setItem('ai_invoice_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        // 更新统计数据
        setStats({
          monthlyCount: Math.floor(Math.random() * 100) + 50,
          monthlyAmount: Math.floor(Math.random() * 2000000) + 500000,
          remainingQuota: result.companyInfo.invoiceQuota || 5000000
        });
        setStatsUpdateTime(new Date());
      }
    } catch (error) {
      console.error('切换企业失败', error);
    } finally {
      setSwitchingCompany(false);
      setShowCompanyDropdown(false);
    }
  };

  // Mock 数据：最近开票记录
  const recentInvoices = [
    { id: 1, customer: '腾讯', product: '软件服务', amount: 50000, quantity: 5, unitPrice: 10000, date: '2025-11-27' },
    { id: 2, customer: '华为', product: '硬件设备', amount: 26000, quantity: 2, unitPrice: 13000, date: '2025-11-26' },
    { id: 3, customer: '阿里巴巴', product: '云服务', amount: 88000, quantity: 12, unitPrice: 7333.33, date: '2025-11-25' }
  ];

  // 检查开票权限
  const checkInvoicePermission = (): boolean => {
    if (!user) {
      // 未登录，跳转登录页
      router.push('/login');
      return false;
    }
    if (!user.companyBound || !user.company) {
      // 未绑定企业，跳转绑定页
      router.push('/user/bindcompany');
      return false;
    }
    return true;
  };

  const features = [
    {
      id: 'invoice',
      title: '一键开票',
      description: '智能识别开票信息，自动补全客户资料，快速生成电子发票',
      icon: <FileText className="w-6 h-6" />,
      gradient: 'from-blue-600 to-cyan-500',
      available: true,
      action: () => {
        if (!checkInvoicePermission()) return;
        setShowInvoiceInput(true);
        setTimeout(() => {
          document.getElementById('invoice-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    },
    {
      id: 'tax',
      title: 'AI办税',
      description: '智能税务筹划，自动申报纳税，实时税务风险预警',
      icon: <TrendingUp className="w-6 h-6" />,
      gradient: 'from-emerald-600 to-teal-500',
      available: false
    },
    {
      id: 'audit',
      title: '智能审计',
      description: '自动审计账目，发现异常数据，生成审计报告',
      icon: <Search className="w-6 h-6" />,
      gradient: 'from-violet-600 to-purple-500',
      available: false
    },
    {
      id: 'reimbursement',
      title: '智能报销',
      description: 'OCR识别发票，自动填写报销单，快速审批流程',
      icon: <Receipt className="w-6 h-6" />,
      gradient: 'from-orange-600 to-amber-500',
      available: false
    }
  ];

  const handleFeatureClick = (feature: typeof features[0]) => {
    if (feature.available && feature.action) {
      feature.action();
    }
  };

  // 处理商品输入变化 - 支持历史记录
  const handleProductChange = (value: string) => {
    setProductValue(value);
    // 获取历史记录
    const history = value ? searchProductHistory(value) : getProductHistory();
    setProductHistory(history.slice(0, 3));
    
    // 获取搜索结果（排除已在历史中的）
    const historyIds = new Set(history.map(h => h.id));
    const results = searchProducts(value || '', 5).filter(p => !historyIds.has(p.id));
    setProductSuggestions(results);
    
    // 显示下拉（有历史或搜索结果）
    setShowProductSuggestions(history.length > 0 || results.length > 0);
  };
  
  // 处理商品输入聚焦 - 显示历史记录
  const handleProductFocus = () => {
    // 关闭客户下拉框
    setShowCustomerSuggestions(false);
    
    // 获取该客户的历史开票商品
    if (customerValue) {
      const customerProducts = recentInvoices
        .filter(inv => inv.customer.includes(customerValue) || customerValue.includes(inv.customer))
        .map(inv => ({
          id: `company-${inv.id}`,
          name: inv.product,
          category: '该客户常用',
          unitPrice: inv.unitPrice
        }));
      // 去重
      const uniqueProducts = customerProducts.filter((item, index, self) => 
        index === self.findIndex(p => p.name === item.name)
      );
      setCompanyProducts(uniqueProducts.slice(0, 3));
    } else {
      setCompanyProducts([]);
    }
    
    if (!productValue) {
      const history = getProductHistory();
      setProductHistory(history.slice(0, 3));
      const results = searchProducts('', 5);
      setProductSuggestions(results.slice(0, 5));
      setShowProductSuggestions(history.length > 0 || results.length > 0 || companyProducts.length > 0);
    } else {
      handleProductChange(productValue);
    }
  };

  // 处理客户输入变化 - 支持历史记录
  const handleCustomerChange = (value: string) => {
    setCustomerValue(value);
    // 获取历史记录
    const history = value ? searchCustomerHistory(value) : getCustomerHistory();
    setCustomerHistory(history.slice(0, 3));
    
    // 获取搜索结果（排除已在历史中的）
    const historyKeys = new Set(history.map(h => h.key));
    const allCustomers = getAllCustomers();
    const customerNames = Object.keys(allCustomers);
    const filtered = customerNames.filter(name => 
      !historyKeys.has(name) && name.toLowerCase().includes((value || '').toLowerCase())
    );
    const uniqueFiltered = Array.from(new Set(filtered)).slice(0, 5);
    setCustomerSuggestions(uniqueFiltered);
    
    // 显示下拉
    setShowCustomerSuggestions(history.length > 0 || uniqueFiltered.length > 0);
  };
  
  // 处理客户输入聚焦 - 显示历史记录
  const handleCustomerFocus = () => {
    // 关闭商品下拉框
    setShowProductSuggestions(false);
    
    if (!customerValue) {
      const history = getCustomerHistory();
      setCustomerHistory(history.slice(0, 3));
      const allCustomers = getAllCustomers();
      const customerNames = Object.keys(allCustomers).slice(0, 5);
      setCustomerSuggestions(customerNames);
      setShowCustomerSuggestions(history.length > 0 || customerNames.length > 0);
    } else {
      handleCustomerChange(customerValue);
    }
  };

  // 选择商品 - 添加到历史记录
  const handleSelectProduct = (product: Product) => {
    setProductValue(product.name);
    setUnitPriceValue(product.unitPrice.toString());
    setShowProductSuggestions(false);
    // 添加到历史记录
    addProductToHistory({
      id: product.id,
      name: product.name,
      category: product.category,
      unitPrice: product.unitPrice,
      unit: product.unit,
      taxRate: product.taxRate
    });
  };
  
  // 选择历史商品
  const handleSelectHistoryProduct = (item: ProductHistoryItem) => {
    setProductValue(item.name);
    setUnitPriceValue(item.unitPrice.toString());
    setShowProductSuggestions(false);
    // 更新历史记录顺序
    addProductToHistory(item);
  };

  // 选择客户 - 添加到历史记录
  const handleSelectCustomer = (customer: string) => {
    setCustomerValue(customer);
    setShowCustomerSuggestions(false);
    // 添加到历史记录
    const allCustomers = getAllCustomers();
    const customerData = allCustomers[customer];
    addCustomerToHistory({
      key: customer,
      name: customerData?.name || customer,
      taxNumber: customerData?.taxNumber
    });
  };
  
  // 选择历史客户
  const handleSelectHistoryCustomer = (item: CustomerHistoryItem) => {
    setCustomerValue(item.key);
    setShowCustomerSuggestions(false);
    // 更新历史记录顺序
    addCustomerToHistory(item);
  };

  // 清空所有字段
  const handleClear = () => {
    setInvoiceType('普票');
    setCustomerValue('');
    setProductValue('');
    setAmountValue('');
    setQuantityValue('');
    setUnitPriceValue('');
  };

  // 金额联动计算
  const calculateAmount = (qty: string, price: string): string => {
    const q = parseFloat(qty);
    const p = parseFloat(price);
    if (!isNaN(q) && !isNaN(p) && q > 0 && p > 0) {
      return (q * p).toFixed(2).replace(/\.00$/, '');
    }
    return '';
  };

  // 处理数量变化 - 自动计算金额
  const handleQuantityChange = (value: string) => {
    setQuantityValue(value);
    const calculated = calculateAmount(value, unitPriceValue);
    if (calculated) {
      setAmountValue(calculated);
    }
  };

  // 处理单价变化 - 自动计算金额
  const handleUnitPriceChange = (value: string) => {
    setUnitPriceValue(value);
    const calculated = calculateAmount(quantityValue, value);
    if (calculated) {
      setAmountValue(calculated);
    }
  };

  // 处理金额变化 - 如果有数量，自动计算单价
  const handleAmountChange = (value: string) => {
    setAmountValue(value);
    const amount = parseFloat(value);
    const qty = parseFloat(quantityValue);
    if (!isNaN(amount) && !isNaN(qty) && qty > 0 && amount > 0) {
      const price = (amount / qty).toFixed(2).replace(/\.00$/, '');
      setUnitPriceValue(price);
    }
  };

  // 填充历史记录
  const handleHistoryClick = (invoice: typeof recentInvoices[0]) => {
    setCustomerValue(invoice.customer);
    setProductValue(invoice.product);
    setAmountValue(invoice.amount.toString());
    setQuantityValue(invoice.quantity.toString());
    setUnitPriceValue(invoice.unitPrice.toString());
  };

  // 开始开票
  const handleStartInvoice = () => {
    const params = new URLSearchParams();
    params.set('invoiceType', invoiceType);
    if (customerValue) params.set('customer', customerValue);
    if (productValue) params.set('product', productValue);
    if (amountValue) params.set('amount', amountValue);
    if (quantityValue) params.set('quantity', quantityValue);
    if (unitPriceValue) params.set('unitPrice', unitPriceValue);
    
    router.push(`/invoice?${params.toString()}`);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('zh-CN').format(amount);
  };

  const canSubmit = customerValue || productValue || amountValue;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">AI财税助手</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                在线演示
              </span>
              
              {user ? (
                // 已登录：显示用户头像和下拉菜单
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                      {user.name.substring(0, 1)}
                    </div>
                    <span className="text-sm font-medium text-slate-700 hidden sm:block">{user.name}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* 下拉菜单 */}
                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                        {/* 用户信息 */}
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold">
                              {user.name.substring(0, 1)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{user.name}</p>
                              <p className="text-xs text-slate-500">{user.phone}</p>
                            </div>
                          </div>
                          {user.companyBound && user.company && (
                            <div className="mt-2 flex items-center space-x-1 text-xs text-emerald-600">
                              <BadgeCheck className="w-3 h-3" />
                              <span>{user.company.name}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* 菜单项 */}
                        <div className="py-2">
                          <button
                            onClick={() => { router.push('/user'); setShowUserMenu(false); }}
                            className="w-full flex items-center space-x-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                          >
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-700">用户中心</span>
                          </button>
                          {user.companyBound ? (
                            <button
                              onClick={() => { router.push('/user?tab=company'); setShowUserMenu(false); }}
                              className="w-full flex items-center space-x-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                            >
                              <Building2 className="w-4 h-4 text-slate-400" />
                              <span className="text-sm text-slate-700">企业信息</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => { router.push('/user/bindcompany'); setShowUserMenu(false); }}
                              className="w-full flex items-center space-x-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                            >
                              <Building2 className="w-4 h-4 text-blue-500" />
                              <span className="text-sm text-blue-600 font-medium">绑定企业</span>
                            </button>
                          )}
                          <button
                            onClick={() => { router.push('/user?tab=settings'); setShowUserMenu(false); }}
                            className="w-full flex items-center space-x-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                          >
                            <Settings className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-700">账号设置</span>
                          </button>
                        </div>
                        
                        {/* 退出登录 */}
                        <div className="border-t border-slate-100 py-2">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 px-4 py-2.5 text-left hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-red-600">退出登录</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                // 未登录：显示登录按钮
                <button
                  onClick={() => router.push('/login')}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-cyan-600 transition-all shadow-sm"
                >
                  <User className="w-4 h-4" />
                  <span>登录</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 pt-20 pb-12">
        <div className="text-center mb-16">
          <h2 className="text-6xl font-semibold text-slate-900 mb-5 tracking-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
            你好，我是你的
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              {' '}AI会计
            </span>
          </h2>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto font-normal" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
            智能开票 · 自动办税 · 快速审计
          </p>
        </div>

        {/* 输入框区域 */}
        {showInvoiceInput && (
          <div id="invoice-input" className="mb-12 animate-slideDown">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
              <div className="p-8">
                {/* 当前开票企业选择器 */}
                {user?.companyBound && user.company && (
                  <div className="mb-6">
                    <div className="relative">
                      <button
                        onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                        className="w-full flex items-center justify-between px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl hover:border-blue-300 transition-all group"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30">
                            {user.company.name.substring(0, 1)}
                          </div>
                          <div className="text-left">
                            <div className="text-xs text-slate-500 mb-0.5">当前开票企业</div>
                            <div className="text-base font-semibold text-slate-900">{user.company.name}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {user.relatedCompanies && user.relatedCompanies.length > 1 && (
                            <span className="text-xs text-slate-400 hidden sm:block">
                              共 {user.relatedCompanies.length} 家企业
                            </span>
                          )}
                          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showCompanyDropdown ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      
                      {/* 企业下拉选择 */}
                      {showCompanyDropdown && user.relatedCompanies && user.relatedCompanies.length > 0 && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowCompanyDropdown(false)} />
                          <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">选择开票企业</div>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                              {user.relatedCompanies.map((company, index) => {
                                const isCurrentCompany = company.companyName === user.company?.name;
                                return (
                                  <button
                                    key={index}
                                    onClick={() => !isCurrentCompany && handleSwitchCompany(company)}
                                    disabled={switchingCompany || isCurrentCompany}
                                    className={`w-full flex items-center justify-between px-4 py-4 transition-all ${
                                      isCurrentCompany 
                                        ? 'bg-blue-50 cursor-default' 
                                        : 'hover:bg-slate-50 cursor-pointer'
                                    } ${index !== user.relatedCompanies!.length - 1 ? 'border-b border-slate-100' : ''}`}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
                                        isCurrentCompany 
                                          ? 'bg-gradient-to-br from-blue-600 to-cyan-500' 
                                          : 'bg-slate-200 text-slate-600'
                                      }`}>
                                        {company.companyName.substring(0, 1)}
                                      </div>
                                      <div className="text-left">
                                        <div className="text-sm font-medium text-slate-900">{company.companyName}</div>
                                        <div className="flex items-center space-x-2 mt-0.5">
                                          <span className={`px-2 py-0.5 text-xs rounded-md ${
                                            company.role === '法定代表人' 
                                              ? 'bg-violet-100 text-violet-700' 
                                              : 'bg-slate-100 text-slate-600'
                                          }`}>
                                            {company.role}
                                          </span>
                                          <span className="text-xs text-slate-400">{company.creditCode}</span>
                                        </div>
                                      </div>
                                    </div>
                                    {isCurrentCompany && (
                                      <div className="flex items-center space-x-1 text-blue-600">
                                        <Check className="w-4 h-4" />
                                        <span className="text-xs font-medium">当前</span>
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                              <button
                                onClick={() => {
                                  setShowCompanyDropdown(false);
                                  router.push('/user/bindcompany');
                                }}
                                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                + 绑定其他企业
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* 统计信息 */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100 relative group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-600">本月已开票</span>
                      </div>
                      <button
                        onClick={handleRefreshStats}
                        disabled={isRefreshing}
                        className="p-1.5 rounded-lg bg-white/60 hover:bg-white text-blue-600 transition-all opacity-0 group-hover:opacity-100"
                        title="刷新数据"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{stats.monthlyCount}</div>
                    <div className="text-xs text-slate-500 mt-1">张发票</div>
                    <div className="absolute bottom-2 right-3 flex items-center space-x-1 text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Clock className="w-3 h-3" />
                      <span>{formatUpdateTime(statsUpdateTime)}</span>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100 relative group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">已开票金额</span>
                      </div>
                      <button
                        onClick={handleRefreshStats}
                        disabled={isRefreshing}
                        className="p-1.5 rounded-lg bg-white/60 hover:bg-white text-emerald-600 transition-all opacity-0 group-hover:opacity-100"
                        title="刷新数据"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">¥{formatAmount(stats.monthlyAmount)}</div>
                    <div className="text-xs text-slate-500 mt-1">本月累计</div>
                    <div className="absolute bottom-2 right-3 flex items-center space-x-1 text-[10px] text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Clock className="w-3 h-3" />
                      <span>{formatUpdateTime(statsUpdateTime)}</span>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-100 relative group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-violet-600" />
                      <span className="text-xs font-medium text-violet-600">剩余额度</span>
                      </div>
                      <button
                        onClick={handleRefreshStats}
                        disabled={isRefreshing}
                        className="p-1.5 rounded-lg bg-white/60 hover:bg-white text-violet-600 transition-all opacity-0 group-hover:opacity-100"
                        title="刷新数据"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">¥{formatAmount(stats.remainingQuota)}</div>
                    <div className="text-xs text-slate-500 mt-1">本月可用</div>
                    <div className="absolute bottom-2 right-3 flex items-center space-x-1 text-[10px] text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Clock className="w-3 h-3" />
                      <span>{formatUpdateTime(statsUpdateTime)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">智能开票</h3>
                      <p className="text-sm text-slate-500">描述您的开票需求，AI将自动识别并生成</p>
                    </div>
                  </div>
                  
                  {/* 输入模式切换 */}
                  <div className="flex bg-slate-100 rounded-xl p-1">
                    <button
                      onClick={() => setInputMode('template')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        inputMode === 'template'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>模板输入</span>
                    </button>
                    <button
                      onClick={() => setInputMode('freeform')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        inputMode === 'freeform'
                          ? 'bg-white text-violet-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>自由输入</span>
                    </button>
                  </div>
                </div>

                {/* 模板输入模式 */}
                {inputMode === 'template' && (
                  <>
                {/* 模板化输入框 - 参考图设计 */}
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mb-6">
                  <div className="flex flex-wrap items-center gap-3 text-lg leading-loose">
                    {/* 发票类型选择器 */}
                    <span className="text-blue-600 font-semibold">发票类型</span>
                    <div className="inline-flex bg-white rounded-xl p-1 shadow-sm border border-slate-200">
                      <button
                        onClick={() => setInvoiceType('普票')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          invoiceType === '普票'
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        普票
                      </button>
                      <button
                        onClick={() => setInvoiceType('专票')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          invoiceType === '专票'
                            ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-md'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        专票
                      </button>
                    </div>
                    
                    <span className="text-blue-600 font-semibold">请帮我开票：给</span>
                    
                    {/* 客户名称槽位 */}
                    <div className="relative">
                      <input
                        type="text"
                        value={customerValue}
                        onChange={(e) => handleCustomerChange(e.target.value)}
                        onFocus={handleCustomerFocus}
                        onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)}
                        placeholder="客户名称"
                        className="bg-white border-0 rounded-xl px-5 py-2 text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-400 transition-all min-w-[180px] text-center font-medium shadow-sm"
                      />
                      {/* 客户建议下拉 - 历史记录 + 搜索结果 */}
                      {showCustomerSuggestions && (customerHistory.length > 0 || customerSuggestions.length > 0) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto">
                          {/* 最近使用 */}
                          {customerHistory.length > 0 && (
                            <>
                              <div className="px-3 py-2 bg-amber-50 border-b border-amber-100">
                                <div className="flex items-center text-xs font-semibold text-amber-700">
                                  <Clock className="w-3 h-3 mr-1" />
                                  最近使用
                                </div>
                              </div>
                              {customerHistory.map((item) => (
                                <button
                                  key={`history-${item.key}`}
                                  onClick={() => handleSelectHistoryCustomer(item)}
                                  className="w-full px-4 py-2.5 text-left hover:bg-blue-50 text-sm font-medium text-slate-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                                >
                                  <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                  <span className="flex-shrink-0">{item.key}</span>
                                  <span className="text-xs text-slate-400 truncate">→ {item.name}</span>
                                </button>
                              ))}
                            </>
                          )}
                          {/* 搜索结果 */}
                          {customerSuggestions.length > 0 && (
                            <>
                              <div className="px-3 py-2 bg-blue-50 border-b border-blue-100">
                                <div className="flex items-center text-xs font-semibold text-blue-700">
                                  <Search className="w-3 h-3 mr-1" />
                                  客户匹配
                                </div>
                              </div>
                              {customerSuggestions.map((customer) => (
                                <button
                                  key={`search-${customer}`}
                                  onClick={() => handleSelectCustomer(customer)}
                                  className="w-full px-4 py-2.5 text-left hover:bg-blue-50 text-sm font-medium text-slate-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                                >
                                  <span className="flex-shrink-0">{customer}</span>
                                  <span className="text-xs text-slate-400 truncate">→ {getAllCustomers()[customer]?.name || customer}</span>
                                </button>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <span className="text-blue-600 font-semibold">开</span>
                    
                    {/* 商品类型槽位 */}
                    <div className="relative">
                      <input
                        type="text"
                        value={productValue}
                        onChange={(e) => handleProductChange(e.target.value)}
                        onFocus={handleProductFocus}
                        onBlur={() => setTimeout(() => setShowProductSuggestions(false), 200)}
                        placeholder="商品/服务类型"
                        className="bg-white border-0 rounded-xl px-5 py-2 text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-400 transition-all min-w-[200px] text-center font-medium shadow-sm"
                      />
                      {/* 商品建议下拉 - 企业常用 + 历史记录 + 搜索结果 */}
                      {showProductSuggestions && (companyProducts.length > 0 || productHistory.length > 0 || productSuggestions.length > 0) && (
                        <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden min-w-[300px] max-h-80 overflow-y-auto">
                          {/* 该客户常用商品 */}
                          {companyProducts.length > 0 && (
                            <>
                              <div className="px-3 py-2 bg-green-50 border-b border-green-100">
                                <div className="flex items-center text-xs font-semibold text-green-700">
                                  <Building2 className="w-3 h-3 mr-1" />
                                  {customerValue} 常用
                                </div>
                              </div>
                              {companyProducts.map((item) => (
                                <button
                                  key={`company-${item.id}`}
                                  onClick={() => handleSelectHistoryProduct(item)}
                                  className="w-full px-4 py-2.5 text-left hover:bg-green-50 transition-colors border-b border-slate-100"
                                >
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                      <Building2 className="w-3.5 h-3.5 text-green-500" />
                                      <div>
                                        <div className="text-sm font-medium text-slate-800">{item.name}</div>
                                        <div className="text-xs text-green-600">曾开过此商品</div>
                                      </div>
                                    </div>
                                    <div className="text-sm font-bold text-green-600">¥{item.unitPrice}</div>
                                  </div>
                                </button>
                              ))}
                            </>
                          )}
                          {/* 最近使用 */}
                          {productHistory.length > 0 && (
                            <>
                              <div className="px-3 py-2 bg-amber-50 border-b border-amber-100">
                                <div className="flex items-center text-xs font-semibold text-amber-700">
                                  <Clock className="w-3 h-3 mr-1" />
                                  最近使用
                                </div>
                              </div>
                              {productHistory.map((item) => (
                                <button
                                  key={`history-${item.id}`}
                                  onClick={() => handleSelectHistoryProduct(item)}
                                  className="w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors border-b border-slate-100"
                                >
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                                      <div>
                                        <div className="text-sm font-medium text-slate-800">{item.name}</div>
                                        <div className="text-xs text-slate-500">{item.category}</div>
                                      </div>
                                    </div>
                                    <div className="text-sm font-bold text-blue-600">¥{item.unitPrice}</div>
                                  </div>
                                </button>
                              ))}
                            </>
                          )}
                          {/* 搜索结果 */}
                          {productSuggestions.length > 0 && (
                            <>
                              <div className="px-3 py-2 bg-blue-50 border-b border-blue-100">
                                <div className="flex items-center text-xs font-semibold text-blue-700">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  商品匹配
                                </div>
                              </div>
                              {productSuggestions.map((product) => (
                                <button
                                  key={`search-${product.id}`}
                                  onClick={() => handleSelectProduct(product)}
                                  className="w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-0"
                                >
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <div className="text-sm font-medium text-slate-800">{product.name}</div>
                                      <div className="text-xs text-slate-500">{product.category} · {product.unit}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm font-bold text-blue-600">¥{product.unitPrice}</div>
                                      <div className="text-xs text-slate-400">税率{product.taxRate}%</div>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <span className="text-slate-500">，</span>
                    <span className="text-blue-600 font-semibold">金额</span>
                    
                    {/* 金额槽位 */}
                    <input
                      type="text"
                      value={amountValue}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      placeholder="金额"
                      className="bg-white border-0 rounded-xl px-4 py-2 text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-400 transition-all w-[120px] text-center font-medium shadow-sm"
                    />
                    <span className="text-slate-500">元，</span>
                    
                    <span className="text-blue-600 font-semibold">数量</span>
                    
                    {/* 数量槽位 */}
                    <input
                      type="text"
                      value={quantityValue}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      placeholder="数量"
                      className="bg-white border-0 rounded-xl px-4 py-2 text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-400 transition-all w-[100px] text-center font-medium shadow-sm"
                    />
                    <span className="text-slate-500">个，</span>
                    
                    <span className="text-blue-600 font-semibold">单价</span>
                    
                    {/* 单价槽位 */}
                    <input
                      type="text"
                      value={unitPriceValue}
                      onChange={(e) => handleUnitPriceChange(e.target.value)}
                      placeholder="单价"
                      className="bg-white border-0 rounded-xl px-4 py-2 text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-400 transition-all w-[120px] text-center font-medium shadow-sm"
                    />
                    <span className="text-slate-500">元/个</span>
                  </div>

                  {/* 操作栏 */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
                    <button
                      onClick={handleClear}
                      className="flex items-center space-x-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>清空</span>
                    </button>
                    <button
                      onClick={handleStartInvoice}
                      disabled={!canSubmit}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center space-x-2 shadow-lg hover:shadow-xl"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>智能开票</span>
                    </button>
                  </div>
                </div>

                {/* 快速示例 */}
                <div className="mb-6">
                  <div className="text-sm font-medium text-slate-700 mb-3">💡 快速示例</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setCustomerValue('腾讯');
                        setProductValue('软件服务');
                        setAmountValue('50000');
                        setQuantityValue('5');
                        setUnitPriceValue('10000');
                      }}
                      className="text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all border border-blue-100 hover:border-blue-200 group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold text-slate-900">服务类发票</div>
                        <ArrowRight className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-xs text-slate-600">腾讯 · 软件服务 · ¥50,000</div>
                    </button>
                    <button
                      onClick={() => {
                        setCustomerValue('华为');
                        setProductValue('硬件设备');
                        setAmountValue('26000');
                        setQuantityValue('2');
                        setUnitPriceValue('13000');
                      }}
                      className="text-left p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all border border-purple-100 hover:border-purple-200 group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold text-slate-900">货物类发票</div>
                        <ArrowRight className="w-4 h-4 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-xs text-slate-600">华为 · 硬件设备 · ¥26,000</div>
                    </button>
                  </div>
                </div>

                {/* 最近开票记录 */}
                <div className="mb-6 pt-6 border-t border-slate-100">
                  <div className="flex items-center space-x-2 mb-4">
                    <Clock className="w-4 h-4 text-slate-600" />
                    <div className="text-sm font-medium text-slate-700">最近开票记录</div>
                  </div>
                  <div className="space-y-2">
                    {recentInvoices.map((invoice) => (
                      <button
                        key={invoice.id}
                        onClick={() => handleHistoryClick(invoice)}
                        className="w-full text-left p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all border border-slate-200 hover:border-slate-300 group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                              {invoice.customer.substring(0, 2)}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{invoice.customer}</div>
                              <div className="text-xs text-slate-500">{invoice.date}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-slate-900">¥{formatAmount(invoice.amount)}</div>
                            <div className="text-xs text-slate-500">{invoice.product}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-slate-400">数量: {invoice.quantity} · 单价: ¥{formatAmount(invoice.unitPrice)}</div>
                          <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                  </>
                )}

                {/* 自由输入模式 */}
                {inputMode === 'freeform' && (
                  <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-8 border border-violet-200 mb-6">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/30">
                        <MessageSquare className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-slate-900 mb-2">自由描述开票需求</h4>
                      <p className="text-slate-600 max-w-md mx-auto">
                        用自然语言描述您的开票需求，AI将智能解析并提取开票信息
                      </p>
                    </div>
                    
                    <div className="bg-white rounded-xl p-6 border border-violet-100 mb-6">
                      <div className="text-sm font-medium text-slate-700 mb-3">💡 示例描述</div>
                      <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex items-start space-x-2">
                          <span className="text-violet-500">•</span>
                          <span>"给腾讯开5万的软件服务费"</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <span className="text-violet-500">•</span>
                          <span>"开一张专票给华为，云计算服务，10个月，每月8000元"</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <span className="text-violet-500">•</span>
                          <span>"阿里巴巴要开技术咨询费，共12万，税率6%"</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => router.push('/invoice?mode=freeform')}
                      className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-violet-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                    >
                      <Sparkles className="w-5 h-5" />
                      <span>开始自由输入</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {/* 收起按钮 */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setShowInvoiceInput(false)}
                    className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
                  >
                    收起
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Grid */}
        <div className="mb-16">
          <div className="flex items-center space-x-2 mb-6">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h3 className="text-2xl font-bold text-slate-900">核心功能</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((feature) => (
              <div
                key={feature.id}
                onClick={() => handleFeatureClick(feature)}
                className={`group relative bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-300 ${
                  feature.available ? 'cursor-pointer hover:border-slate-300' : 'cursor-not-allowed opacity-60'
                }`}
              >
                {!feature.available && (
                  <div className="absolute top-4 right-4 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
                    即将上线
                  </div>
                )}

                <div className="flex items-start space-x-4">
                  <div
                    className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center text-white shadow-lg ${
                      feature.available ? 'group-hover:scale-110' : ''
                    } transition-transform`}
                  >
                    {feature.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-slate-900 mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {feature.available && (
                    <ArrowRight className="flex-shrink-0 w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50/50 py-8 mt-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-sm text-slate-500">© 2025 AI财税助手 · 技术演示版本</p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </main>
  );
}
