import { describe, expect, it } from 'vitest';
import { getCardValidationMessage } from './paymentCardValidation';

describe('getCardValidationMessage', () => {
  it('requires card input when empty', () => {
    expect(
      getCardValidationMessage({
        empty: true,
        complete: false,
        errorCode: null,
        errorMessage: null,
      })
    ).toBe('Please enter your card number.');
  });

  it('maps invalid card number codes', () => {
    expect(
      getCardValidationMessage({
        empty: false,
        complete: false,
        errorCode: 'invalid_number',
        errorMessage: null,
      })
    ).toBe('The card number you entered is invalid. Please check and try again.');
  });

  it('maps incomplete card number codes', () => {
    expect(
      getCardValidationMessage({
        empty: false,
        complete: false,
        errorCode: 'incomplete_number',
        errorMessage: null,
      })
    ).toBe('Your card number is incomplete. Please enter the full card number.');
  });

  it('returns null when card details are complete', () => {
    expect(
      getCardValidationMessage({
        empty: false,
        complete: true,
        errorCode: null,
        errorMessage: null,
      })
    ).toBeNull();
  });
});
