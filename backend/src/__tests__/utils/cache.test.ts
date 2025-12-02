import { cache } from '../../utils/cache';

describe('Cache Utility', () => {
  beforeEach(() => {
    cache.clear();
  });

  describe('set and get', () => {
    it('should store and retrieve values', () => {
      cache.set('test-key', 'test-value');
      const value = cache.get('test-key');

      expect(value).toBe('test-value');
    });

    it('should store and retrieve objects', () => {
      const obj = { name: 'test', count: 42 };
      cache.set('test-obj', obj);
      const value = cache.get('test-obj');

      expect(value).toEqual(obj);
    });

    it('should return null for non-existent keys', () => {
      const value = cache.get('non-existent');

      expect(value).toBeNull();
    });

    it('should respect TTL', async () => {
      cache.set('test-key', 'test-value', 1000); // 1 second TTL
      
      const immediate = cache.get('test-key');
      expect(immediate).toBe('test-value');

      await new Promise(resolve => setTimeout(resolve, 1100));
      const afterTTL = cache.get('test-key');
      expect(afterTTL).toBeNull();
    }, 2000);
  });

  describe('delete', () => {
    it('should delete existing keys', () => {
      cache.set('test-key', 'test-value');
      cache.delete('test-key');
      const value = cache.get('test-key');

      expect(value).toBeNull();
    });

    it('should handle deleting non-existent keys', () => {
      expect(() => cache.delete('non-existent')).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      cache.clear();

      const value1 = cache.get('key1');
      const value2 = cache.get('key2');
      const value3 = cache.get('key3');

      expect(value1).toBeNull();
      expect(value2).toBeNull();
      expect(value3).toBeNull();
    });

    it('should allow new entries after clear', () => {
      cache.set('old-key', 'old-value');
      cache.clear();
      cache.set('new-key', 'new-value');
      
      const value = cache.get('new-key');
      expect(value).toBe('new-value');
    });
  });

  describe('key existence', () => {
    it('should check if key exists', () => {
      cache.set('test-key', 'test-value');
      const value = cache.get('test-key');

      expect(value).not.toBeNull();
    });

    it('should return null for non-existent keys', () => {
      const value = cache.get('non-existent');

      expect(value).toBeNull();
    });

    it('should return null for expired keys', async () => {
      cache.set('test-key', 'test-value', 1000);
      await new Promise(resolve => setTimeout(resolve, 1100));
      const value = cache.get('test-key');

      expect(value).toBeNull();
    }, 2000);
  });

  describe('multiple operations', () => {
    it('should handle concurrent operations', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      const val1 = cache.get('key1');
      const val2 = cache.get('key2');
      const val3 = cache.get('key3');

      expect(val1).toBe('value1');
      expect(val2).toBe('value2');
      expect(val3).toBe('value3');
    });
  });
});
