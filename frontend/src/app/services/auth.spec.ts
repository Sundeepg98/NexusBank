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
});
