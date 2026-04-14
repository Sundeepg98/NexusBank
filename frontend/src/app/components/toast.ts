import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (show()) {
      <div class="toast" [class]="type()" [@slideIn]>
        <span class="message">{{ message() }}</span>
        <button class="close" (click)="onClose()">&times;</button>
      </div>
    }
  `,
  styles: [`
    .toast {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      max-width: 400px;
    }
    
    .toast.success {
      background: #4caf50;
      color: white;
    }
    
    .toast.error {
      background: #f44336;
      color: white;
    }
    
    .toast.warning {
      background: #ff9800;
      color: white;
    }
    
    .message {
      flex: 1;
    }
    
    .close {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }
  `]
})
export class ToastComponent {
  message = input<string>('');
  type = input<'success' | 'error' | 'warning'>('success');
  show = input<boolean>(false);
  closed = output<void>();

  onClose(): void {
    this.closed.emit();
  }
}
