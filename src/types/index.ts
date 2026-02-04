export interface FundData {
  fundcode: string; // 基金代码
  name: string;     // 基金名称
  jzrq: string;     // 净值日期
  dwjz: string;     // 单位净值
  gsz: string;      // 估算值
  gszzl: string;    // 估算增长率 (percentage string)
  gztime: string;   // 估值时间
}

export interface FundItem extends Partial<FundData> {
  fundcode: string; // 必须有代码
  share?: number;   // 持有份额
  cost?: number;    // 持仓成本(金额)
  updateTime?: number; // Local update timestamp
  error?: string; // 错误信息
}

export interface FundStorageItem {
  code: string;
  share: number;
  cost?: number;
}
