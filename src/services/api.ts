import axios from "axios";
import { FundItem } from "../types";

/**
 * Fetch fund valuation data
 * 获取基金估值数据
 * @param code Fund code (e.g., "001186")
 */
export const fetchFundData = async (code: string): Promise<FundItem> => {
  const timestamp = Date.now();
  try {
    // Use the proxy path configured in vite.config.ts
    // /api/fund -> http://fundgz.1234567.com.cn/js
    const response = await axios.get(`/api/fund/${code}.js?rt=${timestamp}`);

    const data = response.data;
    // console.log(`Response for ${code}:`, data); // Debug log

    if (typeof data === "string") {
      // Parse JSONP response: jsonpgz({...});
      // Try more flexible regex
      const match = data.match(/jsonpgz\s*\((.*)\)/);
      if (match) {
        if (!match[1] || match[1].trim() === "") {
          return { fundcode: code, error: "未找到该基金或暂无数据" };
        }
        try {
          const parsed = JSON.parse(match[1]);
          return { ...parsed, fundcode: code }; // Ensure fundcode is present
        } catch (e) {
          console.error(`JSON parse error for ${code}:`, e);
          return { fundcode: code, error: "数据解析失败" };
        }
      }
    }

    // Check if it's empty or invalid format
    return { fundcode: code, error: "暂无估值数据" };
  } catch (error) {
    console.error(`Error fetching data for fund ${code}:`, error);
    return { fundcode: code, error: "请求失败" };
  }
};

interface SearchResult {
  CODE: string;
  NAME: string;
  CATEGORYDESC: string;
}

/**
 * Search fund by keyword
 * @param keyword Fund code or name
 */
export const searchFund = async (keyword: string): Promise<SearchResult[]> => {
  try {
    // /api/search -> https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx
    const response = await axios.get(
      `/api/search?m=1&key=${encodeURIComponent(keyword)}`,
    );
    const data = response.data;
    if (data && data.Datas) {
      return data.Datas as SearchResult[];
    }
    return [];
  } catch (error) {
    console.error("Search failed", error);
    return [];
  }
};
