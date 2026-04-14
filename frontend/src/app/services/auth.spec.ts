import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth';
import { User } from '../models';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
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
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('should login and store token and user', () => {
    const mockUser: User = {
      id: '123',
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    };

    service.login('mock-token-123', mockUser);

    expect(service.getToken()).toBe('mock-token-123');
    expect(service.getUser()).toEqual(mockUser);
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('should logout and clear token and user', () => {
    const mockUser: User = {
      id: '123',
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    };

    service.login('mock-token-123', mockUser);
    service.logout();

    expect(service.getToken()).toBeNull();
    expect(service.getUser()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('should store token in localStorage', () => {
    const mockUser: User = {
      id: '123',
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    };

    service.login('mock-token-123', mockUser);

    expect(localStorage.getItem('nexusbank_token')).toBe('mock-token-123');
    expect(localStorage.getItem('nexusbank_user')).toBeTruthy();
  });

  it('should read token from localStorage on init', () => {
    localStorage.setItem('nexusbank_token', 'stored-token');
    
    const newService = new AuthService();
    expect(newService.getToken()).toBe('stored-token');
  });

  it('should return token as readonly signal', () => {
    expect(service.token()).toBeNull();
    
    service.login('test-token', {
      id: '1',
      username: 'test',
      email: 'test@test.com',
      firstName: 'T',
      lastName: 'U'
    });
    
    expect(service.token()).toBe('test-token');
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
    
    service.login('token', mockUser);
    expect(service.user()).toEqual(mockUser);
  });

  it('should not be authenticated with expired token', () => {
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwiZXhwIjoxNTAwMDAwMDAwfQ.sig';
    
    service.login(expiredToken, {
      id: '1',
      username: 'test',
      email: 'test@test.com',
      firstName: 'T',
      lastName: 'U'
    });
    
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('should not be authenticated with malformed token', () => {
    service.login('malformed-token-not-json', {
      id: '1',
      username: 'test',
      email: 'test@test.com',
      firstName: 'T',
      lastName: 'U'
    });
    
    expect(service.isAuthenticated()).toBeFalse();
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

    service.login('token-123', mockUser);

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
