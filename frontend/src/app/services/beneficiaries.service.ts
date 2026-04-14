import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Beneficiary {
  id: string;
  accountNumber: string;
  nickname: string;
  bankName: string;
  createdAt?: string;
}

export interface AddBeneficiaryRequest {
  accountNumber: string;
  nickname: string;
  bankName: string;
}

@Injectable({
  providedIn: 'root',
})
export class BeneficiariesService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getBeneficiaries(): Observable<{ beneficiaries: Beneficiary[] }> {
    return this.http.get<{ beneficiaries: Beneficiary[] }>(`${this.baseUrl}/beneficiaries`);
  }

  addBeneficiary(data: AddBeneficiaryRequest): Observable<{ message: string; beneficiary: Beneficiary }> {
    return this.http.post<{ message: string; beneficiary: Beneficiary }>(`${this.baseUrl}/beneficiaries`, data);
  }

  updateBeneficiary(id: string, data: Partial<AddBeneficiaryRequest>): Observable<{ message: string; beneficiary: Beneficiary }> {
    return this.http.put<{ message: string; beneficiary: Beneficiary }>(`${this.baseUrl}/beneficiaries/${id}`, data);
  }

  deleteBeneficiary(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/beneficiaries/${id}`);
  }
}
