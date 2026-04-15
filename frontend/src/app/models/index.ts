export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  createdAt?: string;
}

export interface Account {
  id: string;
  accountNumber: string;
  accountType: 'SAVINGS' | 'CURRENT' | 'FIXED';
  balance: number;
  createdAt?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  type?: string;
  timestamp: string;
  fromAccount?: string;
  toAccount?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
  account?: Account;
}

export interface AccountsResponse {
  accounts: Account[];
}

export interface TransactionsResponse {
  transactions: Transaction[];
}

export interface TransferRequest {
  fromAccountId: string;
  toAccountNumber: string;
  amount: number;
  description?: string;
}

export interface ApiError {
  error: string;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface FormFieldState {
  touched: boolean;
  dirty: boolean;
  invalid: boolean;
  errors: Record<string, string>;
}
