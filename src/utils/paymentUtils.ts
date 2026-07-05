/**
 * Parses Razorpay and API errors into a human-readable string.
 * This prevents raw JSON from being displayed to the user.
 */
export const parsePaymentError = (error: any): string => {
  if (!error) return 'Payment failed. Please try again.';

  console.log('[parsePaymentError] Received error:', JSON.stringify(error, null, 2));

  // 1. Handle common cancellation codes (from Razorpay)
  // code 0: user cancelled, code 2: payment failed/cancelled by user
  if (
    error.code === 'PAYMENT_CANCELLED' || 
    error.code === 0 || 
    error.code === 2 ||
    error.description === 'Payment cancelled' ||
    (error.description && typeof error.description === 'string' && error.description.toLowerCase().includes('cancel'))
  ) {
    return 'Payment was cancelled by the user.';
  }

  // 2. Handle stringified JSON in description (as seen in screenshot)
  if (typeof error.description === 'string' && error.description.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(error.description);
      const innerErr = parsed.error || parsed;
      if (innerErr.description) return innerErr.description;
      if (innerErr.message) return innerErr.message;
    } catch {
      // Ignore parse failure and fall through
    }
  }

  // 3. Handle standard description, message or error core
  if (typeof error === 'string') return error;
  
  if (error.description && typeof error.description === 'string') {
    return error.description;
  }

  // 4. Handle API error responses (tanstack-query/axios)
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.message && typeof error.message === 'string' && !error.message.includes('JSON')) {
    return error.message;
  }

  return 'Payment could not be processed. Please try again.';
};
