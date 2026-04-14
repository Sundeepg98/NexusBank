import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { ApiService } from '../services/api';
import { Account } from '../models';
import { firstValueFrom } from 'rxjs';

export const accountsResolver: ResolveFn<Account[]> = async (route, state) => {
  const apiService = inject(ApiService);
  
  try {
    const accounts = await firstValueFrom(apiService.getAccounts());
    return accounts;
  } catch (error) {
    console.error('Failed to load accounts:', error);
    return [];
  }
};
