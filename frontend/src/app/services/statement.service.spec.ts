import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StatementService } from './statement.service';
import { HttpClient } from '@angular/common/http';
import { Transaction } from '../models';

describe('StatementService', () => {
  let service: StatementService;
  let httpClient: HttpClient;

  const mockTransactions: Transaction[] = [
    { id: '1', amount: 1000, description: 'Deposit', timestamp: '2024-01-15T10:00:00Z', fromAccount: 'acc1', toAccount: 'acc2' },
    { id: '2', amount: -500, description: 'Withdrawal', timestamp: '2024-01-20T14:30:00Z', fromAccount: 'acc2', toAccount: 'acc1' },
    { id: '3', amount: 2000, description: 'Transfer In', timestamp: '2024-02-01T09:00:00Z', fromAccount: 'acc3', toAccount: 'acc1' },
    { id: '4', amount: -300, description: 'Payment', timestamp: '2024-02-10T16:00:00Z', fromAccount: 'acc1', toAccount: 'acc4' },
  ];

  beforeEach(() => {
    httpClient = {
      post: vi.fn(),
    } as unknown as HttpClient;
    service = new StatementService(httpClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get statement', () => {
    const mockResponse = {
      accountId: 'acc1',
      accountNumber: '1234567890',
      transactions: mockTransactions,
      startDate: '2024-01-01',
      endDate: '2024-02-28',
      totalCredits: 3000,
      totalDebits: 800,
    };
    vi.mocked(httpClient.post).mockReturnValue(mockResponse as any);

    service.getStatement({
      accountId: 'acc1',
      startDate: '2024-01-01',
      endDate: '2024-02-28',
    });

    expect(httpClient.post).toHaveBeenCalled();
    expect(httpClient.post).toHaveBeenCalledWith(
      expect.stringContaining('/statements'),
      expect.any(Object)
    );
  });

  it('should generate CSV with headers', () => {
    const csv = service.generateCsv(mockTransactions);
    
    expect(csv).toContain('Date,Description,Amount,Type,From,To');
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

  it('should filter transactions by date range', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    
    const filtered = service.filterByDateRange(mockTransactions, startDate, endDate);
    
    expect(filtered).toHaveLength(2);
    expect(filtered[0].id).toBe('1');
    expect(filtered[1].id).toBe('2');
  });

  it('should return empty array when no transactions in range', () => {
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-12-31');
    
    const filtered = service.filterByDateRange(mockTransactions, startDate, endDate);
    
    expect(filtered).toHaveLength(0);
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

  it('should include transaction type in CSV when available', () => {
    const transactionsWithType: Transaction[] = [
      { id: '1', amount: 100, description: 'Deposit', type: 'CREDIT', timestamp: '2024-01-01T00:00:00Z' },
    ];
    
    const csv = service.generateCsv(transactionsWithType);
    expect(csv).toContain('CREDIT');
  });
});
