import { invoke } from '@tauri-apps/api/core';

const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;

export async function tauriFetch(url: string, options: RequestInit = {}): Promise<Response> {
  if (!isTauri) {
    return fetch(url, options);
  }

  const method = options.method || 'GET';
  let body: string | null = null;
  
  if (options.body) {
    body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  try {
    const response = await invoke<string>('call_api', {
      url,
      method,
      body,
    });

    return new Response(response, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    throw new Error(`API call failed: ${error}`);
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
      return tauriFetch(url, init || {});
    };
  }
}

export function restoreOriginalFetch() {
  if (originalFetch) {
    window.fetch = originalFetch;
    originalFetch = null;
  }
}
