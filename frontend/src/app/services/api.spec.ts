import { describe, it, expect } from 'vitest';
import { ApiService } from './api';

describe('ApiService', () => {
  it('should be defined', () => {
    expect(ApiService).toBeDefined();
  });

  it('should be injectable service', () => {
    expect(ApiService.ɵprov).toBeDefined();
  });
});