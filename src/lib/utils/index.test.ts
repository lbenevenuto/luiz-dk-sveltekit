import { describe, it, expect } from 'vitest';
import { normalizeUrl } from './index';

describe('normalizeUrl', () => {
	it('should lowercase the hostname', () => {
		expect(normalizeUrl('https://EXAMPLE.COM/path')).toBe('https://example.com/path');
		expect(normalizeUrl('https://Example.Com/Path')).toBe('https://example.com/Path');
	});

	it('should strip the hash fragment', () => {
		expect(normalizeUrl('https://example.com/page#section')).toBe('https://example.com/page');
		expect(normalizeUrl('https://example.com/#top')).toBe('https://example.com');
	});

	it('should strip trailing slashes from paths', () => {
		expect(normalizeUrl('https://example.com/path/')).toBe('https://example.com/path');
		expect(normalizeUrl('https://example.com/a/b/c/')).toBe('https://example.com/a/b/c');
	});

	it('should not strip trailing slash from root path', () => {
		expect(normalizeUrl('https://example.com/')).toBe('https://example.com');
		expect(normalizeUrl('https://example.com')).toBe('https://example.com');
	});

	it('should preserve query strings', () => {
		expect(normalizeUrl('https://example.com/search?q=hello')).toBe('https://example.com/search?q=hello');
		expect(normalizeUrl('https://example.com?foo=bar&baz=1')).toBe('https://example.com/?foo=bar&baz=1');
	});

	it('should preserve query strings and strip hash', () => {
		expect(normalizeUrl('https://example.com/page?q=1#hash')).toBe('https://example.com/page?q=1');
	});

	it('should handle URLs with ports', () => {
		expect(normalizeUrl('https://EXAMPLE.COM:8080/path')).toBe('https://example.com:8080/path');
	});

	it('should trim whitespace from input', () => {
		expect(normalizeUrl('  https://example.com/page  ')).toBe('https://example.com/page');
	});

	it('should handle http protocol', () => {
		expect(normalizeUrl('http://example.com/path')).toBe('http://example.com/path');
	});

	it('should preserve path case (only hostname is lowercased)', () => {
		expect(normalizeUrl('https://example.com/MyPage/SubPage')).toBe('https://example.com/MyPage/SubPage');
	});

	it('should strip authentication info (URL constructor behavior)', () => {
		// The URL constructor strips userinfo per the WHATWG URL spec
		expect(normalizeUrl('https://user:pass@example.com/path')).toBe('https://example.com/path');
	});

	it('should throw for invalid URLs', () => {
		expect(() => normalizeUrl('not-a-url')).toThrow();
	});
});
