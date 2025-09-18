import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface StyledAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: 'success' | 'error' | 'info';
  onDismiss?: () => void;
}

let alertInstance: {
  show: (props: Omit<StyledAlertProps, 'visible'>) => void;
} | null = null;

export const StyledAlert: React.FC<StyledAlertProps> = ({
  visible,
  title,
  message,
  buttons = [{ text: 'OK' }],
  type = 'info',
  onDismiss,
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      default:
        return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return '#34C759';
      case 'error':
        return '#FF3B30';
      default:
        return '#007AFF';
    }
  };

  const handleButtonPress = (button: AlertButton) => {
    button.onPress?.();
    onDismiss?.();
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.alertContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <Ionicons name={getIconName()} size={48} color={getIconColor()} />
          </View>

          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  button.style === 'cancel' && styles.cancelButton,
                  button.style === 'destructive' && styles.destructiveButton,
                  buttons.length === 1 && styles.singleButton,
                ]}
                onPress={() => handleButtonPress(button)}
              >
                <Text
                  style={[
                    styles.buttonText,
                    button.style === 'cancel' && styles.cancelButtonText,
                    button.style === 'destructive' && styles.destructiveButtonText,
                  ]}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// Global alert controller
export const Alert = {
  show: (props: Omit<StyledAlertProps, 'visible'>) => {
    alertInstance?.show(props);
  },
  
  success: (title: string, message?: string, onPress?: () => void) => {
    alertInstance?.show({
      title,
      message,
      type: 'success',
      buttons: [{ text: 'OK', onPress }],
    });
  },

  error: (title: string, message?: string, onPress?: () => void) => {
    alertInstance?.show({
      title,
      message,
      type: 'error',
      buttons: [{ text: 'OK', onPress }],
    });
  },

  confirm: (
    title: string,
    message?: string,
    onConfirm?: () => void,
    onCancel?: () => void
  ) => {
    alertInstance?.show({
      title,
      message,
      type: 'info',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: onCancel },
        { text: 'OK', onPress: onConfirm },
      ],
    });
  },
};

// Provider component
export const StyledAlertProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [alertProps, setAlertProps] = useState<StyledAlertProps>({
    visible: false,
    title: '',
  });

  useEffect(() => {
    alertInstance = {
      show: (props) => {
        setAlertProps({ ...props, visible: true });
      },
    };

    return () => {
      alertInstance = null;
    };
  }, []);

  const handleDismiss = () => {
    setAlertProps((prev) => ({ ...prev, visible: false }));
  };

  return (
    <>
      {children}
      <StyledAlert {...alertProps} onDismiss={handleDismiss} />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 24,
    width: width * 0.85,
    maxWidth: 350,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  singleButton: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  destructiveButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  cancelButtonText: {
    color: 'white',
  },
  destructiveButtonText: {
    color: 'white',
  },
}); 