import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StatementService } from './statement.service';
import { HttpClient } from '@angular/common/http';
import { Transaction } from '../models';

describe('StatementService', () => {
  let service: StatementService;
  let httpClient: HttpClient;

  const mockTransactions: Transaction[] = [
    { id: '1', amount: 1000, description: 'Deposit', timestamp: '2024-01-15T10:00:00Z' },
    { id: '2', amount: -500, description: 'Withdrawal', timestamp: '2024-01-20T14:30:00Z' },
    { id: '3', amount: 2000, description: 'Transfer In', timestamp: '2024-02-01T09:00:00Z' },
    { id: '4', amount: -300, description: 'Payment', timestamp: '2024-02-10T16:00:00Z' },
  ];

  beforeEach(() => {
    httpClient = {
      get: vi.fn(),
    } as unknown as HttpClient;
    service = new StatementService(httpClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get statement', () => {
    const mockResponse = {
      statement: {
        accountId: 'acc1',
        accountNumber: '1234567890',
        transactions: mockTransactions,
        fromDate: '2024-01-01',
        toDate: '2024-02-28',
        generatedAt: '2024-03-01T00:00:00Z',
      }
    };
    vi.mocked(httpClient.get).mockReturnValue(mockResponse as any);

    service.getStatement('acc1', '2024-01-01', '2024-02-28');

    expect(httpClient.get).toHaveBeenCalled();
    expect(httpClient.get).toHaveBeenCalledWith(
      expect.stringContaining('/accounts/acc1/statement')
    );
  });

  it('should generate CSV with headers', () => {
    const csv = service.generateCsv(mockTransactions);
    
    expect(csv).toContain('Date,Description,Amount');
    expect(csv).toContain('2024-01-15T10:00:00Z');
    expect(csv).toContain('Deposit');
    expect(csv).toContain('1000');
  });

  it('should generate CSV with all transactions', () => {
    const csv = service.generateCsv(mockTransactions);
    const lines = csv.split('\n').filter(line => line.length > 0);
    
    expect(lines.length).toBe(mockTransactions.length + 1);
  });

  it('should handle empty transactions for CSV', () => {
    const csv = service.generateCsv([]);
    expect(csv).toBe('');
  });

  it('should calculate totals correctly', () => {
    const totals = service.calculateTotals(mockTransactions);
    
    expect(totals.credits).toBe(3000);
    expect(totals.debits).toBe(800);
  });

  it('should handle all positive transactions for credits', () => {
    const allPositive: Transaction[] = [
      { id: '1', amount: 100, description: 'Test', timestamp: '2024-01-01T00:00:00Z' },
      { id: '2', amount: 200, description: 'Test', timestamp: '2024-01-02T00:00:00Z' },
    ];
    
    const totals = service.calculateTotals(allPositive);
    expect(totals.credits).toBe(300);
    expect(totals.debits).toBe(0);
  });

  it('should handle all negative transactions for debits', () => {
    const allNegative: Transaction[] = [
      { id: '1', amount: -100, description: 'Test', timestamp: '2024-01-01T00:00:00Z' },
      { id: '2', amount: -200, description: 'Test', timestamp: '2024-01-02T00:00:00Z' },
    ];
    
    const totals = service.calculateTotals(allNegative);
    expect(totals.credits).toBe(0);
    expect(totals.debits).toBe(300);
  });

  it('should handle empty transactions for totals', () => {
    const totals = service.calculateTotals([]);
    expect(totals.credits).toBe(0);
    expect(totals.debits).toBe(0);
  });
});
