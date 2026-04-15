import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';
import { catchError, switchMap, filter, take, throwError } from 'rxjs';
import { Router } from '@angular/router';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !req.url.includes('/auth/refresh-token') && !req.url.includes('/auth/login')) {
          if (isRefreshing) {
            return authService.refreshToken().pipe(
              filter(t => !!t),
              take(1),
              switchMap((tokens) => {
                const newReq = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${tokens.token}`
                  }
                });
                return next(newReq);
              })
            );
          }

          isRefreshing = true;

          if (!authService.isRefreshTokenValid()) {
            isRefreshing = false;
            authService.logout();
            router.navigate(['/welcome']);
            return throwError(() => new Error('Session expired'));
          }

          return authService.refreshToken().pipe(
            switchMap((tokens) => {
              authService.onTokenRefreshed(tokens.token, tokens.refreshToken, tokens.refreshTokenExpiry);
              isRefreshing = false;
              const newReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${tokens.token}`
                }
              });
              return next(newReq);
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              authService.logout();
              router.navigate(['/welcome']);
              return throwError(() => new Error(refreshError.error?.error || 'Session expired'));
            })
          );
        }
        return throwError(() => new Error(error.error?.error || 'Request failed'));
      })
    );
  }

  return next(req);
};
