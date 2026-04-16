import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Transaction } from '../models';

export interface StatementResponse {
  accountId: string;
  accountNumber: string;
  transactions: Transaction[];
  fromDate: string;
  toDate: string;
  totalCredits: number;
  totalDebits: number;
}

@Injectable({
  providedIn: 'root',
})
export class StatementService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getStatement(accountId: string, from: string, to: string): Observable<StatementResponse> {
    return this.http.get<StatementResponse>(`${this.baseUrl}/accounts/${accountId}/statement?from=${from}&to=${to}`);
  }

  generateCsv(transactions: Transaction[]): string {
    if (transactions.length === 0) return '';
    const headers = 'Date,Description,Amount,Type,From,To\n';
    const rows = transactions.map(t => 
      `${t.timestamp},${t.description},${t.amount},${t.type || 'N/A'},${t.fromAccount || ''},${t.toAccount || ''}`
    ).join('\n');
    return headers + rows;
  }

  calculateTotals(transactions: Transaction[]): { credits: number; debits: number } {
    let credits = 0;
    let debits = 0;
    transactions.forEach(t => {
      if (t.amount > 0) {
        credits += t.amount;
      } else {
        debits += Math.abs(t.amount);
      }
    });
    return { credits, debits };
  }
}
