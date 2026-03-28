interface HAConfig {
  url: string;
  token: string | null;
}

declare global {
  interface Window {
    HA_CONFIG?: {
      url: string;
      token?: string;
      supervisorToken?: string;
      useIngress?: boolean;
      useProxy?: boolean;
    };
  }
}

export function getHAConfig({ useProxy = false }: { useProxy?: boolean } = {}): HAConfig {
  if (typeof window === 'undefined') {
    return { url: '', token: null };
  }

  if (window.HA_CONFIG?.url) {
    const token = window.HA_CONFIG.token || window.HA_CONFIG.supervisorToken || null;

    if (window.location.protocol === 'https:') {
      return { url: useProxy ? '' : window.location.origin, token };
    }

    if (useProxy && window.HA_CONFIG.useProxy) {
      return { url: '', token };
    }

    return { url: window.HA_CONFIG.url, token };
  }

  // Development: use env vars
  const envUrl = process.env.NEXT_PUBLIC_HA_URL;
  if (envUrl) {
    return { url: envUrl, token: process.env.NEXT_PUBLIC_HA_TOKEN || null };
  }

  return { url: 'http://192.168.1.2:8123', token: null };
}

export function isHAAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.HA_CONFIG?.url);
}
