import { describe, it, expect } from 'vitest';
import { CardComponent } from './card';

describe('CardComponent', () => {
  it('should be defined', () => {
    expect(CardComponent).toBeDefined();
  });

  it('should be standalone component', () => {
    expect(CardComponent.ɵcmp).toBeDefined();
  });
});