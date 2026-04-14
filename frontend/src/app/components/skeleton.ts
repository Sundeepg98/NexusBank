import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (type() === 'card') {
      <div class="skeleton-card">
        <div class="skeleton-line" style="width: 60%; height: 20px;"></div>
        <div class="skeleton-line" style="width: 100%; height: 14px;"></div>
        <div class="skeleton-line" style="width: 40%; height: 32px; margin-top: 8px;"></div>
      </div>
    } @else if (type() === 'text') {
      <div class="skeleton-text">
        @for (line of lines(); track $index) {
          <div class="skeleton-line" [style.width]="getLineWidth($index)"></div>
        }
      </div>
    } @else if (type() === 'avatar') {
      <div class="skeleton-avatar" [style.width.px]="size()" [style.height.px]="size()"></div>
    } @else {
      <div class="skeleton-line" [style.width]="width()" [style.height.px]="height()"></div>
    }
  `,
  styles: [`
    @keyframes shimmer {
      0% {
        background-position: -200px 0;
      }
      100% {
        background-position: calc(200px + 100%) 0;
      }
    }
    
    .skeleton-line,
    .skeleton-card,
    .skeleton-text,
    .skeleton-avatar {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200px 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }
    
    .skeleton-card {
      padding: 1.5rem;
      border-radius: 12px;
    }
    
    .skeleton-text {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .skeleton-avatar {
      border-radius: 50%;
    }
  `]
})
export class SkeletonComponent {
  type = input<'card' | 'text' | 'avatar' | 'line'>('line');
  width = input<string>('100%');
  height = input<number>(20);
  size = input<number>(40);
  count = input<number>(3);

  lines(): number[] {
    return Array(this.count()).fill(0);
  }

  getLineWidth(index: number): string {
    const widths = ['100%', '85%', '70%', '90%', '60%'];
    return widths[index % widths.length];
  }
}
