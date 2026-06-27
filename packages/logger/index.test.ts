import { describe, it, expect, vi } from 'vitest';
import { sanitizeContext, logToDatabase } from './index';

describe('Logger Package', () => {
  describe('sanitizeContext', () => {
    it('should redact sensitive keys', () => {
      const context = {
        name: 'John Doe',
        password: 'supersecret',
        apiToken: '12345',
        nested: {
          secret_key: 'abcdef',
          public_info: 'hello',
        },
      };

      const sanitized = sanitizeContext(context);

      expect(sanitized.name).toBe('John Doe');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.apiToken).toBe('[REDACTED]');
      expect(sanitized.nested.secret_key).toBe('[REDACTED]');
      expect(sanitized.nested.public_info).toBe('hello');
    });

    it('should return falsy contexts as is', () => {
      expect(sanitizeContext(null)).toBeNull();
      expect(sanitizeContext(undefined)).toBeUndefined();
    });
  });

  describe('logToDatabase', () => {
    it('should insert log into supabase system_logs', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
      const mockSupabase = { from: mockFrom };

      const testError = new Error('Test DB Error');
      const testContext = { user: 'test', password: 'pwd' };

      await logToDatabase(mockSupabase, testError, testContext);

      expect(mockFrom).toHaveBeenCalledWith('system_logs');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'error',
          message: 'Test DB Error',
          context: { user: 'test', password: '[REDACTED]' },
        })
      );
    });

    it('should gracefully handle insertion errors and safely extract message', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: new Error('Insert Failed') });
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
      const mockSupabase = { from: mockFrom };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await logToDatabase(mockSupabase, new Error('Original Error'), { debug: true });

      expect(consoleSpy).toHaveBeenCalledWith(
        'CRITICAL: Failed to log error to Supabase system_logs',
        'Insert Failed'
      );

      consoleSpy.mockRestore();
    });
  });
});
