import { ParsedInvoice } from './invoiceParser';

// 风险预警类型
export interface RiskWarning {
  id: string;
  level: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  suggestion: string;
  category: 'tax' | 'amount' | 'customer' | 'product' | 'compliance';
}

// 智能推荐类型
export interface SmartRecommendation {
  id: string;
  type: 'template' | 'automation' | 'optimization' | 'promotion' | 'tip';
  title: string;
  content: string;
  icon?: string;
  priority: number;
  action?: {
    label: string;
    href?: string;
  };
}

// 检测发票风险
export function detectInvoiceRisks(invoice: ParsedInvoice): RiskWarning[] {
  const risks: RiskWarning[] = [];
  
  // 1. 大额发票预警
  if (invoice.amount && invoice.amount >= 100000) {
    risks.push({
      id: 'risk-large-amount',
      level: invoice.amount >= 500000 ? 'high' : 'medium',
      title: '大额发票提醒',
      message: `本次开票金额 ¥${invoice.amount.toLocaleString()} 元，${invoice.amount >= 500000 ? '已超过50万限额' : '接近大额监控标准'}`,
      suggestion: '建议核实业务真实性，确保合同、付款凭证等备齐',
      category: 'amount'
    });
  }

  // 2. 税率异常预警
  if (invoice.taxRate !== null && invoice.taxRate !== undefined) {
    const expectedRates = [0, 1, 3, 6, 9, 13];
    if (!expectedRates.includes(invoice.taxRate)) {
      risks.push({
        id: 'risk-tax-rate',
        level: 'high',
        title: '税率异常',
        message: `当前税率 ${invoice.taxRate}% 不在常规税率范围内`,
        suggestion: '请确认税率是否正确，常见税率为：0%、1%、3%、6%、9%、13%',
        category: 'tax'
      });
    }
    
    // 零税率提醒
    if (invoice.taxRate === 0 && invoice.amount && invoice.amount > 10000) {
      risks.push({
        id: 'risk-zero-tax',
        level: 'medium',
        title: '零税率使用提醒',
        message: '本次使用零税率开票，请确保符合免税条件',
        suggestion: '零税率适用于出口货物、特定服务等，请核实业务类型',
        category: 'tax'
      });
    }
  }

  // 3. 客户信息缺失预警
  if (!invoice.customerInfo?.taxNumber && invoice.customerName) {
    risks.push({
      id: 'risk-no-tax-number',
      level: 'low',
      title: '税号信息缺失',
      message: '客户税号未填写，可能影响对方抵扣',
      suggestion: '建议补充客户统一社会信用代码/税号',
      category: 'customer'
    });
  }

  // 4. 商品类目风险
  const sensitiveProducts = ['咨询服务', '技术服务', '设计服务', '广告服务'];
  if (invoice.productName && sensitiveProducts.some(p => invoice.productName?.includes(p))) {
    if (invoice.amount && invoice.amount >= 50000) {
      risks.push({
        id: 'risk-sensitive-product',
        level: 'medium',
        title: '服务类发票提醒',
        message: '服务类发票较易被税务关注，建议留存服务合同',
        suggestion: '请确保有服务合同、工作成果等证明材料',
        category: 'product'
      });
    }
  }

  // 5. 单价异常预警
  if (invoice.unitPrice && invoice.quantity) {
    if (invoice.unitPrice > 50000) {
      risks.push({
        id: 'risk-high-unit-price',
        level: 'low',
        title: '单价较高提醒',
        message: `单价 ¥${invoice.unitPrice.toLocaleString()} 元，建议核对是否正确`,
        suggestion: '高单价商品请确保定价依据充分',
        category: 'amount'
      });
    }
  }

  // 6. 首次客户预警
  if (invoice.customerName && !invoice.customerInfo) {
    risks.push({
      id: 'risk-new-customer',
      level: 'low',
      title: '新客户开票',
      message: '该客户为首次开票，请核实客户信息',
      suggestion: '建议收集客户的营业执照、开票信息等资料',
      category: 'customer'
    });
  }

  // 7. 连续开票预警（模拟）
  const hour = new Date().getHours();
  if (hour >= 22 || hour <= 6) {
    risks.push({
      id: 'risk-off-hours',
      level: 'low',
      title: '非工作时间开票',
      message: '当前为非工作时间，请确认是否立即开票',
      suggestion: '建议在工作时间内完成开票操作',
      category: 'compliance'
    });
  }

  return risks.sort((a, b) => {
    const levelOrder = { high: 0, medium: 1, low: 2 };
    return levelOrder[a.level] - levelOrder[b.level];
  });
}

