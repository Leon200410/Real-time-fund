import { searchFund, fetchFundData } from '../services/api';

export interface ParsedFundItem {
  key: string;
  rawLine: string;
  code?: string;
  name?: string;
  amount?: number; // 持有金额/市值
  share?: number; // 份额
  cost?: number; // 成本
  status: 'pending' | 'searching' | 'matched' | 'failed';
  error?: string;
}

/**
 * Smart Text Parser for Fund Import
 * 支持格式:
 * 1. 001186 1000 2.5 (代码 份额 成本)
 * 2. 001186 1000 (代码 份额)
 * 3. 支付宝复制文本 (名称 ... 金额 ... 收益)
 */
export const parseFundText = async (text: string): Promise<ParsedFundItem[]> => {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const results: ParsedFundItem[] = [];

  // Buffer for multiline detection (Alipay style) - DEPRECATED
  let nameBuffer: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Pattern 3: Simple CSV-like format (The only supported format now)
    // Code, Amount, Gain (comma or space separated)
    // Regex: 6 digits, then number, then number
    // Improved regex to handle optional plus sign and various spacing
    const simpleMatch = line.match(/^(\d{6})[,\s]+(-?[\d,]+\.?\d*)[,\s]+([+-]?[\d,]+\.?\d*)$/);
    if (simpleMatch) {
      const code = simpleMatch[1];
      const amount = parseFloat(simpleMatch[2].replace(/,/g, ''));
      const gainStr = simpleMatch[3].replace(/,/g, '');
      // Ensure we parse "+" correctly (parseFloat usually handles it but being explicit helps)
      const gain = parseFloat(gainStr);
      
      // Need to fetch net value to calculate share
      results.push({
        key: `simple-${i}`,
        rawLine: line,
        code,
        amount,
        cost: amount - gain,
        status: 'pending' // pending share calculation
      });
      continue;
    }
  }

  // Process 'pending' items (Search Code & Estimate Share)
  // Use Promise.all to process in parallel
  const processedResults = await Promise.all(results.map(async (item) => {
    if (item.status === 'pending') {
      const updatedItem = { ...item, status: 'searching' as const };
      try {
        let matchedCode = updatedItem.code;
        
        // 1. Search Code (if not already present)
        if (!matchedCode) {
            const searchRes = await searchFund(updatedItem.rawLine);
            if (searchRes && searchRes.length > 0) {
              const bestMatch = searchRes[0];
              matchedCode = bestMatch.CODE;
              updatedItem.name = bestMatch.NAME;
            }
        }
        
        if (matchedCode) {
            updatedItem.code = matchedCode;
            // 2. Estimate Share (Amount / Yesterday Net Value)
            if (updatedItem.amount) {
               const fundData = await fetchFundData(matchedCode);
               if (fundData && fundData.dwjz) {
                 updatedItem.share = parseFloat((updatedItem.amount / parseFloat(fundData.dwjz)).toFixed(2));
                 if (!updatedItem.name) updatedItem.name = fundData.name;
                 updatedItem.status = 'matched';
               } else {
                 updatedItem.error = '无法获取净值估算份额';
                 updatedItem.status = 'failed';
               }
            } else {
               // Only code provided?
               updatedItem.status = 'matched'; 
            }
        } else {
          updatedItem.error = '未找到匹配基金';
          updatedItem.status = 'failed';
        }
      } catch (e) {
        updatedItem.error = '搜索失败';
        updatedItem.status = 'failed';
      }
      return updatedItem;
    } else if (item.status === 'matched' && item.code && !item.name) {
       // Fetch name for manual code entry
       const fundData = await fetchFundData(item.code);
       if (fundData) {
         return { ...item, name: fundData.name };
       }
    }
    return item;
  }));

  return processedResults;
};
