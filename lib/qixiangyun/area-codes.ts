/**
 * 企享云地区代码映射
 * 用于将用户选择的省份/城市转换为API请求所需的地区编码
 * 参考文档: https://openapi.qixiangyun.com/doc-2246773
 */

export interface AreaOption {
  label: string;   // 显示名称
  value: string;   // 地区编码（原始格式）
  pinyin?: string; // 拼音首字母（用于搜索）
  isCity?: boolean; // 是否为特殊城市（计划单列市）
}

/**
 * 全国省市地区代码
 * 包含省份和计划单列市（大连、宁波、厦门、青岛、深圳）
 */
export const AREA_CODES: AreaOption[] = [
  // 直辖市
  { label: '北京市', value: '11', pinyin: 'bj' },
  { label: '天津市', value: '12', pinyin: 'tj' },
  { label: '上海市', value: '31', pinyin: 'sh' },
  { label: '重庆市', value: '50', pinyin: 'cq' },
  
  // 华北地区
  { label: '河北省', value: '13', pinyin: 'hb' },
  { label: '山西省', value: '14', pinyin: 'sx' },
  { label: '内蒙古', value: '15', pinyin: 'nmg' },
  
  // 东北地区
  { label: '辽宁省', value: '21', pinyin: 'ln' },
  { label: '大连市', value: '2102', pinyin: 'dl', isCity: true },
  { label: '吉林省', value: '22', pinyin: 'jl' },
  { label: '黑龙江省', value: '23', pinyin: 'hlj' },
  
  // 华东地区
  { label: '江苏省', value: '32', pinyin: 'js' },
  { label: '浙江省', value: '33', pinyin: 'zj' },
  { label: '宁波市', value: '3302', pinyin: 'nb', isCity: true },
  { label: '安徽省', value: '34', pinyin: 'ah' },
  { label: '福建省', value: '35', pinyin: 'fj' },
  { label: '厦门市', value: '3502', pinyin: 'xm', isCity: true },
  { label: '江西省', value: '36', pinyin: 'jx' },
  { label: '山东省', value: '37', pinyin: 'sd' },
  { label: '青岛市', value: '3702', pinyin: 'qd', isCity: true },
  
  // 中部地区
  { label: '河南省', value: '41', pinyin: 'hen' },
  { label: '湖北省', value: '42', pinyin: 'hub' },
  { label: '湖南省', value: '43', pinyin: 'hun' },
  
  // 华南地区
  { label: '广东省', value: '44', pinyin: 'gd' },
  { label: '深圳市', value: '4403', pinyin: 'sz', isCity: true },
  { label: '广西', value: '45', pinyin: 'gx' },
  { label: '海南省', value: '46', pinyin: 'hain' },
  
  // 西南地区
  { label: '四川省', value: '51', pinyin: 'sc' },
  { label: '贵州省', value: '52', pinyin: 'gz' },
  { label: '云南省', value: '53', pinyin: 'yn' },
  { label: '西藏', value: '54', pinyin: 'xz' },
  
  // 西北地区
  { label: '陕西省', value: '61', pinyin: 'shanx' },
  { label: '甘肃省', value: '62', pinyin: 'gs' },
  { label: '青海省', value: '63', pinyin: 'qh' },
  { label: '宁夏', value: '64', pinyin: 'nx' },
  { label: '新疆', value: '65', pinyin: 'xj' },
];

/**
 * 格式化地区代码为4位
 * 不足4位在后面补0
 * 例如: "44" -> "4400", "4403" -> "4403"
 */
export function formatAreaCode(code: string): string {
  return code.padEnd(4, '0');
}

/**
 * 根据地区名称获取地区代码（已格式化为4位）
 */
export function getAreaCodeByName(name: string): string | undefined {
  const area = AREA_CODES.find(a => 
    a.label === name || 
    a.label.includes(name) || 
    name.includes(a.label.replace(/省|市|自治区|壮族|回族|维吾尔/g, ''))
  );
  return area ? formatAreaCode(area.value) : undefined;
}

/**
 * 根据地区代码获取地区名称
 */
export function getAreaNameByCode(code: string): string | undefined {
  // 支持查找原始代码或格式化后的代码
  const area = AREA_CODES.find(a => 
    a.value === code || 
    formatAreaCode(a.value) === code
  );
  return area?.label;
}

/**
 * 获取原始地区代码（用于显示）
 */
export function getRawAreaCode(name: string): string | undefined {
  const area = AREA_CODES.find(a => a.label === name);
  return area?.value;
}

/**
 * 默认地区代码（广东省，格式化后）
 */
export const DEFAULT_AREA_CODE = '4400';

/**
 * 默认地区代码（原始格式）
 */
export const DEFAULT_AREA_CODE_RAW = '44';
