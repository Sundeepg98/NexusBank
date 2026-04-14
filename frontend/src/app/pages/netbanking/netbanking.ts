import { Component, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Subject, takeUntil } from 'rxjs';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';
import { Account, Transaction, LoadingState } from '../../models';
import { ToastComponent } from '../../components/toast';
import { LoadingComponent } from '../../components/loading';
import { CardComponent } from '../../components/card';
import { CurrencyPipe } from '../../pipes/currency.pipe';
import { DateFormatPipe } from '../../pipes/date-format.pipe';

@Component({
  selector: 'app-netbanking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastComponent, LoadingComponent, CardComponent, CurrencyPipe, DateFormatPipe],
  templateUrl: './netbanking.html',
  styleUrl: './netbanking.scss',
  animations: [
    trigger('fadeIn', [
      state('void', style({ opacity: 0, transform: 'translateY(-10px)' })),
      state('*', style({ opacity: 1, transform: 'translateY(0)' })),
      transition(':enter', [
        animate('300ms ease-out')
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class Netbanking implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('accountList') accountList!: ElementRef<HTMLDivElement>;
  
  // Example of @ViewChild usage - accessing child component
  @ViewChild(CardComponent) cardComponent!: CardComponent;
  
  private destroy$ = new Subject<void>();
  private sessionCheckInterval: any;

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

  // OTP state
  showOTPInput = signal(false);
  otpId = signal('');
  otpValue = signal('');
  otpState = signal<LoadingState>('idle');

  // Forms
  transferForm!: FormGroup;
  batchTransferForm!: FormGroup;
  selectedAccount = signal<Account | null>(null);
  selectedTransaction = signal<Transaction | null>(null);
  showBatchTransfer = signal(false);

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
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initTransferForm();
  }

  ngAfterViewInit(): void {
  }

  ngOnInit(): void {
    const resolvedAccounts = this.route.snapshot.data['accounts'];
    if (resolvedAccounts && resolvedAccounts.length > 0) {
      this.accounts.set(resolvedAccounts);
      this.selectedAccount.set(resolvedAccounts[0]);
      this.loadState.set('success');
      if (resolvedAccounts.length > 0) {
        this.transferForm.patchValue({ fromAccountId: resolvedAccounts[0].id });
      }
    } else {
      this.loadAccounts();
    }

    this.sessionCheckInterval = setInterval(() => {
      if (!this.authService.checkSession()) {
        this.router.navigate(['/welcome']);
      }
    }, 60000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }
  }

  @HostListener('document:mousemove')
  @HostListener('document:keydown')
  onActivity(): void {
    this.authService.updateActivity();
  }

  downloadStatement(): void {
    const accountId = this.selectedAccount()?.id;
    if (!accountId) return;
    window.open(`/api/accounts/${accountId}/statement?format=csv`, '_blank');
  }

  private initTransferForm(): void {
    this.transferForm = this.fb.group({
      fromAccountId: ['', Validators.required],
      toAccountNumber: ['', [Validators.required, Validators.pattern(/^\d{10,14}$/)]],
      amount: [null, [Validators.required, Validators.min(1), Validators.max(1000000)]],
      description: [''],
    });

    this.initBatchTransferForm();
  }

  private initBatchTransferForm(): void {
    this.batchTransferForm = this.fb.group({
      fromAccountId: ['', Validators.required],
      recipients: this.fb.array([this.createRecipientGroup()])
    });
  }

  private createRecipientGroup(): import('@angular/forms').AbstractControl {
    return this.fb.group({
      toAccountNumber: ['', [Validators.required, Validators.pattern(/^\d{10,14}$/)]],
      amount: [null, [Validators.required, Validators.min(1), Validators.max(1000000)]],
      description: [''],
    });
  }

  get recipients(): FormArray {
    return this.batchTransferForm.get('recipients') as FormArray;
  }

  addRecipient(): void {
    this.recipients.push(this.createRecipientGroup());
  }

  removeRecipient(index: number): void {
    if (this.recipients.length > 1) {
      this.recipients.removeAt(index);
    }
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
    this.showBatchTransfer.set(false);
  }

  toggleBatchTransfer(): void {
    this.showBatchTransfer.set(!this.showBatchTransfer());
  }

  onBatchTransfer(): void {
    if (this.batchTransferForm.invalid) {
      this.batchTransferForm.markAllAsTouched();
      return;
    }

    this.transferState.set('loading');
    const formValue = this.batchTransferForm.value;
    const recipientArray = formValue.recipients as { toAccountNumber: string; amount: number; description: string }[];

    let completed = 0;
    let hasError = false;

    recipientArray.forEach((recipient) => {
      this.apiService.transfer({
        fromAccountId: formValue.fromAccountId,
        toAccountNumber: recipient.toAccountNumber,
        amount: recipient.amount,
        description: recipient.description || 'Batch Transfer',
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          completed++;
          if (completed === recipientArray.length && !hasError) {
            this.transferState.set('success');
            this.showToastMessage(`Successfully transferred to ${completed} recipients!`, 'success');
            this.initBatchTransferForm();
            this.loadAccounts();
            this.showBatchTransfer.set(false);
          }
        },
        error: (err: Error) => {
          hasError = true;
          this.transferState.set('error');
          this.showToastMessage(err.message || 'Batch transfer failed', 'error');
        },
      });
    });
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

    if (!this.showOTPInput()) {
      this.apiService.generateOTP({
        fromAccountId: formValue.fromAccountId,
        toAccountNumber: formValue.toAccountNumber,
        amount: formValue.amount,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.transferState.set('success');
          this.otpId.set(response.otpId);
          this.showOTPInput.set(true);
          this.showToastMessage(`OTP sent! For demo, your OTP is: ${response.otp}`, 'success');
        },
        error: (err: Error) => {
          this.transferState.set('error');
          this.showToastMessage(err.message || 'Failed to generate OTP', 'error');
        },
      });
    } else {
      if (!this.otpValue() || this.otpValue().length !== 6) {
        this.showToastMessage('Please enter a valid 6-digit OTP', 'error');
        return;
      }

      this.otpState.set('loading');
      this.apiService.verifyOTP({
        otpId: this.otpId(),
        otp: this.otpValue(),
        fromAccountId: formValue.fromAccountId,
        toAccountNumber: formValue.toAccountNumber,
        amount: formValue.amount,
        description: formValue.description || 'Transfer',
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.otpState.set('success');
          this.showToastMessage('Transfer successful!', 'success');
          this.resetTransferState();
          this.loadAccounts();
          this.showTransfer.set(false);
        },
        error: (err: Error) => {
          this.otpState.set('error');
          this.showToastMessage(err.message || 'Transfer failed', 'error');
        },
      });
    }
  }

  resetTransferState(): void {
    this.transferForm.reset();
    this.showOTPInput.set(false);
    this.otpId.set('');
    this.otpValue.set('');
    this.transferState.set('idle');
  }

  selectAccount(account: Account): void {
    this.selectedAccount.set(account);
    this.transferForm.patchValue({ fromAccountId: account.id });
  }

  profile(): void {
    this.router.navigate(['/profile']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/welcome']);
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

  viewTransactionDetail(txn: Transaction): void {
    this.selectedTransaction.set(txn);
  }

  closeTransactionDetail(): void {
    this.selectedTransaction.set(null);
  }
}
