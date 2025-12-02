import { cache } from '../cache';

describe('Cache Utility', () => {
  beforeEach(() => {
    cache.clear();
  });

  describe('set and get', () => {
    it('should store and retrieve values', async () => {
      await cache.set('test-key', 'test-value');
      const value = await cache.get('test-key');

      expect(value).toBe('test-value');
    });

    it('should store and retrieve objects', async () => {
      const obj = { name: 'test', count: 42 };
      await cache.set('test-obj', obj);
      const value = await cache.get('test-obj');

      expect(value).toEqual(obj);
    });

    it('should return null for non-existent keys', async () => {
      const value = await cache.get('non-existent');

      expect(value).toBeNull();
    });

    it('should respect TTL', async () => {
      await cache.set('test-key', 'test-value', 1); // 1 second TTL
      
      const immediate = await cache.get('test-key');
      expect(immediate).toBe('test-value');

      await new Promise(resolve => setTimeout(resolve, 1100));
      const afterTTL = await cache.get('test-key');
      expect(afterTTL).toBeNull();
    }, 2000);
  });

  describe('delete', () => {
    it('should delete existing keys', async () => {
      await cache.set('test-key', 'test-value');
      await cache.delete('test-key');
      const value = await cache.get('test-key');

      expect(value).toBeNull();
    });

    it('should handle deleting non-existent keys', async () => {
      await expect(cache.delete('non-existent')).resolves.not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.set('key3', 'value3');

      cache.clear();

      const value1 = await cache.get('key1');
      const value2 = await cache.get('key2');
      const value3 = await cache.get('key3');

      expect(value1).toBeNull();
      expect(value2).toBeNull();
      expect(value3).toBeNull();
    });

    it('should allow new entries after clear', async () => {
      await cache.set('old-key', 'old-value');
      cache.clear();
      await cache.set('new-key', 'new-value');
      
      const value = await cache.get('new-key');
      expect(value).toBe('new-value');
    });
  });

  describe('has', () => {
    it('should return true for existing keys', async () => {
      await cache.set('test-key', 'test-value');
      const exists = await cache.has('test-key');

      expect(exists).toBe(true);
    });

    it('should return false for non-existent keys', async () => {
      const exists = await cache.has('non-existent');

      expect(exists).toBe(false);
    });

    it('should return false for expired keys', async () => {
      await cache.set('test-key', 'test-value', 1);
      await new Promise(resolve => setTimeout(resolve, 1100));
      const exists = await cache.has('test-key');

      expect(exists).toBe(false);
    }, 2000);
  });

  describe('multiple operations', () => {
    it('should handle concurrent operations', async () => {
      const operations = [
        cache.set('key1', 'value1'),
        cache.set('key2', 'value2'),
        cache.set('key3', 'value3'),
      ];

      await Promise.all(operations);

      const [val1, val2, val3] = await Promise.all([
        cache.get('key1'),
        cache.get('key2'),
        cache.get('key3'),
      ]);

      expect(val1).toBe('value1');
      expect(val2).toBe('value2');
      expect(val3).toBe('value3');
    });
  });
});
