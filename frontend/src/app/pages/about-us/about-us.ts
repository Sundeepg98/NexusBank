import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about-us',
  imports: [RouterLink],
  templateUrl: './about-us.html',
  styleUrl: './about-us.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutUs {
  currentYear = signal(new Date().getFullYear());

  teamMembers = signal([
    { name: 'Sarah Johnson', role: 'Chief Executive Officer', image: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=1a237e&color=fff' },
    { name: 'Michael Chen', role: 'Chief Technology Officer', image: 'https://ui-avatars.com/api/?name=Michael+Chen&background=3949ab&color=fff' },
    { name: 'Emily Rodriguez', role: 'Chief Financial Officer', image: 'https://ui-avatars.com/api/?name=Emily+Rodriguez&background=5c6bc0&color=fff' },
    { name: 'David Kim', role: 'Head of Operations', image: 'https://ui-avatars.com/api/?name=David+Kim&background=7986cb&color=fff' }
  ]);

  stats = signal([
    { value: '2M+', label: 'Happy Customers' },
    { value: '50+', label: 'Years of Trust' },
    { value: '99.9%', label: 'Uptime' },
    { value: '24/7', label: 'Customer Support' }
  ]);
}
