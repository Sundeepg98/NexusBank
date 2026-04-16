import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { loginGuard } from './guards/login-guard';
import { accountsResolver } from './guards/accounts-resolver';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home').then(m => m.Home)
  },
  {
    path: 'about-us',
    loadComponent: () => import('./pages/about-us/about-us').then(m => m.AboutUs)
  },
  {
    path: 'contact-us',
    loadComponent: () => import('./pages/contact/contact').then(m => m.Contact)
  },
  {
    path: 'contact',
    redirectTo: 'contact-us',
    pathMatch: 'full'
  },

  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.Login),
    canActivate: [loginGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then(m => m.Register)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password').then(m => m.ForgotPassword)
  },
  {
    path: 'services',
    loadComponent: () => import('./pages/services/services').then(m => m.Services),
    canActivate: [authGuard]
  },
  {
    path: 'netbanking',
    loadComponent: () => import('./pages/netbanking/netbanking').then(m => m.Netbanking),
    canActivate: [authGuard],
    resolve: {
      accounts: accountsResolver
    }
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile').then(m => m.Profile),
    canActivate: [authGuard]
  },
  {
    path: 'beneficiaries',
    loadComponent: () => import('./pages/beneficiaries/beneficiaries').then(m => m.Beneficiaries),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];
