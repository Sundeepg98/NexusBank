import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastComponent } from '../../components/toast';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contact',
  imports: [FormsModule, ToastComponent],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Contact {
  name = signal('');
  email = signal('');
  message = signal('');
  submitted = signal(false);
  submitting = signal(false);

  toastMessage = signal('');
  toastType = signal<'success' | 'error' | 'warning'>('success');
  showToast = signal(false);

  emailValid = computed(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email());
  });

  isFormValid = computed(() =>
    this.name().trim().length > 0 &&
    this.email().trim().length > 0 &&
    this.emailValid() &&
    this.message().trim().length > 0
  );

  constructor(private http: HttpClient) {}

  submitForm() {
    if (this.isFormValid() || this.submitting()) return;

    this.submitting.set(true);
    const payload = {
      name: this.name().trim(),
      email: this.email().trim(),
      message: this.message().trim()
    };

    this.http.post<{ message: string }>(`${environment.apiUrl}/contact`, payload)
      .subscribe({
        next: (response) => {
          this.submitting.set(false);
          this.showToastMessage('Message sent successfully! We will get back to you within 24 hours.', 'success');
          this.submitted.set(true);
          this.name.set('');
          this.email.set('');
          this.message.set('');
          setTimeout(() => this.submitted.set(false), 5000);
        },
        error: (err) => {
          this.submitting.set(false);
          const errorMessage = err.error?.error || 'Failed to send message. Please try again.';
          this.showToastMessage(errorMessage, 'error');
        }
      });
  }

  clearForm() {
    this.name.set('');
    this.email.set('');
    this.message.set('');
    this.submitted.set(false);
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
}
