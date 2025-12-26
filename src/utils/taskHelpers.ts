import statusMockData from '../mock/status.json';
import priorityMockData from '../mock/priority.json';

// Status数据类型定义
export interface StatusOption {
  id: string;
  name: string;
  color: string;
}

// Priority数据类型定义
export interface PriorityOption {
  id: string;
  name: string;
  color: string;
}

// 从mock数据获取Status选项
export const getStatusOptions = (): StatusOption[] => {
  return statusMockData.map((item: any) => ({
    id: item.id,
    name: item.name,
    color: item.color
  }));
};

// 从mock数据获取Priority选项
export const getPriorityOptions = (): PriorityOption[] => {
  return priorityMockData.map((item: any) => ({
    id: item.id,
    name: item.name,
    color: item.color
  }));
};

// 根据ID获取Status名称
export const getStatusNameById = (id: string): string => {
  const status = statusMockData.find((item: any) => item.id === id);
  return status?.name || id;
};

// 根据ID获取Priority名称
export const getPriorityNameById = (id: string): string => {
  const priority = priorityMockData.find((item: any) => item.id === id);
  return priority?.name || id;
};

// 根据ID获取Status颜色
export const getStatusColorById = (id: string): string => {
  const status = statusMockData.find((item: any) => item.id === id);
  return status?.color || '#666666';
};

// 根据ID获取Priority颜色
export const getPriorityColorById = (id: string): string => {
  const priority = priorityMockData.find((item: any) => item.id === id);
  return priority?.color || '#666666';
};