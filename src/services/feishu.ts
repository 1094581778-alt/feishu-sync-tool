/**
 * 飞书 API 服务
 */

export interface FeishuApiConfig {
  appId?: string;
  appSecret?: string;
}

export interface FetchTablesParams {
  token: string;
  appId?: string;
  appSecret?: string;
}

export interface FetchFieldsParams {
  token: string;
  tableId: string;
  appId?: string;
  appSecret?: string;
}

export interface FetchRecordsParams {
  token: string;
  tableId: string;
  pageSize?: number;
  appId?: string;
  appSecret?: string;
}

/**
 * 获取飞书工作表列表
 */
export async function fetchTables(params: FetchTablesParams): Promise<{
  success: boolean;
  tables?: any[];
  error?: string;
}> {
  try {
    const { token, appId, appSecret } = params;
    const apiUrl = `${window.location.origin}/api/feishu/tables`;
    
    const requestBody: any = { token };
    if (appId && appSecret) {
      requestBody.appId = appId;
      requestBody.appSecret = appSecret;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取工作表列表失败',
    };
  }
}

/**
 * 获取工作表字段信息
 */
export async function fetchFields(params: FetchFieldsParams): Promise<{
  success: boolean;
  fields?: any[];
  error?: string;
}> {
  try {
    const { token, tableId, appId, appSecret } = params;
    const apiUrl = `${window.location.origin}/api/feishu/fields`;
    
    const requestBody: any = { token, tableId };
    if (appId && appSecret) {
      requestBody.appId = appId;
      requestBody.appSecret = appSecret;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取字段信息失败',
    };
  }
}

/**
 * 获取工作表记录
 */
export async function fetchRecords(params: FetchRecordsParams): Promise<{
  success: boolean;
  records?: any[];
  error?: string;
}> {
  try {
    const { token, tableId, pageSize = 10, appId, appSecret } = params;
    const apiUrl = `${window.location.origin}/api/feishu/records`;
    
    const requestBody: any = { token, tableId, pageSize };
    if (appId && appSecret) {
      requestBody.appId = appId;
      requestBody.appSecret = appSecret;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取记录失败',
    };
  }
}
