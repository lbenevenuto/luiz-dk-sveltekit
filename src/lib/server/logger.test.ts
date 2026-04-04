import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger, requestContext } from './logger';

describe('logger', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('includes requestId when running inside requestContext', () => {
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

		requestContext.run({ requestId: 'req-123' }, () => {
			logger.info('test.message', { key: 'value' });
		});

		expect(spy).toHaveBeenCalledOnce();
		const payload = JSON.parse(spy.mock.calls[0][0] as string);
		expect(payload.requestId).toBe('req-123');
		expect(payload.message).toBe('test.message');
		expect(payload.key).toBe('value');
	});

	it('omits requestId when running outside requestContext', () => {
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

		logger.info('test.no_context');

		expect(spy).toHaveBeenCalledOnce();
		const payload = JSON.parse(spy.mock.calls[0][0] as string);
		expect(payload.requestId).toBeUndefined();
		expect(payload.message).toBe('test.no_context');
	});

	it('routes error level to console.error', () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

		logger.error('test.error', { detail: 'oops' });

		expect(spy).toHaveBeenCalledOnce();
		const payload = JSON.parse(spy.mock.calls[0][0] as string);
		expect(payload.level).toBe('error');
	});

	it('routes warn level to console.warn', () => {
		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		logger.warn('test.warn');

		expect(spy).toHaveBeenCalledOnce();
		const payload = JSON.parse(spy.mock.calls[0][0] as string);
		expect(payload.level).toBe('warn');
	});
});
