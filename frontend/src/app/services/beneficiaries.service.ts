import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Beneficiary {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
  email?: string;
}

export interface AddBeneficiaryRequest {
  name: string;
  accountNumber: string;
  bankName: string;
  email?: string;
}

@Injectable({
  providedIn: 'root',
})
export class BeneficiariesService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getBeneficiaries(): Observable<Beneficiary[]> {
    return this.http.get<Beneficiary[]>(`${this.baseUrl}/beneficiaries`);
  }

  addBeneficiary(data: AddBeneficiaryRequest): Observable<Beneficiary> {
    return this.http.post<Beneficiary>(`${this.baseUrl}/beneficiaries`, data);
  }

  deleteBeneficiary(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/beneficiaries/${id}`);
  }
}
