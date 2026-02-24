import type { HistoryTemplate } from '@/types';

export async function fetchFeishuFields(
  template: HistoryTemplate,
  tableId: string,
  feishuAppId?: string,
  feishuAppSecret?: string
) {
  const requestBody: any = { 
    token: template.spreadsheetToken, 
    tableId 
  };
  
  if (feishuAppId && feishuAppSecret) {
    requestBody.appId = feishuAppId;
    requestBody.appSecret = feishuAppSecret;
  }

  const response = await fetch(`${window.location.origin}/api/feishu/fields`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  
  return response.json();
}

export async function addFieldToFeishu(
  template: HistoryTemplate,
  tableId: string,
  fieldName: string,
  fieldType: string,
  feishuAppId?: string,
  feishuAppSecret?: string
) {
  const requestBody: any = {
    token: template.spreadsheetToken,
    tableId,
    fieldName,
    fieldType
  };

  if (feishuAppId && feishuAppSecret) {
    requestBody.appId = feishuAppId;
    requestBody.appSecret = feishuAppSecret;
  }

  const response = await fetch(`${window.location.origin}/api/feishu/add-field`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  return {
    response,
    data: await response.json()
  };
}

export async function createFeishuTable(
  spreadsheetToken: string,
  tableName: string,
  feishuAppId?: string,
  feishuAppSecret?: string
) {
  const requestBody: any = {
    token: spreadsheetToken,
    tableName
  };

  if (feishuAppId && feishuAppSecret) {
    requestBody.appId = feishuAppId;
    requestBody.appSecret = feishuAppSecret;
  }

  const response = await fetch(`${window.location.origin}/api/feishu/create-table`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();
  return {
    response,
    data
  };
}
