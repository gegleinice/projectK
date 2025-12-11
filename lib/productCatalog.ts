// 商品清单 - 参照 商品清单.xlsx
export interface Product {
  id: string;
  name: string;
  category: string;
  specification?: string;
  unit: string;
  unitPrice: number;
  taxRate: number;
  keywords: string[]; // 用于智能匹配的关键词
  description?: string;
}

// 完整商品目录
export const productCatalog: Product[] = [
  // === 软件服务类 ===
  {
    id: 'SW001',
    name: '软件开发服务',
    category: '现代服务',
    unit: '人天',
    unitPrice: 1200,
    taxRate: 6,
    keywords: ['软件', '开发', '编程', '代码', 'development', 'coding'],
    description: '提供专业软件开发服务'
  },
  {
    id: 'SW002',
    name: 'APP开发',
    category: '现代服务',
    unit: '项',
    unitPrice: 50000,
    taxRate: 6,
    keywords: ['app', '应用', '移动开发', 'ios', 'android', '手机应用'],
    description: '移动应用开发服务'
  },
  {
    id: 'SW003',
    name: '网站建设',
    category: '现代服务',
    unit: '项',
    unitPrice: 15000,
    taxRate: 6,
    keywords: ['网站', 'website', 'web', '官网', '建站', '网页'],
    description: '企业网站建设服务'
  },
  {
    id: 'SW004',
    name: '系统集成',
    category: '现代服务',
    unit: '项',
    unitPrice: 80000,
    taxRate: 6,
    keywords: ['系统', '集成', 'integration', '整合', '对接'],
    description: '系统集成与对接服务'
  },
  {
    id: 'SW005',
    name: '技术支持服务',
    category: '现代服务',
    unit: '月',
    unitPrice: 5000,
    taxRate: 6,
    keywords: ['技术支持', '运维', '维护', 'support', 'maintenance'],
    description: '技术支持与维护服务'
  },

  // === 云服务类 ===
  {
    id: 'CL001',
    name: '云服务器',
    category: '现代服务',
    specification: '4核8G',
    unit: '月',
    unitPrice: 500,
    taxRate: 6,
    keywords: ['云服务器', 'ecs', '服务器', 'server', '云主机'],
    description: '云计算服务器租赁'
  },
  {
    id: 'CL002',
    name: '云存储',
    category: '现代服务',
    specification: '1TB',
    unit: '月',
    unitPrice: 200,
    taxRate: 6,
    keywords: ['云存储', 'oss', '对象存储', 'storage', '存储'],
    description: '云对象存储服务'
  },
  {
    id: 'CL003',
    name: 'CDN加速',
    category: '现代服务',
    unit: 'GB',
    unitPrice: 0.2,
    taxRate: 6,
    keywords: ['cdn', '加速', '内容分发', 'acceleration'],
    description: 'CDN内容分发网络'
  },
  {
    id: 'CL004',
    name: '云数据库',
    category: '现代服务',
    specification: 'MySQL 8核16G',
    unit: '月',
    unitPrice: 800,
    taxRate: 6,
    keywords: ['数据库', 'database', 'rds', 'mysql', 'sql'],
    description: '云数据库服务'
  },
  {
    id: 'CL005',
    name: '负载均衡',
    category: '现代服务',
    unit: '月',
    unitPrice: 300,
    taxRate: 6,
    keywords: ['负载均衡', 'slb', 'load balancer', '均衡'],
    description: '负载均衡服务'
  },

  // === 咨询服务类 ===
  {
    id: 'CS001',
    name: '技术咨询',
    category: '现代服务',
    unit: '小时',
    unitPrice: 800,
    taxRate: 6,
    keywords: ['咨询', '顾问', 'consulting', '技术咨询'],
    description: '技术咨询服务'
  },
  {
    id: 'CS002',
    name: '项目管理咨询',
    category: '现代服务',
    unit: '天',
    unitPrice: 2000,
    taxRate: 6,
    keywords: ['项目管理', 'pm', '管理咨询', 'project'],
    description: '项目管理咨询服务'
  },
  {
    id: 'CS003',
    name: 'IT架构咨询',
    category: '现代服务',
    unit: '次',
    unitPrice: 10000,
    taxRate: 6,
    keywords: ['架构', 'architecture', 'it架构', '系统架构'],
    description: 'IT系统架构咨询'
  },

  // === 硬件设备类 ===
  {
    id: 'HW001',
    name: '服务器',
    category: '货物销售',
    specification: 'Dell PowerEdge R740',
    unit: '台',
    unitPrice: 35000,
    taxRate: 13,
    keywords: ['服务器', 'server', '物理机', '主机'],
    description: '企业级服务器'
  },
  {
    id: 'HW002',
    name: '笔记本电脑',
    category: '货物销售',
    specification: 'ThinkPad X1 Carbon',
    unit: '台',
    unitPrice: 12000,
    taxRate: 13,
    keywords: ['笔记本', 'laptop', '电脑', 'notebook'],
    description: '商务笔记本电脑'
  },
  {
    id: 'HW003',
    name: '台式电脑',
    category: '货物销售',
    specification: 'i7/16G/512G SSD',
    unit: '台',
    unitPrice: 6000,
    taxRate: 13,
    keywords: ['台式机', 'desktop', '台式电脑', '主机'],
    description: '办公台式电脑'
  },
  {
    id: 'HW004',
    name: '显示器',
    category: '货物销售',
    specification: '27英寸 4K',
    unit: '台',
    unitPrice: 2500,
    taxRate: 13,
    keywords: ['显示器', 'monitor', '屏幕', 'display'],
    description: '专业显示器'
  },
  {
    id: 'HW005',
    name: '路由器',
    category: '货物销售',
    specification: '企业级千兆',
    unit: '台',
    unitPrice: 1200,
    taxRate: 13,
    keywords: ['路由器', 'router', '网络设备'],
    description: '企业级路由器'
  },
  {
    id: 'HW006',
    name: '交换机',
    category: '货物销售',
    specification: '48口千兆',
    unit: '台',
    unitPrice: 3000,
    taxRate: 13,
    keywords: ['交换机', 'switch', '网络交换机'],
    description: '网络交换机'
  },

  // === 办公用品类 ===
  {
    id: 'OF001',
    name: '打印机',
    category: '货物销售',
    specification: 'HP LaserJet',
    unit: '台',
    unitPrice: 3500,
    taxRate: 13,
    keywords: ['打印机', 'printer', '激光打印', '打印'],
    description: '激光打印机'
  },
  {
    id: 'OF002',
    name: '办公桌',
    category: '货物销售',
    specification: '1.2m*0.6m',
    unit: '张',
    unitPrice: 800,
    taxRate: 13,
    keywords: ['办公桌', 'desk', '桌子', '工位'],
    description: '办公桌'
  },
  {
    id: 'OF003',
    name: '办公椅',
    category: '货物销售',
    specification: '人体工学',
    unit: '把',
    unitPrice: 600,
    taxRate: 13,
    keywords: ['办公椅', 'chair', '椅子', '座椅'],
    description: '人体工学办公椅'
  },

  // === 培训服务类 ===
  {
    id: 'TR001',
    name: '技术培训',
    category: '现代服务',
    unit: '天',
    unitPrice: 5000,
    taxRate: 6,
    keywords: ['培训', 'training', '教育', '学习', '课程'],
    description: '技术培训服务'
  },
  {
    id: 'TR002',
    name: '认证考试',
    category: '现代服务',
    unit: '次',
    unitPrice: 2000,
    taxRate: 6,
    keywords: ['认证', 'certification', '考试', '资格'],
    description: '技术认证考试'
  }
];

