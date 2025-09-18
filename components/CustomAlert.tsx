import { Alert, AlertButton } from 'react-native';

export interface CustomAlertProps {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: 'default' | 'plain-text' | 'secure-text' | 'login-password';
}

export const CustomAlert = {
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: { cancelable?: boolean }
  ) => {
    // For now, we'll use the system alert but with enhanced button styling
    // This maintains system behavior while allowing us to enhance the experience
    const styledButtons: AlertButton[] = buttons?.map(button => ({
      ...button,
      style: button.style || 'default',
    })) || [{ text: 'OK', style: 'default' }];

    Alert.alert(title, message, styledButtons, {
      cancelable: options?.cancelable ?? true,
    });
  },

  success: (title: string, message?: string, onPress?: () => void) => {
    Alert.alert(
      title,
      message,
      [
        {
          text: 'OK',
          style: 'default',
          onPress: onPress,
        },
      ],
      { cancelable: false }
    );
  },

  error: (title: string, message?: string, onPress?: () => void) => {
    Alert.alert(
      title,
      message,
      [
        {
          text: 'OK',
          style: 'default',
          onPress: onPress,
        },
      ],
      { cancelable: false }
    );
  },

  confirm: (
    title: string,
    message?: string,
    onConfirm?: () => void,
    onCancel?: () => void
  ) => {
    Alert.alert(
      title,
      message,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: onCancel,
        },
        {
          text: 'OK',
          style: 'default',
          onPress: onConfirm,
        },
      ],
      { cancelable: false }
    );
  },
}; 