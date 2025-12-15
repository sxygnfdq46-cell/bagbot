const STORAGE_KEY = 'bagbot-auth-token';
const COOKIE_KEY = 'bagbot-auth-token';
const listeners = new Set<(token: string | null) => void>();
let inMemoryToken: string | null = null;
const isBrowser = typeof window !== 'undefined';

const readToken = () => {
  if (!isBrowser) return null;
  return window.localStorage.getItem(STORAGE_KEY);
};

if (isBrowser) {
  inMemoryToken = readToken();
}

const writeCookie = (token: string | null) => {
  if (!isBrowser) return;
  if (!token) {
    document.cookie = `${COOKIE_KEY}=; path=/; max-age=0; sameSite=Lax`;
    return;
  }
  document.cookie = `${COOKIE_KEY}=${token}; path=/; sameSite=Lax`;
};

const notify = () => {
  listeners.forEach((listener) => listener(inMemoryToken));
};

export const tokenStore = {
  getToken(): string | null {
    if (inMemoryToken === null && isBrowser) {
      inMemoryToken = readToken();
    }
    return inMemoryToken;
  },
  setToken(token: string) {
    inMemoryToken = token;
    if (isBrowser) {
      window.localStorage.setItem(STORAGE_KEY, token);
    }
    writeCookie(token);
    notify();
  },
  clearToken() {
    inMemoryToken = null;
    if (isBrowser) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    writeCookie(null);
    notify();
  },
  subscribe(listener: (token: string | null) => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
};
