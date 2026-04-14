import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpRequest, HttpErrorResponse, HttpEventType, HttpEvent } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { errorInterceptor } from './error.interceptor';
import { AuthService } from '../services/auth';

describe('ErrorInterceptor', () => {
  let authService: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        Router
      ]
    });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
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

  it('should handle 401 error and redirect to welcome', () => {
    const routerNavigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    const mockErrorResponse = new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
      error: { error: 'Unauthorized' }
    });

    const handlerFn = () => throwError(() => mockErrorResponse);

    const mockReq = new HttpRequest('GET', '/api/test');
    TestBed.runInInjectionContext(() => errorInterceptor(mockReq, handlerFn)).subscribe({
      error: (err) => {
        expect(err).toBeDefined();
      }
    });

    expect(routerNavigateSpy).toHaveBeenCalledWith(['/welcome']);
  });

  it('should handle 500 error and log to console', () => {
    const consoleSpy = spyOn(console, 'error');
    const routerNavigateSpy = spyOn(router, 'navigate');

    const mockErrorResponse = new HttpErrorResponse({
      status: 500,
      statusText: 'Internal Server Error',
      error: { error: 'Server error' }
    });

    const handlerFn = () => throwError(() => mockErrorResponse);

    const mockReq = new HttpRequest('GET', '/api/test');
    TestBed.runInInjectionContext(() => errorInterceptor(mockReq, handlerFn)).subscribe({
      error: (err) => {
        expect(err).toBeDefined();
      }
    });

    expect(consoleSpy).toHaveBeenCalled();
    expect(routerNavigateSpy).not.toHaveBeenCalled();
  });

  it('should log error to console on error', () => {
    const consoleSpy = spyOn(console, 'error');

    const mockErrorResponse = new HttpErrorResponse({
      status: 403,
      statusText: 'Forbidden',
      error: { error: 'Forbidden' }
    });

    const handlerFn = () => throwError(() => mockErrorResponse);

    const mockReq = new HttpRequest('GET', '/api/test');
    TestBed.runInInjectionContext(() => errorInterceptor(mockReq, handlerFn)).subscribe({
      error: () => {}
    });

    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should pass through successful responses', () => {
    const routerNavigateSpy = spyOn(router, 'navigate');
    let hasResponse = false;

    const handlerFn = () => {
      hasResponse = true;
      return of();
    };

    const mockReq = new HttpRequest('GET', '/api/test');
    TestBed.runInInjectionContext(() => errorInterceptor(mockReq, handlerFn)).subscribe();

    expect(hasResponse).toBeTrue();
    expect(routerNavigateSpy).not.toHaveBeenCalled();
  });
});