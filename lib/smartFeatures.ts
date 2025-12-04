import { ParsedInvoice } from './invoiceParser';

// ===== 风险预警系统 =====

export interface RiskWarning {
  id: string;
  level: 'high' | 'medium' | 'low';
  type: 'amount' | 'frequency' | 'tax' | 'customer' | 'unusual';
  title: string;
  message: string;
  suggestion: string;
  timestamp: Date;
  relatedInvoice?: Partial<ParsedInvoice>;
}

/**
 * 检测发票风险
 */
export function detectInvoiceRisks(invoice: ParsedInvoice, history?: ParsedInvoice[]): RiskWarning[] {
  const risks: RiskWarning[] = [];

  // 1. 异常金额检测
  if (invoice.amount && invoice.amount > 100000) {
    risks.push({
      id: `risk_${Date.now()}_1`,
      level: 'high',
      type: 'amount',
      title: '⚠️ 大额开票提醒',
      message: `本次开票金额 ¥${invoice.amount.toLocaleString()} 超过10万元`,
      suggestion: '建议：核对客户信息、商品明细，确保金额准确无误。大额发票请留存相关合同和凭证。',
      timestamp: new Date(),
      relatedInvoice: invoice
    });
  } else if (invoice.amount && invoice.amount > 50000) {
    risks.push({
      id: `risk_${Date.now()}_1`,
      level: 'medium',
      type: 'amount',
      title: '💡 金额提醒',
      message: `本次开票金额 ¥${invoice.amount.toLocaleString()} 较大`,
      suggestion: '建议：仔细核对客户信息和商品明细，确保开票信息准确。',
      timestamp: new Date(),
      relatedInvoice: invoice
    });
  }

  // 2. 税率异常检测
  if (invoice.taxRate && invoice.category) {
    const expectedTaxRate = invoice.category === '现代服务' ? 6 : 13;
    if (invoice.taxRate !== expectedTaxRate) {
      risks.push({
        id: `risk_${Date.now()}_2`,
        level: 'high',
        type: 'tax',
        title: '🚨 税率异常',
        message: `${invoice.category}类商品税率应为${expectedTaxRate}%，当前为${invoice.taxRate}%`,
        suggestion: '建议：立即核实税率设置，错误税率可能导致税务问题。',
        timestamp: new Date(),
        relatedInvoice: invoice
      });
    }
  }

  // 3. 价格异常检测
  if (invoice.unitPrice && invoice.quantity) {
    const calculatedAmount = invoice.unitPrice * invoice.quantity;
    if (invoice.amount && Math.abs(calculatedAmount - invoice.amount) > 0.01) {
      risks.push({
        id: `risk_${Date.now()}_3`,
        level: 'medium',
        type: 'amount',
        title: '⚠️ 金额计算异常',
        message: `单价×数量=${calculatedAmount.toFixed(2)}，与填写金额${invoice.amount}不符`,
        suggestion: '建议：检查单价、数量、金额是否填写正确。',
        timestamp: new Date(),
        relatedInvoice: invoice
      });
    }
  }

  // 4. 客户信息缺失检测
  if (!invoice.customerInfo && invoice.amount && invoice.amount > 1000) {
    risks.push({
      id: `risk_${Date.now()}_4`,
      level: 'low',
      type: 'customer',
      title: '💼 客户信息提醒',
      message: '未能自动匹配客户详细信息',
      suggestion: '建议：补充完整的客户税号、地址、电话等信息，避免发票退回。',
      timestamp: new Date(),
      relatedInvoice: invoice
    });
  }

  // 5. 高频开票检测（如果有历史数据）
  if (history && history.length > 0) {
    const today = new Date();
    const todayInvoices = history.filter(h => {
      if (!h.invoiceDate) return false;
      const invoiceDate = new Date(h.invoiceDate);
      return invoiceDate.toDateString() === today.toDateString();
    });

    if (todayInvoices.length >= 10) {
      risks.push({
        id: `risk_${Date.now()}_5`,
        level: 'medium',
        type: 'frequency',
        title: '📊 高频开票提醒',
        message: `今日已开具${todayInvoices.length}张发票`,
        suggestion: '提示：高频开票请注意核对，避免重复开票或信息错误。',
        timestamp: new Date()
      });
    }

    // 检测重复开票
    const duplicate = history.find(h => 
      h.customerName === invoice.customerName &&
      h.productName === invoice.productName &&
      h.amount === invoice.amount &&
      h.invoiceDate && new Date(h.invoiceDate).toDateString() === today.toDateString()
    );

    if (duplicate) {
      risks.push({
        id: `risk_${Date.now()}_6`,
        level: 'high',
        type: 'unusual',
        title: '🚨 疑似重复开票',
        message: '检测到相同客户、相同商品、相同金额的发票记录',
        suggestion: '警告：请确认是否重复开票，重复开票可能导致严重税务问题！',
        timestamp: new Date(),
        relatedInvoice: invoice
      });
    }
  }

  return risks;
}

// ===== 智能推送系统 =====

export interface SmartRecommendation {
  id: string;
  type: 'template' | 'automation' | 'optimization' | 'promotion' | 'tip';
  priority: 'high' | 'medium' | 'low';
  title: string;
  content: string;
  action?: {
    label: string;
    data?: any;
  };
  icon?: string;
  timestamp: Date;
}

/**
 * 生成智能推荐
 */
