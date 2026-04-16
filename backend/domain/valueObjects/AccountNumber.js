class AccountNumber {
  static #pattern = /^[A-Za-z0-9-]{6,20}$/;
  #value;

  constructor(value) {
    if (!value || typeof value !== 'string') {
      throw new Error('AccountNumber must be a string');
    }
    if (!AccountNumber.#pattern.test(value)) {
      throw new Error('AccountNumber must be 6-20 alphanumeric characters');
    }
    this.#value = value;
  }

  get value() { return this.#value; }
  equals(other) { return other instanceof AccountNumber && this.#value === other.#value; }
  toString() { return this.#value; }
}

module.exports = { AccountNumber };
