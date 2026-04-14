import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api';
import { User, Account, Transaction } from '../models';
import { environment } from '../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login()', () => {
    it('should return auth response on successful login', () => {
      const mockResponse = {
        message: 'Login successful',
        token: 'mock-token-123',
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User'
        } as User
      };

      service.login('test@example.com', 'password123').subscribe(response => {
        expect(response.token).toBe('mock-token-123');
        expect(response.user.username).toBe('testuser');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('register()', () => {
    it('should return auth response on successful registration', () => {
      const mockResponse = {
        message: 'Registration successful',
        token: 'mock-token-456',
        user: {
          id: '2',
          username: 'newuser',
          email: 'new@example.com',
          firstName: 'New',
          lastName: 'User'
        } as User
      };

      service.register({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User'
      }).subscribe(response => {
        expect(response.token).toBe('mock-token-456');
        expect(response.user.email).toBe('new@example.com');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('getAccounts()', () => {
    it('should return accounts list', () => {
      const mockResponse = {
        accounts: [
          { id: '1', accountNumber: '123456', accountType: 'SAVINGS' as const, balance: 1000 },
          { id: '2', accountNumber: '789012', accountType: 'CURRENT' as const, balance: 500 }
        ] as Account[]
      };

      service.getAccounts().subscribe(accounts => {
        expect(accounts.length).toBe(2);
        expect(accounts[0].accountType).toBe('SAVINGS');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/accounts`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when no accounts', () => {
      const mockResponse = { accounts: [] as Account[] };

      service.getAccounts().subscribe(accounts => {
        expect(accounts.length).toBe(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/accounts`);
      req.flush(mockResponse);
    });
  });

  describe('createAccount()', () => {
    it('should create new account and return response', () => {
      const mockResponse = {
        message: 'Account created successfully',
        account: { id: '3', accountNumber: '345678', accountType: 'SAVINGS' as const, balance: 0 }
      } as { message: string; account: Account };

      service.createAccount('SAVINGS', 100).subscribe(response => {
        expect(response.message).toBe('Account created successfully');
        expect(response.account.accountNumber).toBe('345678');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/accounts`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.get('accountType')).toBe('SAVINGS');
      req.flush(mockResponse);
    });
  });

  describe('transfer()', () => {
    it('should transfer funds and return success message', () => {
      const mockResponse = { message: 'Transfer successful' };

      service.transfer({
        fromAccountId: 'acc-1',
        toAccountNumber: '123456',
        amount: 100,
        description: 'Test transfer'
      }).subscribe(response => {
        expect(response.message).toBe('Transfer successful');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/transactions/transfer`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('getTransactions()', () => {
    it('should return transactions for account', () => {
      const mockResponse = {
        transactions: [
          { id: 't1', amount: 100, description: 'Deposit', timestamp: '2024-01-01T00:00:00Z' },
          { id: 't2', amount: -50, description: 'Withdrawal', timestamp: '2024-01-02T00:00:00Z' }
        ] as Transaction[]
      };

      service.getTransactions('acc-1').subscribe(transactions => {
        expect(transactions.length).toBe(2);
        expect(transactions[0].amount).toBe(100);
      });

      const req = httpMock.expectOne(req => req.url.includes('transactions'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('Error handling', () => {
    it('should handle 401 error', () => {
      service.login('test@example.com', 'wrongpassword').subscribe({
        error: (err) => {
          expect(err).toBeDefined();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush({ error: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle 404 error', () => {
      service.getAccounts().subscribe({
        error: (err) => {
          expect(err).toBeDefined();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/accounts`);
      req.flush({ error: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle 500 error', () => {
      service.getAccounts().subscribe({
        error: (err) => {
          expect(err).toBeDefined();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/accounts`);
      req.flush({ error: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });
});