import { encrypt, decrypt, isValidEncryptionKey } from '../../utils/encryption';

describe('Encryption Utilities', () => {
  const validKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const testData = 'sensitive-password-123';

  beforeAll(() => {
    process.env.ENCRYPTION_KEY = validKey;
  });

  describe('encrypt', () => {
    it('should encrypt data successfully', () => {
      const encrypted = encrypt(testData);
      
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(testData);
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should produce different output for same input (IV randomization)', () => {
      const encrypted1 = encrypt(testData);
      const encrypted2 = encrypt(testData);
      
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should handle empty strings', () => {
      const encrypted = encrypt('');
      expect(encrypted).toBeDefined();
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted data correctly', () => {
      const encrypted = encrypt(testData);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(testData);
    });

    it('should handle multiple encrypt/decrypt cycles', () => {
      const encrypted1 = encrypt(testData);
      const decrypted1 = decrypt(encrypted1);
      const encrypted2 = encrypt(decrypted1);
      const decrypted2 = decrypt(encrypted2);
      
      expect(decrypted2).toBe(testData);
    });

    it('should throw error for invalid encrypted data', () => {
      expect(() => decrypt('invalid-data')).toThrow();
    });

    it('should throw error for tampered data', () => {
      const encrypted = encrypt(testData);
      const tampered = encrypted.substring(0, encrypted.length - 5) + 'xxxxx';
      
      expect(() => decrypt(tampered)).toThrow();
    });
  });

  describe('isValidEncryptionKey', () => {
    it('should validate correct 64-character hex key', () => {
      expect(isValidEncryptionKey(validKey)).toBe(true);
    });

    it('should reject invalid key length', () => {
      expect(isValidEncryptionKey('short')).toBe(false);
    });

    it('should reject non-hex characters', () => {
      const invalidKey = '0123456789abcdefgxyz456789abcdef0123456789abcdef0123456789abcdef';
      expect(isValidEncryptionKey(invalidKey)).toBe(false);
    });

    it('should reject undefined/null', () => {
      expect(isValidEncryptionKey(undefined as any)).toBe(false);
      expect(isValidEncryptionKey(null as any)).toBe(false);
    });
  });

  describe('Integration', () => {
    it('should handle special characters', () => {
      const specialData = 'P@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = encrypt(specialData);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(specialData);
    });

    it('should handle unicode characters', () => {
      const unicodeData = 'Zażółć gęślą jaźń 日本語 🚀';
      const encrypted = encrypt(unicodeData);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(unicodeData);
    });

    it('should handle very long strings', () => {
      const longData = 'x'.repeat(10000);
      const encrypted = encrypt(longData);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(longData);
    });
  });
});
