import { getClientIdentifier } from './rate-limit';
import { getOrCreateRequestId } from './api-helpers';

export interface RequestLogMeta {
  requestId: string;
  method: string;
  path: string;
  ip: string;
}

export function getRequestLogMeta(request: Request): RequestLogMeta {
  const url = new URL(request.url);
  return {
    requestId: getOrCreateRequestId(request),
    method: request.method,
    path: url.pathname,
    ip: getClientIdentifier(request),
  };
}

export function logInfo(message: string, meta: Record<string, unknown>) {
  console.info(JSON.stringify({ level: 'info', message, ...meta }));
}

export function logWarn(message: string, meta: Record<string, unknown>) {
  console.warn(JSON.stringify({ level: 'warn', message, ...meta }));
}

export function logError(message: string, meta: Record<string, unknown>) {
  console.error(JSON.stringify({ level: 'error', message, ...meta }));
}
