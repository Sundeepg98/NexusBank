import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { loginGuard } from './guards/login-guard';

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
    loadComponent: () => import('./pages/contact-us/contact-us').then(m => m.ContactUs)
  },
  {
    path: 'welcome',
    loadComponent: () => import('./pages/welcome/welcome').then(m => m.Welcome),
    canActivate: [loginGuard]
  },
  {
    path: 'services',
    loadComponent: () => import('./pages/services/services').then(m => m.Services),
    canActivate: [authGuard]
  },
  {
    path: 'netbanking',
    loadComponent: () => import('./pages/netbanking/netbanking').then(m => m.Netbanking),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];
