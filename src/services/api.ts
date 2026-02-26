import { invoke } from '@tauri-apps/api/core';

const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;

export interface ApiRequest {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
}

export async function callApi(request: ApiRequest): Promise<any> {
  const { url, method = 'GET', body } = request;
  
  if (isTauri) {
    try {
      const response = await invoke<string>('call_api', {
        url,
        method,
        body: body ? JSON.stringify(body) : null,
      });
      return JSON.parse(response);
    } catch (error) {
      console.error('Tauri API call failed:', error);
      throw error;
    }
  } else {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    return response.json();
  }
}
