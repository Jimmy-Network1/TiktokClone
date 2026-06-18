import AsyncStorage from '@react-native-async-storage/async-storage';

export type RuntimeIssue = {
  id: string;
  timestamp: string;
  source: 'global' | 'console' | 'boot' | 'boundary';
  fatal: boolean;
  message: string;
  stack?: string;
};

const STORAGE_KEY = '@g4/runtime_issues';
const MAX_ISSUES = 5;

let installed = false;
let previousErrorHandler: ((error: Error, isFatal?: boolean) => void) | null = null;

const toMessage = (value: unknown) => {
  if (value instanceof Error) {
    return value.message;
  }

  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const toStack = (value: unknown) => {
  if (value instanceof Error) {
    return value.stack;
  }

  return undefined;
};

export const getRuntimeIssues = async (): Promise<RuntimeIssue[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const clearRuntimeIssues = async () => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};

export const recordRuntimeIssue = async (issue: Omit<RuntimeIssue, 'id' | 'timestamp'>) => {
  const nextIssue: RuntimeIssue = {
    ...issue,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  };

  const previousIssues = await getRuntimeIssues();
  const nextIssues = [nextIssue, ...previousIssues].slice(0, MAX_ISSUES);

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextIssues));

  return nextIssue;
};

export const installRuntimeDiagnostics = () => {
  if (installed) return;
  installed = true;

  const errorUtils = (globalThis as any)?.ErrorUtils;
  if (errorUtils?.setGlobalHandler) {
    previousErrorHandler = errorUtils.getGlobalHandler?.() || null;

    errorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      recordRuntimeIssue({
        source: 'global',
        fatal: isFatal !== false,
        message: toMessage(error),
        stack: toStack(error),
      }).catch(() => undefined);

      if (previousErrorHandler) {
        previousErrorHandler(error, isFatal);
      }
    });
  }

  const originalConsoleError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    originalConsoleError(...(args as any[]));

    const [first] = args;
    const message = toMessage(first);
    const shouldStore = first instanceof Error || /error|failed|exception|crash/i.test(message);

    if (shouldStore) {
      recordRuntimeIssue({
        source: 'console',
        fatal: false,
        message,
        stack: toStack(first),
      }).catch(() => undefined);
    }
  };
};
