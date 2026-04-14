import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from './auth';
import { User } from '../models';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    getStore: () => store,
  };
})();

vi.stubGlobal('localStorage', localStorageMock);

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorageMock.clear();
    service = new AuthService();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return null token initially', () => {
    expect(service.getToken()).toBeNull();
  });

  it('should return null user initially', () => {
    expect(service.getUser()).toBeNull();
  });

  it('should not be authenticated initially', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should login and store token and user', () => {
    const mockUser: User = {
      id: '123',
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    };
    const validJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwiZXhwIjo5OTk5OTk5OTk5fQ.test';

    service.login(validJwt, mockUser);

    expect(service.getToken()).toBe(validJwt);
    expect(service.getUser()).toEqual(mockUser);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should logout and clear token and user', () => {
    const mockUser: User = {
      id: '123',
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    };
    const validJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwiZXhwIjo5OTk5OTk5OTk5fQ.test';

    service.login(validJwt, mockUser);
    service.logout();

    expect(service.getToken()).toBeNull();
    expect(service.getUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should store token in localStorage', () => {
    const mockUser: User = {
      id: '123',
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    };

    service.login('valid-token', mockUser);

    expect(localStorageMock.setItem).toHaveBeenCalledWith('nexusbank_token', 'valid-token');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('nexusbank_user', JSON.stringify(mockUser));
  });

  it('should read token from localStorage on init', () => {
    localStorageMock.setItem('nexusbank_token', 'stored-token');
    
    const newService = new AuthService();
    expect(newService.getToken()).toBe('stored-token');
  });

  it('should return token as readonly signal', () => {
    expect(service.token()).toBeNull();
    
    service.login('valid-token', {
      id: '1',
      username: 'test',
      email: 'test@test.com',
      firstName: 'T',
      lastName: 'U'
    });
    
    expect(service.token()).toBe('valid-token');
  });

  it('should return user as readonly signal', () => {
    expect(service.user()).toBeNull();
    
    const mockUser: User = {
      id: '123',
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    };
    
    service.login('valid-token', mockUser);
    expect(service.user()).toEqual(mockUser);
  });

  it('should handle user with complete properties', () => {
    const mockUser: User = {
      id: '123',
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      phone: '1234567890',
      createdAt: '2024-01-01T00:00:00Z'
    };

    service.login('valid-token', mockUser);

    const storedUser = service.getUser();
    expect(storedUser?.id).toBe('123');
    expect(storedUser?.phone).toBe('1234567890');
    expect(storedUser?.createdAt).toBe('2024-01-01T00:00:00Z');
  });

  it('should maintain separate auth state after logout then login', () => {
    const user1: User = {
      id: '1',
      username: 'user1',
      email: 'user1@test.com',
      firstName: 'User',
      lastName: 'One'
    };
    const user2: User = {
      id: '2',
      username: 'user2',
      email: 'user2@test.com',
      firstName: 'User',
      lastName: 'Two'
    };

    service.login('token1', user1);
    expect(service.getUser()?.username).toBe('user1');

    service.logout();
    service.login('token2', user2);
    
    expect(service.getToken()).toBe('token2');
    expect(service.getUser()?.username).toBe('user2');
  });
});