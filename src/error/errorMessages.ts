export const getHttpErrorMessage = (status?: number) => {
  switch (status) {
    case 400:
      return 'The request could not be processed.';
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 408:
      return 'The request timed out. Please try again.';
    case 422:
      return 'Some submitted values are invalid.';
    case 429:
      return 'Too many requests. Please wait and try again.';
    case 500:
    case 502:
    case 503:
      return 'The server is temporarily unavailable.';
    default:
      return 'Something went wrong. Please try again.';
  }
};
