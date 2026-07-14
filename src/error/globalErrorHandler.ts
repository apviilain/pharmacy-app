import { logger } from '../utils/logger';

let hasInstalledGlobalErrorHandler = false;

export const installGlobalErrorHandler = () => {
  if (hasInstalledGlobalErrorHandler) return;
  hasInstalledGlobalErrorHandler = true;

  const errorUtils = (globalThis as any).ErrorUtils as
    | {
        getGlobalHandler?: () => (error: Error, isFatal?: boolean) => void;
        setGlobalHandler?: (
          handler: (error: Error, isFatal?: boolean) => void,
        ) => void;
      }
    | undefined;

  const existingHandler = errorUtils?.getGlobalHandler?.();

  errorUtils?.setGlobalHandler?.((error: Error, isFatal?: boolean) => {
    logger.error('Unhandled JavaScript exception captured', {
      isFatal: Boolean(isFatal),
      message: error?.message,
      stack: error?.stack,
    });

    existingHandler?.(error, isFatal);
  });
};
