import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth-guard';
import { AuthService } from '../services/auth';

describe('AuthGuard', () => {
  let authService: AuthService;
  let router: Router;

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = { url: '/home' } as RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        Router
      ]
    });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(authService).toBeTruthy();
  });

  it('should allow access when authenticated', () => {
    const mockUser = {
      id: '1',
      username: 'test',
      email: 'test@test.com',
      firstName: 'Test',
      lastName: 'User'
    };
    authService.login('mock-token-123', mockUser as any);

    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

    expect(result).toBeTrue();
  });

  it('should redirect when not authenticated', () => {
    const createUrlTreeSpy = spyOn(router, 'createUrlTree').and.returnValue({} as any);

    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

    expect(result).not.toBeTrue();
    expect(createUrlTreeSpy).toHaveBeenCalledWith(['/welcome']);
  });

  it('should call router.navigate when not authenticated', () => {
    const createUrlTreeSpy = spyOn(router, 'createUrlTree').and.returnValue({} as any);

    TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

    expect(createUrlTreeSpy).toHaveBeenCalledWith(['/welcome']);
  });

  it('should not call router.navigate when authenticated', () => {
    const mockUser = {
      id: '1',
      username: 'test',
      email: 'test@test.com',
      firstName: 'Test',
      lastName: 'User'
    };
    authService.login('mock-token-123', mockUser as any);

    const createUrlTreeSpy = spyOn(router, 'createUrlTree');

    TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

    expect(createUrlTreeSpy).not.toHaveBeenCalled();
  });
});