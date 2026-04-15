import { Component, OnInit, OnDestroy, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { BeneficiariesService, Beneficiary, AddBeneficiaryRequest } from '../../services/beneficiaries.service';
import { ToastComponent } from '../../components/toast';
import { LoadingComponent } from '../../components/loading';

@Component({
  selector: 'app-beneficiaries',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent, LoadingComponent],
  templateUrl: './beneficiaries.html',
  styleUrl: './beneficiaries.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Beneficiaries implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  beneficiaries = signal<Beneficiary[]>([]);
  loadState = signal<'idle' | 'loading' | 'success' | 'error'>('idle');

  showAddModal = signal(false);
  showEditModal = signal(false);
  showDeleteConfirm = signal(false);

  editingBeneficiary = signal<Beneficiary | null>(null);
  deletingBeneficiary = signal<Beneficiary | null>(null);

  formAccountNumber = signal('');
  formNickname = signal('');
  formBankName = signal('');

  toastMessage = signal('');
  toastType = signal<'success' | 'error' | 'warning'>('success');
  showToast = signal(false);

  isFormValid = signal(false);

  constructor(
    private beneficiariesService: BeneficiariesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBeneficiaries();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBeneficiaries(): void {
    this.loadState.set('loading');
    this.beneficiariesService.getBeneficiaries()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.beneficiaries.set(response.beneficiaries);
          this.loadState.set('success');
        },
        error: () => {
          this.loadState.set('error');
          this.showToastMessage('Failed to load beneficiaries', 'error');
        },
      });
  }

  validateForm(): void {
    const accountNumberValid = /^\d{10,14}$/.test(this.formAccountNumber());
    const nicknameValid = this.formNickname().trim().length > 0;
    const bankNameValid = this.formBankName().trim().length > 0;
    this.isFormValid.set(accountNumberValid && nicknameValid && bankNameValid);
  }

  openAddModal(): void {
    this.formAccountNumber.set('');
    this.formNickname.set('');
    this.formBankName.set('');
    this.isFormValid.set(false);
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
  }

  openEditModal(beneficiary: Beneficiary): void {
    this.editingBeneficiary.set(beneficiary);
    this.formAccountNumber.set(beneficiary.accountNumber);
    this.formNickname.set(beneficiary.nickname);
    this.formBankName.set(beneficiary.bankName);
    this.isFormValid.set(true);
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editingBeneficiary.set(null);
  }

  openDeleteConfirm(beneficiary: Beneficiary): void {
    this.deletingBeneficiary.set(beneficiary);
    this.showDeleteConfirm.set(true);
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm.set(false);
    this.deletingBeneficiary.set(null);
  }

  addBeneficiary(): void {
    if (!this.isFormValid()) return;

    const data: AddBeneficiaryRequest = {
      accountNumber: this.formAccountNumber(),
      nickname: this.formNickname().trim(),
      bankName: this.formBankName().trim(),
    };

    this.beneficiariesService.addBeneficiary(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showToastMessage('Beneficiary added successfully', 'success');
          this.closeAddModal();
          this.loadBeneficiaries();
        },
        error: () => {
          this.showToastMessage('Failed to add beneficiary', 'error');
        },
      });
  }

  updateBeneficiary(): void {
    const beneficiary = this.editingBeneficiary();
    if (!beneficiary || !this.isFormValid()) return;

    const data: Partial<AddBeneficiaryRequest> = {
      nickname: this.formNickname().trim(),
      bankName: this.formBankName().trim(),
    };

    this.beneficiariesService.updateBeneficiary(beneficiary.id, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showToastMessage('Beneficiary updated successfully', 'success');
          this.closeEditModal();
          this.loadBeneficiaries();
        },
        error: () => {
          this.showToastMessage('Failed to update beneficiary', 'error');
        },
      });
  }

  deleteBeneficiary(): void {
    const beneficiary = this.deletingBeneficiary();
    if (!beneficiary) return;

    this.beneficiariesService.deleteBeneficiary(beneficiary.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showToastMessage('Beneficiary deleted successfully', 'success');
          this.closeDeleteConfirm();
          this.loadBeneficiaries();
        },
        error: () => {
          this.showToastMessage('Failed to delete beneficiary', 'error');
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/netbanking']);
  }

  private showToastMessage(message: string, type: 'success' | 'error' | 'warning'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.showToast.set(true);

    setTimeout(() => {
      this.showToast.set(false);
    }, 4000);
  }

  closeToast(): void {
    this.showToast.set(false);
  }
}
