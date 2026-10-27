export interface LogEntry {
  id: string;
  timestamp: string;
  timeMs: number;
  level: 'error' | 'warn' | 'info' | 'log';
  message: string;
  stack?: string;
  source?: string;
}

const STORAGE_KEY = 'crickazz_persistent_logs';
const MAX_LOGS = 150;

let inMemoryLogs: LogEntry[] = [];
let isInitialized = false;
const listeners = new Set<(logs: LogEntry[]) => void>();

function safeStringify(arg: unknown): string {
  if (arg === null) return 'null';
  if (arg === undefined) return 'undefined';
  if (arg instanceof Error) {
    return `${arg.name}: ${arg.message}${arg.stack ? `\n${arg.stack}` : ''}`;
  }
  if (typeof arg === 'object') {
    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  }
  return String(arg);
}

function loadPersistedLogs(): LogEntry[] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(-MAX_LOGS);
    }
  } catch (err) {
    console.warn('[Logger] Could not load persisted logs from localStorage:', err);
  }
  return [];
}

function persistLogs(logs: LogEntry[]) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(-MAX_LOGS)));
  } catch {
    // If quota exceeded, slice down aggressively and retry
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(-30)));
    } catch {
      // ignore
    }
  }
}

function notifyListeners() {
  const snapshot = [...inMemoryLogs];
  listeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch (e) {
      console.warn('[Logger] Listener notification error:', e);
    }
  });
}

export function addLog(
  level: 'error' | 'warn' | 'info' | 'log',
  message: string,
  stack?: string,
  source?: string
): LogEntry {
  const entry: LogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }),
    timeMs: Date.now(),
    level,
    message,
    stack,
    source: source || 'app',
  };

  inMemoryLogs = [...inMemoryLogs, entry].slice(-MAX_LOGS);
  persistLogs(inMemoryLogs);
  notifyListeners();
  return entry;
}

export function getPersistentLogs(): LogEntry[] {
  if (!isInitialized) {
    inMemoryLogs = loadPersistedLogs();
  }
  return [...inMemoryLogs];
}

export function clearPersistentLogs(): void {
  inMemoryLogs = [];
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  notifyListeners();
}

export function subscribeToLogs(listener: (logs: LogEntry[]) => void): () => void {
  listeners.add(listener);
  listener([...inMemoryLogs]);
  return () => {
    listeners.delete(listener);
  };
}

export function initPersistentLogger(): void {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  inMemoryLogs = loadPersistedLogs();

  // Log session startup milestone
  addLog('info', `Cricbuzz LiveStats initialized at ${new Date().toISOString()} [Viewport: ${window.innerWidth}x${window.innerHeight}]`, undefined, 'system');

  // Intercept standard console methods while preserving original output
  const originalError = console.error.bind(console);
  const originalWarn = console.warn.bind(console);
  const originalInfo = console.info.bind(console);
  const originalLog = console.log.bind(console);

  console.error = (...args: unknown[]) => {
    try {
      const msg = args.map(safeStringify).join(' ');
      let stack: string | undefined;
      const errObj = args.find((a) => a instanceof Error) as Error | undefined;
      if (errObj && errObj.stack) {
        stack = errObj.stack;
      }
      addLog('error', msg, stack, 'console.error');
    } catch {
      // ignore
    }
    originalError(...args);
  };

  console.warn = (...args: unknown[]) => {
    try {
      const msg = args.map(safeStringify).join(' ');
      addLog('warn', msg, undefined, 'console.warn');
    } catch {
      // ignore
    }
    originalWarn(...args);
  };

  console.info = (...args: unknown[]) => {
    try {
      const msg = args.map(safeStringify).join(' ');
      addLog('info', msg, undefined, 'console.info');
    } catch {
      // ignore
    }
    originalInfo(...args);
  };

  console.log = (...args: unknown[]) => {
    try {
      // Filter out high-frequency noise while capturing important state changes
      const msg = args.map(safeStringify).join(' ');
      if (!msg.includes('[HMR]') && !msg.includes('downloadable font:')) {
        addLog('log', msg, undefined, 'console.log');
      }
    } catch {
      // ignore
    }
    originalLog(...args);
  };

  // Intercept uncaught global errors
  window.addEventListener('error', (event) => {
    const errorMsg = event.message || 'Uncaught Error';
    const stack = event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`;
    addLog('error', `[Uncaught Runtime Error] ${errorMsg}`, stack, 'window.onerror');
  });

  // Intercept unhandled promise rejections (e.g. dynamic imports, async database fetches)
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = safeStringify(reason);
    const stack = reason instanceof Error ? reason.stack : undefined;
    addLog('error', `[Unhandled Promise Rejection] ${msg}`, stack, 'unhandledrejection');
  });
}
