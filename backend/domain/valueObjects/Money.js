class Money {
  #amount;
  #currency;

  constructor(amount, currency = 'INR') {
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      throw new Error('Amount must be a valid finite number');
    }
    this.#amount = Math.round(amount * 100) / 100;
    this.#currency = currency;
  }

  get amount() { return this.#amount; }
  get currency() { return this.#currency; }

  add(other) {
    if (!(other instanceof Money)) throw new Error('Can only add Money');
    if (this.#currency !== other.#currency) throw new Error('Currency mismatch');
    return new Money(this.#amount + other.#amount, this.#currency);
  }

  subtract(other) {
    if (!(other instanceof Money)) throw new Error('Can only subtract Money');
    return new Money(this.#amount - other.#amount, this.#currency);
  }

  isGreaterThanOrEqual(other) {
    return this.#amount >= other.#amount;
  }

  toNumber() { return this.#amount; }

  static fromNumber(amount, currency = 'INR') {
    return new Money(amount, currency);
  }
}

module.exports = { Money };