/**
 * 智能搜索商品
 * @param query 搜索关键词
 * @param limit 返回结果数量限制
 * @returns 匹配的商品列表
 */
export function searchProducts(query: string, limit: number = 5): Product[] {
  if (!query || query.trim().length === 0) return [];
  
  const searchTerm = query.toLowerCase().trim();
  const results: Array<{ product: Product; score: number }> = [];

  for (const product of productCatalog) {
    let score = 0;

    // 完全匹配商品名称
    if (product.name.toLowerCase() === searchTerm) {
      score += 100;
    }
    // 商品名称包含搜索词
    else if (product.name.toLowerCase().includes(searchTerm)) {
      score += 50;
    }

    // 关键词匹配
    for (const keyword of product.keywords) {
      if (keyword.toLowerCase() === searchTerm) {
        score += 80;
      } else if (keyword.toLowerCase().includes(searchTerm)) {
        score += 30;
      } else if (searchTerm.includes(keyword.toLowerCase())) {
        score += 20;
      }
    }

    // 类别匹配
    if (product.category.toLowerCase().includes(searchTerm)) {
      score += 10;
    }

    if (score > 0) {
      results.push({ product, score });
    }
  }

  // 按分数排序并返回
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(r => r.product);
}

/**
 * 根据商品ID获取商品信息
 */
export function getProductById(id: string): Product | undefined {
  return productCatalog.find(p => p.id === id);
}

/**
 * 获取商品分类列表
 */
export function getCategories(): string[] {
  return Array.from(new Set(productCatalog.map(p => p.category)));
}




