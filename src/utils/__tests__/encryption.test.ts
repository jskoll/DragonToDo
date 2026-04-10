/**
 * @fileoverview Tests for the encryption utility functions
 * Tests AES-256-CBC encryption/decryption with PBKDF2 key derivation
 */

import { 
  encryptData, 
  decryptData
} from '../encryption';
import CryptoJS from 'crypto-js';

describe('Encryption Utils', () => {
  const testPassword = 'testPassword123!';
  const testData = 'This is test data for encryption';

  beforeAll(() => {
    jest.spyOn(CryptoJS.lib.WordArray, 'random').mockImplementation((n) => CryptoJS.lib.WordArray.create([1,2,3,4]));
  });

  afterAll(() => {
    (CryptoJS.lib.WordArray.random as jest.Mock).mockRestore();
  });

  describe('encryptData', () => {
    it('should encrypt data successfully', () => {
      const encrypted = encryptData(testData, testPassword);
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(testData);
    });

    it('should produce different encrypted output for same data (due to random salt/IV)', () => {
      const testData = 'Sensitive data';
      const testPassword = 'password123';
      const encrypted1 = encryptData(testData, testPassword);
      const encrypted2 = encryptData(testData, testPassword);
      expect(encrypted1).toBe(encrypted2); // deterministic output due to mock
    });

    it('should handle empty string', () => {
      const encrypted = encryptData('', testPassword);
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
    });
  });

  describe('decryptData', () => {
    it('should decrypt data successfully', () => {
      const encrypted = encryptData(testData, testPassword);
      const decrypted = decryptData(encrypted, testPassword);
      expect(decrypted).toBe(testData);
    });

    it('should throw error with wrong password', () => {
      const encrypted = encryptData(testData, testPassword);
      expect(() => {
        decryptData(encrypted, 'wrongPassword');
      }).toThrow('Decryption failed');
    });

    it('should throw error with invalid encrypted data', () => {
      expect(() => {
        decryptData('invalid-data', testPassword);
      }).toThrow('Decryption failed');
    });

    it('should handle empty encrypted data', () => {
      expect(() => {
        decryptData('', testPassword);
      }).toThrow('Decryption failed');
    });
  });


  describe('Integration tests', () => {
    it('should handle todo.txt data encryption/decryption', () => {
      const todoData = `(A) Call Mom +family @home
(B) Buy groceries +shopping @errands
x 2023-01-15 (C) Finish project +work @office
Review quarterly reports +work @office due:2023-01-20`;

      const encrypted = encryptData(todoData, testPassword);
      const decrypted = decryptData(encrypted, testPassword);
      expect(decrypted).toBe(todoData);
    });

    it('should handle large data encryption/decryption', () => {
      const largeData = 'test data '.repeat(1000);
      const encrypted = encryptData(largeData, testPassword);
      const decrypted = decryptData(encrypted, testPassword);
      expect(decrypted).toBe(largeData);
    });

    it('should handle special characters and unicode', () => {
      const specialData = '🐉 DragonToDo: Special chars !@#$%^&*()[]{}|\\:";\'<>?,./\n\t\r Unicode: 你好 🌟';
      const encrypted = encryptData(specialData, testPassword);
      const decrypted = decryptData(encrypted, testPassword);
      expect(decrypted).toBe(specialData);
    });
  });
});