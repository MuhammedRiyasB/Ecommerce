export interface CardFieldState {
  empty: boolean;
  complete: boolean;
  errorCode: string | null;
  errorMessage: string | null;
}

export const initialCardFieldState: CardFieldState = {
  empty: true,
  complete: false,
  errorCode: null,
  errorMessage: null,
};

/** Maps Stripe card field state to a user-facing validation message. */
export const getCardValidationMessage = (card: CardFieldState): string | null => {
  if (card.empty) {
    return 'Please enter your card number.';
  }

  if (card.errorCode === 'invalid_number' || card.errorCode === 'incorrect_number') {
    return 'The card number you entered is invalid. Please check and try again.';
  }

  if (card.errorCode === 'incomplete_number') {
    return 'Your card number is incomplete. Please enter the full card number.';
  }

  if (card.errorMessage) {
    const lower = card.errorMessage.toLowerCase();
    if (lower.includes('invalid') && lower.includes('card number')) {
      return 'The card number you entered is invalid. Please check and try again.';
    }
    if (lower.includes('incomplete') && lower.includes('card number')) {
      return 'Your card number is incomplete. Please enter the full card number.';
    }
    return card.errorMessage;
  }

  if (!card.complete) {
    return 'Your card number is incomplete. Please enter the full card number, expiry, and CVC.';
  }

  return null;
};