// 生成智能推荐
export function generateSmartRecommendations(invoice: ParsedInvoice): SmartRecommendation[] {
  const recommendations: SmartRecommendation[] = [];
  
  // 1. 模板推荐
  if (invoice.customerName) {
    recommendations.push({
      id: 'rec-save-template',
      type: 'template',
      title: '保存为常用模板',
      content: `将「${invoice.customerName}」的开票信息保存为模板，下次开票一键填充`,
      icon: '📋',
      priority: 1,
      action: {
        label: '立即保存'
      }
    });
  }

  // 2. 批量开票推荐
  if (invoice.quantity && invoice.quantity >= 3) {
    recommendations.push({
      id: 'rec-batch-invoice',
      type: 'automation',
      title: '试试批量开票',
      content: '检测到您有多项商品，使用批量开票功能可提升效率',
      icon: '⚡',
      priority: 2,
      action: {
        label: '了解更多'
      }
    });
  }

  // 3. 税收优惠提醒
  if (invoice.productType === '技术服务' || invoice.productName?.includes('软件')) {
    recommendations.push({
      id: 'rec-tax-benefit',
      type: 'tip',
      title: '软件产品税收优惠',
      content: '符合条件的软件产品可享受即征即退政策，实际税负降至3%',
      icon: '💰',
      priority: 1,
      action: {
        label: '查看政策详情'
      }
    });
  }

  // 4. 电子发票推广
  recommendations.push({
    id: 'rec-digital-invoice',
    type: 'promotion',
    title: '推荐使用全电发票',
    content: '全电发票更环保、更便捷，开票成功率更高，归档管理更轻松',
    icon: '🌿',
    priority: 3,
    action: {
      label: '立即开通'
    }
  });

  // 5. 月度开票分析
  const day = new Date().getDate();
  if (day >= 25) {
    recommendations.push({
      id: 'rec-monthly-summary',
      type: 'optimization',
      title: '月末开票提醒',
      content: '临近月底，建议尽快完成本月开票，避免跨月账务处理',
      icon: '📊',
      priority: 1,
      action: {
        label: '查看本月汇总'
      }
    });
  }

  // 6. 智能归档建议
  if (invoice.amount && invoice.amount >= 10000) {
    recommendations.push({
      id: 'rec-archive',
      type: 'tip',
      title: '智能归档已就绪',
      content: '本张发票将自动归档至「大额发票」分类，方便后续查询',
      icon: '📁',
      priority: 4
    });
  }

  // 7. 限时活动（模拟）
  if (Math.random() > 0.5) {
    recommendations.push({
      id: 'rec-promotion',
      type: 'promotion',
      title: '🎁 限时福利',
      content: '本周开通年度会员享8折优惠，解锁无限批量开票功能',
      icon: '🎉',
      priority: 5,
      action: {
        label: '立即抢购'
      }
    });
  }

  // 8. 智能记账联动
  if (invoice.totalAmount && invoice.totalAmount >= 5000) {
    recommendations.push({
      id: 'rec-accounting',
      type: 'automation',
      title: '一键同步记账',
      content: '开票成功后可自动生成记账凭证，账务处理更高效',
      icon: '🔗',
      priority: 2,
      action: {
        label: '开启同步'
      }
    });
  }

  return recommendations.sort((a, b) => a.priority - b.priority);
}

// 获取实时活动推送
export function getLiveNotifications(): SmartRecommendation[] {
  return [
    {
      id: 'live-1',
      type: 'promotion',
      title: '🔥 新功能上线',
      content: 'AI智能识别准确率提升至99%，开票更精准',
      icon: '🚀',
      priority: 1
    },
    {
      id: 'live-2',
      type: 'tip',
      title: '📢 政策更新',
      content: '2024年小规模纳税人增值税优惠政策延续，详情点击查看',
      icon: '📋',
      priority: 2,
      action: {
        label: '查看详情'
      }
    }
  ];
}
