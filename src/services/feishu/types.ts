/**
 * 飞书API类型定义
 * 提供完整的飞书多维表格API类型支持
 */

/**
 * 飞书应用配置
 */
export interface AppConfig {
  appId: string;
  appSecret: string;
}

/**
 * 请求配置选项
 */
export interface RequestOptions {
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

/**
 * 飞书表格基础信息
 */
export interface FeishuTable {
  id: string;
  name: string;
  revision: number;
  createdTime: string;
  modifiedTime?: string;
  creator?: FeishuUser;
  modifier?: FeishuUser;
}

/**
 * 飞书字段定义
 */
export interface FeishuField {
  id: string;
  field_name: string;
  name?: string;
  type: number;
  property: Record<string, any>;
  description?: string;
  isPrimary?: boolean;
  disabled?: boolean;
  createdTime?: string;
  modifiedTime?: string;
}

/**
 * 飞书记录数据
 */
export interface FeishuRecord {
  id: string;
  fields: Record<string, any>;
  createdTime?: string;
  modifiedTime?: string;
  createdUser?: FeishuUser;
  modifiedUser?: FeishuUser;
}

/**
 * 飞书用户信息
 */
export interface FeishuUser {
  id: string;
  name?: string;
  enName?: string;
  email?: string;
  avatarUrl?: string;
}

/**
 * 飞书API通用响应格式
 */
export interface FeishuApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

/**
 * 飞书表格列表响应
 */
export interface FeishuTablesResponse {
  items: FeishuTable[];
  hasMore: boolean;
  pageToken?: string;
  total?: number;
}

/**
 * 飞书字段列表响应
 */
export interface FeishuFieldsResponse {
  items: FeishuField[];
  hasMore: boolean;
  pageToken?: string;
  total?: number;
}

/**
 * 飞书记录列表响应
 */
export interface FeishuRecordsResponse {
  items: FeishuRecord[];
  hasMore: boolean;
  pageToken?: string;
  total?: number;
}

/**
 * 批量创建记录请求
 */
export interface BatchCreateRecordsRequest {
  records: Array<{
    fields: Record<string, any>;
  }>;
}

/**
 * 批量创建记录响应
 */
export interface BatchCreateRecordsResponse {
  records: FeishuRecord[];
  errors?: Array<{
    recordIndex: number;
    error: string;
  }>;
}

/**
 * 创建表格请求
 */
export interface CreateTableRequest {
  name: string;
  default_view?: {
    type: 'grid' | 'form' | 'kanban' | 'gallery';
    name?: string;
  };
}

/**
 * 创建字段请求
 */
export interface CreateFieldRequest {
  field_name: string;
  type: number;
  property?: Record<string, any>;
  description?: string;
}

/**
 * 查询记录选项
 */
export interface RecordQueryOptions {
  pageSize?: number;
  pageToken?: string;
  filter?: string;
  sort?: string;
  fieldNames?: string[];
}

/**
 * 字段类型枚举
 */
export enum FieldType {
  TEXT = 1,
  NUMBER = 2,
  SINGLE_SELECT = 3,
  MULTI_SELECT = 4,
  DATE = 5,
  CHECKBOX = 7,
  PERSON = 11,
  GROUP = 12,
  PHONE = 13,
  EMAIL = 14,
  URL = 15,
  CURRENCY = 16,
  PERCENT = 17,
  RATING = 18,
  DATETIME = 19,
  USER = 20,
  ATTACHMENT = 22,
  LOOKUP = 23,
  FORMULA = 24,
  RELATION = 25,
  ONE_WAY_LINK = 26,
  LOCATION = 27,
  CREATED_TIME = 28,
  MODIFIED_TIME = 29,
  CREATED_USER = 30,
  MODIFIED_USER = 31,
  AUTO_NUMBER = 32,
  PROGRESS = 33,
  DEPARTMENT = 34,
}

/**
 * 字段类型映射
 */
export const FIELD_TYPE_MAP: Record<string, FieldType> = {
  text: FieldType.TEXT,
  number: FieldType.NUMBER,
  singleSelect: FieldType.SINGLE_SELECT,
  multiSelect: FieldType.MULTI_SELECT,
  date: FieldType.DATE,
  checkbox: FieldType.CHECKBOX,
  person: FieldType.PERSON,
  group: FieldType.GROUP,
  phone: FieldType.PHONE,
  email: FieldType.EMAIL,
  url: FieldType.URL,
  currency: FieldType.CURRENCY,
  percent: FieldType.PERCENT,
  rating: FieldType.RATING,
  datetime: FieldType.DATETIME,
  user: FieldType.USER,
  attachment: FieldType.ATTACHMENT,
  lookup: FieldType.LOOKUP,
  formula: FieldType.FORMULA,
  relation: FieldType.RELATION,
  oneWayLink: FieldType.ONE_WAY_LINK,
  location: FieldType.LOCATION,
  createdTime: FieldType.CREATED_TIME,
  modifiedTime: FieldType.MODIFIED_TIME,
  createdUser: FieldType.CREATED_USER,
  modifiedUser: FieldType.MODIFIED_USER,
  autoNumber: FieldType.AUTO_NUMBER,
  progress: FieldType.PROGRESS,
  department: FieldType.DEPARTMENT,
};

/**
 * 字段类型反向映射
 */
export const REVERSE_FIELD_TYPE_MAP: Record<number, string> = Object.entries(FIELD_TYPE_MAP).reduce(
  (acc, [key, value]) => {
    acc[value] = key;
    return acc;
  },
  {} as Record<number, string>
);

/**
 * 转换字段类型名称到数字类型
 */
export function convertFieldType(fieldType: string | number): number {
  if (typeof fieldType === 'number') {
    return fieldType;
  }
  
  const normalizedType = fieldType.toLowerCase();
  return FIELD_TYPE_MAP[normalizedType] || FieldType.TEXT;
}

/**
 * 获取字段类型名称
 */
export function getFieldTypeName(fieldType: number): string {
  return REVERSE_FIELD_TYPE_MAP[fieldType] || 'unknown';
}