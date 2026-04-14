import { CurrencyPipe } from './currency.pipe';
import { DateFormatPipe } from './date-format.pipe';

describe('CurrencyPipe', () => {
  let pipe: CurrencyPipe;

  beforeEach(() => {
    pipe = new CurrencyPipe();
  });

  it('should format number to USD currency', () => {
    expect(pipe.transform(1000)).toBe('$1,000.00');
  });

  it('should format decimal numbers', () => {
    expect(pipe.transform(99.99)).toBe('$99.99');
  });

  it('should handle null value', () => {
    expect(pipe.transform(null as any)).toBe('$0.00');
  });

  it('should handle undefined value', () => {
    expect(pipe.transform(undefined as any)).toBe('$0.00');
  });

  it('should handle zero', () => {
    expect(pipe.transform(0)).toBe('$0.00');
  });

  it('should format negative numbers', () => {
    expect(pipe.transform(-500)).toBe('-$500.00');
  });

  it('should format large numbers with commas', () => {
    expect(pipe.transform(1000000)).toBe('$1,000,000.00');
  });
});

describe('DateFormatPipe', () => {
  let pipe: DateFormatPipe;

  beforeEach(() => {
    pipe = new DateFormatPipe();
  });

  it('should format date to long format by default', () => {
    const result = pipe.transform('2024-01-15T10:30:00');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('should format date to short format', () => {
    const result = pipe.transform('2024-01-15T10:30:00', 'short');
    expect(result).toContain('1');
    expect(result).toContain('15');
    expect(result).toContain('24');
  });

  it('should format date to time only', () => {
    const result = pipe.transform('2024-01-15T14:30:00', 'time');
    expect(result).toContain('2');
    expect(result).toContain('30');
  });

  it('should handle null value', () => {
    expect(pipe.transform(null as any)).toBe('N/A');
  });

  it('should handle undefined value', () => {
    expect(pipe.transform(undefined as any)).toBe('N/A');
  });

  it('should handle invalid date', () => {
    expect(pipe.transform('invalid-date')).toBe('Invalid Date');
  });

  it('should handle Date object', () => {
    const date = new Date('2024-06-20T12:00:00');
    const result = pipe.transform(date);
    expect(result).toContain('Jun');
    expect(result).toContain('20');
  });
});
