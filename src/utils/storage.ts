import { FundStorageItem } from '../types';

const STORAGE_KEY = 'my_fund_list_v2'; // Changed key to ignore old data

/**
 * 获取存储的基金列表
 * Get stored fund list
 */
export const getStoredFunds = (): FundStorageItem[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

/**
 * 添加基金
 * Add a fund
 */
export const addFund = (item: FundStorageItem): void => {
  const funds = getStoredFunds();
  // Check if exists, if so update
  const index = funds.findIndex(f => f.code === item.code);
  if (index >= 0) {
    funds[index] = item;
  } else {
    funds.push(item);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(funds));
};

/**
 * 移除基金
 * Remove a fund
 */
export const removeFund = (code: string): void => {
  const funds = getStoredFunds();
  const newFunds = funds.filter(f => f.code !== code);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newFunds));
};
