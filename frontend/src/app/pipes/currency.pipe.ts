import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyFormat',
  standalone: true
})
export class CurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined, currency: string = 'USD', locale: string = 'en-US'): string {
    if (value === null || value === undefined) {
      return '$0.00';
    }
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
}
