import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card" [class.clickable]="clickable()" (click)="onCardClick()">
      @if (title()) {
        <div class="card-header">
          <h3>{{ title() }}</h3>
          @if (subtitle()) {
            <span class="subtitle">{{ subtitle() }}</span>
          }
        </div>
      }
      <div class="card-content">
        <ng-content></ng-content>
      </div>
      @if (footer()) {
        <div class="card-footer">
          <ng-content select="[slot=footer]"></ng-content>
        </div>
      }
    </div>
  `,
  styles: [`
    .card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: all 0.2s ease;
      
      &.clickable {
        cursor: pointer;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }
      }
    }
    
    .card-header {
      margin-bottom: 1rem;
      
      h3 {
        margin: 0;
        color: #1a237e;
        font-size: 1.1rem;
      }
      
      .subtitle {
        font-size: 0.85rem;
        color: #666;
      }
    }
    
    .card-content {
      color: #333;
    }
    
    .card-footer {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #eee;
    }
  `]
})
export class CardComponent {
  title = input<string>();
  subtitle = input<string>();
  footer = input<boolean>(false);
  clickable = input<boolean>(false);
  clicked = output<void>();

  onCardClick(): void {
    if (this.clickable()) {
      this.clicked.emit();
    }
  }
}
