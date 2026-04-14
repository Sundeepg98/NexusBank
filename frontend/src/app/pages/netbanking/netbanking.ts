import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';
import { Account, Transaction, LoadingState } from '../../models';
import { ToastComponent } from '../../components/toast';
import { LoadingComponent } from '../../components/loading';

@Component({
  selector: 'app-netbanking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastComponent, LoadingComponent],
  templateUrl: './netbanking.html',
  styleUrl: './netbanking.scss'
})
export class Netbanking implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // State signals
  accounts = signal<Account[]>([]);
  transactions = signal<Transaction[]>([]);
  loadState = signal<LoadingState>('idle');
  transferState = signal<LoadingState>('idle');
  
  // UI state
  showAccounts = signal(false);
  showTransfer = signal(false);
  showTransactions = signal(false);
  showCreateAccount = signal(false);
  toastMessage = signal('');
  toastType = signal<'success' | 'error' | 'warning'>('success');
  showToast = signal(false);
  creatingAccount = signal(false);
  selectedAccountType = signal<'SAVINGS' | 'CURRENT' | 'FIXED'>('SAVINGS');
  initialDeposit = signal<number>(0);

  // Forms
  transferForm!: FormGroup;
  selectedAccount = signal<Account | null>(null);
  selectedTransaction = signal<Transaction | null>(null);

  // User info
  user = computed(() => this.authService.user());
  userName = computed(() => {
    const u = this.user();
    return u ? `${u.firstName} ${u.lastName}` : 'User';
  });

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {
    this.initTransferForm();
  }

  ngOnInit(): void {
    this.loadAccounts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initTransferForm(): void {
    this.transferForm = this.fb.group({
      fromAccountId: ['', Validators.required],
      toAccountNumber: ['', [Validators.required, Validators.pattern(/^\d{10,14}$/)]],
      amount: [null, [Validators.required, Validators.min(1), Validators.max(1000000)]],
      description: [''],
    });
  }

  loadAccounts(): void {
    this.loadState.set('loading');
    this.apiService.getAccounts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (accounts: Account[]) => {
          this.accounts.set(accounts);
          this.loadState.set('success');
          if (accounts.length > 0) {
            this.selectedAccount.set(accounts[0]);
            this.transferForm.patchValue({ fromAccountId: accounts[0].id });
          }
        },
        error: (err: Error) => {
          this.loadState.set('error');
          this.showToastMessage(err.message || 'Failed to load accounts', 'error');
        },
      });
  }

  viewAccounts(): void {
    this.showAccounts.set(!this.showAccounts());
    this.showTransfer.set(false);
    this.showTransactions.set(false);
    this.showCreateAccount.set(false);
  }

  openCreateAccount(): void {
    this.showCreateAccount.set(true);
    this.showAccounts.set(false);
    this.showTransfer.set(false);
    this.showTransactions.set(false);
  }

  closeCreateAccount(): void {
    this.showCreateAccount.set(false);
  }

  createAccount(): void {
    this.creatingAccount.set(true);
    this.apiService.createAccount(this.selectedAccountType(), this.initialDeposit())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.creatingAccount.set(false);
          this.showToastMessage(response.message, 'success');
          this.showCreateAccount.set(false);
          this.loadAccounts();
        },
        error: (err: Error) => {
          this.creatingAccount.set(false);
          this.showToastMessage(err.message || 'Failed to create account', 'error');
        },
      });
  }

  transferFunds(): void {
    this.showTransfer.set(!this.showTransfer());
    this.showAccounts.set(false);
    this.showTransactions.set(false);
  }

  viewTransactions(): void {
    this.showTransactions.set(!this.showTransactions());
    this.showAccounts.set(false);
    this.showTransfer.set(false);
    
    if (this.showTransactions()) {
      const account = this.selectedAccount();
      if (account) {
        this.loadState.set('loading');
        this.apiService.getTransactions(account.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (txns: Transaction[]) => {
              this.transactions.set(txns);
              this.loadState.set('success');
            },
        error: (err: Error) => {
              this.loadState.set('error');
              this.showToastMessage(err.message || 'Failed to load transactions', 'error');
            },
          });
      }
    }
  }

  onTransfer(): void {
    if (this.transferForm.invalid) {
      this.transferForm.markAllAsTouched();
      return;
    }

    this.transferState.set('loading');
    const formValue = this.transferForm.value;

    this.apiService.transfer({
      fromAccountId: formValue.fromAccountId,
      toAccountNumber: formValue.toAccountNumber,
      amount: formValue.amount,
      description: formValue.description || 'Transfer',
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.transferState.set('success');
        this.showToastMessage('Transfer successful!', 'success');
        this.transferForm.reset();
        this.loadAccounts();
        this.showTransfer.set(false);
      },
      error: (err: Error) => {
        this.transferState.set('error');
        this.showToastMessage(err.message || 'Transfer failed', 'error');
      },
    });
  }

  selectAccount(account: Account): void {
    this.selectedAccount.set(account);
    this.transferForm.patchValue({ fromAccountId: account.id });
  }

  profile(): void {
    const u = this.user();
    this.showToastMessage(`Profile: ${u?.email || 'Not available'}`, 'success');
  }

  logout(): void {
    this.authService.logout();
  }

  private showToastMessage(message: string, type: 'success' | 'error' | 'warning'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.showToast.set(true);
    
    setTimeout(() => {
      this.showToast.set(false);
    }, 5000);
  }

  closeToast(): void {
    this.showToast.set(false);
  }

  hasError(field: string, errorCode: string): boolean {
    const control = this.transferForm.get(field);
    return !!(control?.touched && control?.hasError(errorCode));
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  viewTransactionDetail(txn: Transaction): void {
    this.selectedTransaction.set(txn);
  }

  closeTransactionDetail(): void {
    this.selectedTransaction.set(null);
  }
}
