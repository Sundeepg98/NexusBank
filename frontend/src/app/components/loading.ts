import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (show()) {
      <div class="loading-overlay">
        <div class="spinner" [style.width.px]="size()" [style.height.px]="size()"></div>
        @if (message()) {
          <span class="message">{{ message() }}</span>
        }
      </div>
    }
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9998;
    }
    
    .spinner {
      border: 4px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .message {
      color: white;
      margin-top: 16px;
      font-size: 14px;
    }
  `]
})
export class LoadingComponent {
  show = input<boolean>(false);
  size = input<number>(50);
  message = input<string>('');
}
