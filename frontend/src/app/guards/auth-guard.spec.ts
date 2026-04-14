import { describe, it, expect } from 'vitest';
import { authGuard } from './auth-guard';

describe('AuthGuard', () => {
  it('should be defined', () => {
    expect(authGuard).toBeDefined();
  });

  it('should be a function', () => {
    expect(typeof authGuard).toBe('function');
  });
});