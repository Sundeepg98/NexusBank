import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileService, ProfileResponse, User, Account } from './profile.service';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

describe('ProfileService', () => {
  let service: ProfileService;
  let httpClient: HttpClient;

  const mockUser: User = {
    id: '123',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    phone: '1234567890',
    createdAt: '2024-01-01T00:00:00Z',
  };

  const mockAccounts: Account[] = [
    { id: 'acc1', accountNumber: '1234567890', accountType: 'SAVINGS', balance: 5000, createdAt: '2024-01-01T00:00:00Z' },
    { id: 'acc2', accountNumber: '0987654321', accountType: 'CURRENT', balance: 10000, createdAt: '2024-01-02T00:00:00Z' },
  ];

  beforeEach(() => {
    httpClient = {
      get: vi.fn(),
      put: vi.fn(),
      post: vi.fn(),
    } as unknown as HttpClient;
    service = new ProfileService(httpClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch profile', () => {
    const mockResponse: ProfileResponse = { user: mockUser, accounts: mockAccounts };
    vi.mocked(httpClient.get).mockReturnValue(mockResponse as any);

    service.getProfile();

    expect(httpClient.get).toHaveBeenCalled();
    expect(httpClient.get).toHaveBeenCalledWith(expect.stringContaining('/auth/profile'));
  });

  it('should return user and accounts on profile fetch', () => {
    const mockResponse: ProfileResponse = { user: mockUser, accounts: mockAccounts };
    vi.mocked(httpClient.get).mockReturnValue(of(mockResponse));

    let result: ProfileResponse = { user: mockUser, accounts: mockAccounts };
    service.getProfile().subscribe((data) => {
      result = data;
    });

    expect(result.user.id).toBe('123');
    expect(result.accounts).toHaveLength(2);
  });

  it('should update profile', () => {
    const updatedUser = { ...mockUser, firstName: 'Updated', lastName: 'Name' };
    vi.mocked(httpClient.put).mockReturnValue(updatedUser as any);

    service.updateProfile({ firstName: 'Updated', lastName: 'Name' });

    expect(httpClient.put).toHaveBeenCalled();
    expect(httpClient.put).toHaveBeenCalledWith(
      expect.stringContaining('/auth/profile'),
      expect.objectContaining({
        firstName: 'Updated',
        lastName: 'Name',
      })
    );
  });

  it('should update profile with phone', () => {
    const updatedUser = { ...mockUser, phone: '9876543210' };
    vi.mocked(httpClient.put).mockReturnValue(updatedUser as any);

    service.updateProfile({ phone: '9876543210' });

    expect(httpClient.put).toHaveBeenCalledWith(
      expect.stringContaining('/auth/profile'),
      expect.objectContaining({
        phone: '9876543210',
      })
    );
  });

  it('should change password', () => {
    const mockResponse = { message: 'Password changed successfully' };
    vi.mocked(httpClient.post).mockReturnValue(mockResponse as any);

    service.changePassword({
      currentPassword: 'oldPassword123',
      newPassword: 'newPassword456',
    });

    expect(httpClient.post).toHaveBeenCalled();
    expect(httpClient.post).toHaveBeenCalledWith(
      expect.stringContaining('/auth/change-password'),
      expect.objectContaining({
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
      })
    );
  });

  it('should handle profile fetch with no accounts', () => {
    const mockResponse: ProfileResponse = { user: mockUser, accounts: [] };
    vi.mocked(httpClient.get).mockReturnValue(of(mockResponse));

    let result: ProfileResponse | null = null;
    service.getProfile().subscribe((data) => {
      result = data;
    });

    expect(result?.accounts).toHaveLength(0);
  });

  it('should handle partial profile update', () => {
    const updatedUser = { ...mockUser, firstName: 'NewFirstName' };
    vi.mocked(httpClient.put).mockReturnValue(updatedUser as any);

    service.updateProfile({ firstName: 'NewFirstName' });

    expect(httpClient.put).toHaveBeenCalledWith(
      expect.stringContaining('/auth/profile'),
      expect.objectContaining({
        firstName: 'NewFirstName',
      })
    );
    expect(httpClient.put).toHaveBeenCalledTimes(1);
  });

  it('should include all required fields in change password request', () => {
    const mockResponse = { message: 'Success' };
    vi.mocked(httpClient.post).mockReturnValue(mockResponse as any);

    service.changePassword({
      currentPassword: 'current',
      newPassword: 'new',
    });

    const callArgs = vi.mocked(httpClient.post).mock.calls[0];
    const requestBody = callArgs[1] as { currentPassword: string; newPassword: string };
    
    expect(requestBody).toHaveProperty('currentPassword');
    expect(requestBody).toHaveProperty('newPassword');
  });
});
