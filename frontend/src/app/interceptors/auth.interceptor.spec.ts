import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpRequest, HttpHandlerFn, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth';

describe('AuthInterceptor', () => {
  let authService: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService
      ]
    });
    authService = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(authService).toBeTruthy();
  });

  it('should add Authorization header when token exists', () => {
    const mockUser = {
      id: '1',
      username: 'test',
      email: 'test@test.com',
      firstName: 'Test',
      lastName: 'User'
    };
    authService.login('mock-token-123', mockUser as any);

    let capturedHeaders: any = null;
    
    const handlerFn = (req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> => {
      if (req.headers.has('Authorization')) {
        capturedHeaders = req.headers.get('Authorization');
      }
      return of();
    };

    const mockReq = new HttpRequest('GET', '/api/test');
    TestBed.runInInjectionContext(() => authInterceptor(mockReq, handlerFn)).subscribe();

    expect(capturedHeaders).toBe('Bearer mock-token-123');
  });

  it('should not add Authorization header when no token', () => {
    let hasAuthHeader = false;
    
    const handlerFn = (req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> => {
      hasAuthHeader = req.headers.has('Authorization');
      return of();
    };

    const mockReq = new HttpRequest('GET', '/api/test');
    TestBed.runInInjectionContext(() => authInterceptor(mockReq, handlerFn)).subscribe();

    expect(hasAuthHeader).toBeFalse();
  });

  it('should use Bearer prefix with token', () => {
    const mockUser = {
      id: '1',
      username: 'test',
      email: 'test@test.com',
      firstName: 'Test',
      lastName: 'User'
    };
    authService.login('test-token', mockUser as any);

    let capturedHeaders: any = null;
    
    const handlerFn = (req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> => {
      capturedHeaders = req.headers.get('Authorization');
      return of();
    };

    const mockReq = new HttpRequest('GET', '/api/test');
    TestBed.runInInjectionContext(() => authInterceptor(mockReq, handlerFn)).subscribe();

    expect(capturedHeaders).toBe('Bearer test-token');
  });
});