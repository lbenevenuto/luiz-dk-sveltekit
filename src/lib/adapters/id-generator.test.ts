import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedisIdGenerator, DurableObjectIdGenerator } from './id-generator';

// Mock Redis
const mockRedis = {
	exists: vi.fn(),
	set: vi.fn(),
	incr: vi.fn()
};

// Mock Durable Object Stub
const mockStub = {
	nextValue: vi.fn()
};

describe('RedisIdGenerator', () => {
	let generator: RedisIdGenerator;

	beforeEach(() => {
		vi.clearAllMocks();
		// @ts-expect-error - partial mock
		generator = new RedisIdGenerator(mockRedis);
	});

	it('should initialize counter if it does not exist', async () => {
		mockRedis.exists.mockResolvedValue(0); // 0 means false in Redis
		mockRedis.set.mockResolvedValue('OK');
		mockRedis.incr.mockResolvedValue(1);

		const id = await generator.getNextId();

		expect(mockRedis.exists).toHaveBeenCalledWith('url_shortener:id_counter');
		expect(mockRedis.set).toHaveBeenCalledWith('url_shortener:id_counter', 0);
		expect(mockRedis.incr).toHaveBeenCalledWith('url_shortener:id_counter');
		expect(id).toBe(1);
	});

	it('should not re-initialize counter if it exists', async () => {
		mockRedis.exists.mockResolvedValue(1); // 1 means true
		mockRedis.incr.mockResolvedValue(5);

		const id = await generator.getNextId();

		expect(mockRedis.exists).toHaveBeenCalled();
		expect(mockRedis.set).not.toHaveBeenCalled();
		expect(mockRedis.incr).toHaveBeenCalled();
		expect(id).toBe(5);
	});
});

describe('DurableObjectIdGenerator', () => {
	it('should call nextValue on the stub', async () => {
		const expectedId = 123;
		mockStub.nextValue.mockResolvedValue(expectedId);

		// @ts-expect-error - partial mock
		const generator = new DurableObjectIdGenerator(mockStub);
		const id = await generator.getNextId();

		expect(mockStub.nextValue).toHaveBeenCalled();
		expect(id).toBe(expectedId);
	});
});
