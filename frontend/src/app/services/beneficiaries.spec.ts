import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BeneficiariesService, Beneficiary } from './beneficiaries.service';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

describe('BeneficiariesService', () => {
  let service: BeneficiariesService;
  let httpClient: HttpClient;

  const mockBeneficiaries: Beneficiary[] = [
    { id: '1', name: 'John Doe', accountNumber: '1234567890', bankName: 'Bank A', email: 'john@test.com' },
    { id: '2', name: 'Jane Smith', accountNumber: '0987654321', bankName: 'Bank B' },
  ];

  beforeEach(() => {
    httpClient = {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    } as unknown as HttpClient;
    service = new BeneficiariesService(httpClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get beneficiaries', () => {
    vi.mocked(httpClient.get).mockReturnValue(mockBeneficiaries as any);

    service.getBeneficiaries();

    expect(httpClient.get).toHaveBeenCalled();
    expect(httpClient.get).toHaveBeenCalledWith(expect.stringContaining('/beneficiaries'));
  });

  it('should add beneficiary', () => {
    const newBeneficiary: Beneficiary = {
      id: '3',
      name: 'Bob Wilson',
      accountNumber: '5555555555',
      bankName: 'Bank C',
    };
    vi.mocked(httpClient.post).mockReturnValue(newBeneficiary as any);

    service.addBeneficiary({
      name: 'Bob Wilson',
      accountNumber: '5555555555',
      bankName: 'Bank C',
    });

    expect(httpClient.post).toHaveBeenCalled();
    expect(httpClient.post).toHaveBeenCalledWith(
      expect.stringContaining('/beneficiaries'),
      expect.objectContaining({
        name: 'Bob Wilson',
        accountNumber: '5555555555',
        bankName: 'Bank C',
      })
    );
  });

  it('should delete beneficiary', () => {
    const mockResponse = { message: 'Beneficiary deleted' };
    vi.mocked(httpClient.delete).mockReturnValue(mockResponse as any);

    service.deleteBeneficiary('1');

    expect(httpClient.delete).toHaveBeenCalled();
    expect(httpClient.delete).toHaveBeenCalledWith(expect.stringContaining('/beneficiaries/1'));
  });

  it('should return beneficiaries with correct structure', () => {
    vi.mocked(httpClient.get).mockReturnValue(of(mockBeneficiaries));

    let result: Beneficiary[] = [];
    service.getBeneficiaries().subscribe((data) => {
      result = data;
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('name');
    expect(result[0]).toHaveProperty('accountNumber');
    expect(result[0]).toHaveProperty('bankName');
  });

  it('should add beneficiary with optional email', () => {
    const newBeneficiary: Beneficiary = {
      id: '4',
      name: 'Alice Brown',
      accountNumber: '7777777777',
      bankName: 'Bank D',
      email: 'alice@test.com',
    };
    vi.mocked(httpClient.post).mockReturnValue(newBeneficiary as any);

    service.addBeneficiary({
      name: 'Alice Brown',
      accountNumber: '7777777777',
      bankName: 'Bank D',
      email: 'alice@test.com',
    });

    expect(httpClient.post).toHaveBeenCalledWith(
      expect.stringContaining('/beneficiaries'),
      expect.objectContaining({
        email: 'alice@test.com',
      })
    );
  });

  it('should handle get beneficiaries error', () => {
    const error = new Error('Failed to fetch');
    vi.mocked(httpClient.get).mockReturnValue(of(mockBeneficiaries));

    const result = service.getBeneficiaries();
    expect(result).toBeDefined();
  });
});
