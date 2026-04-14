import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

@Component({
  selector: 'app-services',
  templateUrl: './services.html',
  styleUrl: './services.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Services {
  services = signal([
    {
      icon: '💳',
      title: 'Personal Banking',
      description: 'Savings accounts, current accounts, and personalized banking solutions tailored to your needs.',
      benefits: ['0% Maintenance Fees', 'Instant Transfers', '24/7 Support']
    },
    {
      icon: '🏢',
      title: 'Business Banking',
      description: 'Corporate accounts, merchant services, and business loans to help your business thrive.',
      benefits: ['Dedicated Manager', 'Bulk Transactions', 'Business Analytics']
    },
    {
      icon: '📈',
      title: 'Investments',
      description: 'Fixed deposits, mutual funds, and portfolio management for smart wealth growth.',
      benefits: ['Expert Advisory', 'Real-time Tracking', 'Flexible Options']
    },
    {
      icon: '🏦',
      title: 'Loans',
      description: 'Personal loans, home loans, and auto loans with competitive rates and flexible tenure.',
      benefits: ['Low Interest Rates', 'Quick Approval', 'Easy Documentation']
    },
    {
      icon: '🛡️',
      title: 'Insurance',
      description: 'Life insurance, health insurance, and general insurance products for complete protection.',
      benefits: ['Comprehensive Coverage', 'Claim Support', 'Multiple Plans']
    },
    {
      icon: '💳',
      title: 'Cards',
      description: 'Credit cards, debit cards, and prepaid cards with exciting rewards and benefits.',
      benefits: ['Cashback Offers', 'Travel Perks', 'Purchase Protection']
    }
  ]);

  accountTypes = signal([
    {
      name: 'Basic Savings',
      interest: '3.5% p.a.',
      features: ['₹50,000 Max Balance', 'Free Debit Card', 'Mobile Banking']
    },
    {
      name: 'Premium Savings',
      interest: '4.5% p.a.',
      features: ['₹5,00,000 Max Balance', 'Premium Debit Card', 'Priority Support', 'Free Transfers']
    },
    {
      name: 'Business Account',
      interest: '4.0% p.a.',
      features: ['Unlimited Transactions', 'Multi-user Access', 'API Banking', 'Dedicated Support']
    }
  ]);

  whyChooseUs = signal([
    'Award-winning mobile banking app',
    'Biometric security for all transactions',
    'Instant account opening in 5 minutes',
    'Zero hidden charges',
    'PAN India ATM network',
    'FD rates up to 7.5% p.a.'
  ]);
}