export function generateSmartRecommendations(
  invoice: ParsedInvoice,
  history?: ParsedInvoice[]
): SmartRecommendation[] {
  const recommendations: SmartRecommendation[] = [];

  // 1. 常用客户推荐
  if (history && history.length > 0) {
    const customerFrequency: Record<string, number> = {};
    history.forEach(h => {
      if (h.customerName) {
        customerFrequency[h.customerName] = (customerFrequency[h.customerName] || 0) + 1;
      }
    });

    const frequentCustomers = Object.entries(customerFrequency)
      .filter(([_, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (frequentCustomers.length > 0) {
      recommendations.push({
        id: `rec_${Date.now()}_1`,
        type: 'template',
        priority: 'high',
        title: '🎯 常用客户快速开票',
        content: `您经常为 ${frequentCustomers.map(c => c[0]).join('、')} 开票，点击可快速填充信息`,
        action: {
          label: '查看模板',
          data: frequentCustomers.map(c => c[0])
        },
        icon: '📋',
        timestamp: new Date()
      });
    }
  }

  // 2. 批量开票推荐
  if (history && history.length >= 5) {
    const recentInvoices = history.slice(-5);
    const sameProduct = recentInvoices.every(h => h.productName === invoice.productName);
    
    if (sameProduct) {
      recommendations.push({
        id: `rec_${Date.now()}_2`,
        type: 'automation',
        priority: 'high',
        title: '⚡ 批量开票建议',
        content: '检测到您正在为相同商品开具多张发票，使用批量开票可提升效率',
        action: {
          label: '启用批量开票'
        },
        icon: '🚀',
        timestamp: new Date()
      });
    }
  }

  // 3. 月末提醒
  const today = new Date();
  const daysLeftInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate();
  
  if (daysLeftInMonth <= 3) {
    recommendations.push({
      id: `rec_${Date.now()}_3`,
      type: 'tip',
      priority: 'medium',
      title: '📅 月末开票提醒',
      content: `本月还剩${daysLeftInMonth}天，建议尽快处理待开票项，避免跨月处理`,
      icon: '⏰',
      timestamp: new Date()
    });
  }

  // 4. 优惠活动推送
  if (invoice.amount && invoice.amount > 50000) {
    recommendations.push({
      id: `rec_${Date.now()}_4`,
      type: 'promotion',
      priority: 'low',
      title: '🎁 VIP增值服务',
      content: '您的开票金额较大，可享受专属客户经理一对一服务和发票管理系统升级优惠',
      action: {
        label: '了解详情'
      },
      icon: '💎',
      timestamp: new Date()
    });
  }

  // 5. 智能分类建议
  if (invoice.productName && !invoice.category) {
    recommendations.push({
      id: `rec_${Date.now()}_5`,
      type: 'optimization',
      priority: 'medium',
      title: '🏷️ 商品分类建议',
      content: '为商品添加分类标签，可以更快地统计分析和税务申报',
      action: {
        label: '添加分类'
      },
      icon: '📊',
      timestamp: new Date()
    });
  }

  // 6. 电子发票推广
  if (Math.random() > 0.7) { // 30%概率显示
    recommendations.push({
      id: `rec_${Date.now()}_6`,
      type: 'promotion',
      priority: 'low',
      title: '🌱 绿色开票倡议',
      content: '使用电子发票，环保便捷，支持实时推送和永久存储',
      icon: '♻️',
      timestamp: new Date()
    });
  }

  // 7. 发票存根管理提醒
  if (history && history.length > 20) {
    recommendations.push({
      id: `rec_${Date.now()}_7`,
      type: 'tip',
      priority: 'low',
      title: '📦 发票存根管理',
      content: `您已开具${history.length}张发票，建议定期整理归档，可使用发票管理系统进行电子化管理`,
      action: {
        label: '查看管理工具'
      },
      icon: '🗄️',
      timestamp: new Date()
    });
  }

  return recommendations;
}

/**
 * 获取发票统计数据（用于推送决策）
 */
export function getInvoiceStatistics(history: ParsedInvoice[]) {
  if (!history || history.length === 0) {
    return {
      total: 0,
      totalAmount: 0,
      avgAmount: 0,
      topCustomers: [],
      topProducts: [],
      monthlyTrend: []
    };
  }

  const totalAmount = history.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const avgAmount = totalAmount / history.length;

  // 客户排名
  const customerStats: Record<string, { count: number; amount: number }> = {};
  history.forEach(inv => {
    if (inv.customerName) {
      if (!customerStats[inv.customerName]) {
        customerStats[inv.customerName] = { count: 0, amount: 0 };
      }
      customerStats[inv.customerName].count++;
      customerStats[inv.customerName].amount += inv.amount || 0;
    }
  });

  const topCustomers = Object.entries(customerStats)
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 5)
    .map(([name, stats]) => ({ name, ...stats }));

  // 商品排名
  const productStats: Record<string, { count: number; amount: number }> = {};
  history.forEach(inv => {
    const productName = inv.productName || inv.productType || '未知';
    if (!productStats[productName]) {
      productStats[productName] = { count: 0, amount: 0 };
    }
    productStats[productName].count++;
    productStats[productName].amount += inv.amount || 0;
  });

  const topProducts = Object.entries(productStats)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([name, stats]) => ({ name, ...stats }));

  return {
    total: history.length,
    totalAmount,
    avgAmount,
    topCustomers,
    topProducts
  };
}

