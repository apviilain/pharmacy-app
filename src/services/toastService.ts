import Toast from 'react-native-toast-message';

type ToastVariant =
  | 'success'
  | 'error'
  | 'info'
  | 'warning';

const variantToType: Record<ToastVariant, 'success' | 'error' | 'info'> = {
  success: 'success',
  error: 'error',
  info: 'info',
  warning: 'info',
};

export const toastService = {
  show: (variant: ToastVariant, title: string, message?: string) => {
    Toast.show({
      type: variantToType[variant],
      text1: title,
      text2: message,
      props: {
        variant,
      },
    });
  },
  success: (title: string, message?: string) =>
    toastService.show('success', title, message),
  error: (title: string, message?: string) =>
    toastService.show('error', title, message),
  info: (title: string, message?: string) =>
    toastService.show('info', title, message),
  warning: (title: string, message?: string) =>
    toastService.show('warning', title, message),
  hide: () => Toast.hide(),
};
