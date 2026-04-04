import { AsyncLocalStorage } from 'node:async_hooks';

export const requestContext = new AsyncLocalStorage<{ requestId: string }>();

type LogLevel = 'info' | 'warn' | 'error';

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
	const store = requestContext.getStore();
	const payload = {
		timestamp: new Date().toISOString(),
		level,
		message,
		...(store?.requestId ? { requestId: store.requestId } : {}),
		...(meta || {})
	};
	const serialized = JSON.stringify(payload);
	if (level === 'error') {
		console.error(serialized);
	} else if (level === 'warn') {
		console.warn(serialized);
	} else {
		console.log(serialized);
	}
}

export const logger = {
	info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
	warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
	error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta)
};
