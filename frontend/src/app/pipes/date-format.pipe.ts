import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateFormat',
  standalone: true
})
export class DateFormatPipe implements PipeTransform {
  transform(
    value: string | Date | null | undefined,
    format: 'short' | 'long' | 'time' | 'full' = 'long'
  ): string {
    if (!value) {
      return 'N/A';
    }

    const date = value instanceof Date ? value : new Date(value);

    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    const optionsMap: Record<'short' | 'long' | 'time' | 'full', Intl.DateTimeFormatOptions> = {
      short: { month: 'numeric', day: 'numeric', year: '2-digit' },
      long: { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' },
      time: { hour: '2-digit', minute: '2-digit' },
      full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    };
    const options = optionsMap[format];

    return date.toLocaleDateString('en-US', options);
  }
}
