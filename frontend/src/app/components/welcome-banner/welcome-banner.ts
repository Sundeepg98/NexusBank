import { Component, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-welcome-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './welcome-banner.html',
  styleUrl: './welcome-banner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeIn', [
      state('void', style({ opacity: 0 })),
      state('*', style({ opacity: 1 })),
      transition(':enter', [
        animate('300ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class WelcomeBannerComponent implements OnInit {
  private readonly STORAGE_KEY = 'nexus_welcome_visits';
  private readonly MAX_VISITS = 3;

  visitCount = signal(0);
  dismissed = signal(false);

  isVisible = computed(() => this.visitCount() > 0 && this.visitCount() <= this.MAX_VISITS && !this.dismissed());

  tips = [
    { icon: '👤', text: 'Add a beneficiary' },
    { icon: '💸', text: 'Make your first transfer' },
    { icon: '✨', text: 'Explore features' }
  ];

  ngOnInit(): void {
    this.incrementVisits();
  }

  private incrementVisits(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    const count = stored ? parseInt(stored, 10) : 0;
    this.visitCount.set(count + 1);
    localStorage.setItem(this.STORAGE_KEY, String(this.visitCount()));
  }

  dismiss(): void {
    this.dismissed.set(true);
  }

  getStarted(): void {
    this.dismissed.set(true);
  }
}
