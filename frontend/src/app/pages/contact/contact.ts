import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  imports: [FormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Contact {
  name = signal('');
  email = signal('');
  message = signal('');
  submitted = signal(false);

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

  submitForm() {
    if (this.isFormValid()) {
      this.submitted.set(true);
      this.name.set('');
      this.email.set('');
      this.message.set('');
      setTimeout(() => this.submitted.set(false), 3000);
    }
  }

  clearForm() {
    this.name.set('');
    this.email.set('');
    this.message.set('');
    this.submitted.set(false);
  }
}
