import { fetch as tauriFetch } from '@tauri-apps/plugin-http';

const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;

const API_BASE_URL = 'http://localhost:3000';

export async function httpFetch(url: string, options: RequestInit = {}): Promise<Response> {
  if (!isTauri) {
    return fetch(url, options);
  }

  let fullUrl = url;
  
  if (url.startsWith('/api/')) {
    fullUrl = `${API_BASE_URL}${url}`;
  }
  
  const method = options.method || 'GET';
  const headers: Record<string, string> = {};
  
  if (options.headers) {
    const h = options.headers as Record<string, string>;
    for (const key in h) {
      headers[key] = h[key];
    }
  }
  
  if (options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await tauriFetch(fullUrl, {
      method,
      headers,
      body: options.body as string | undefined,
    });

    const text = await response.text();
    
    return new Response(text, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    console.error('[Tauri HTTP] Fetch error:', error);
    throw error;
  }
}

export function isRunningInTauri(): boolean {
  return isTauri;
}

let originalFetch: typeof fetch | null = null;

export function setupTauriFetch() {
  if (isTauri && !originalFetch) {
    originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      let url: string;
      if (typeof input === 'string') {
        url = input;
      } else if (input instanceof URL) {
        url = input.href;
      } else {
        url = (input as Request).url;
      }
      
      if (url.startsWith('/api/')) {
        console.log('[Tauri] Proxying API request:', url);
        return httpFetch(url, init || {});
      }
      
      return originalFetch!(input, init);
    };
    console.log('[Tauri] Fetch interceptor installed');
  }
}

export function restoreOriginalFetch() {
  if (originalFetch) {
    window.fetch = originalFetch;
    originalFetch = null;
  }
}
