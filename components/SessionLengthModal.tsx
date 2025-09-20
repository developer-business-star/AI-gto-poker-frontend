import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useHaptic } from '@/contexts/HapticContext';

const { width } = Dimensions.get('window');

interface SessionLengthModalProps {
  visible: boolean;
  onClose: () => void;
  currentSessionLength: string;
  onSessionLengthSelect: (sessionLength: string) => void;
}

const SessionLengthModal: React.FC<SessionLengthModalProps> = ({
  visible,
  onClose,
  currentSessionLength,
  onSessionLengthSelect,
}) => {
  const { colors, isDark } = useTheme();
  const { triggerHaptic } = useHaptic();

  const sessionLengths = [
    {
      id: '15min',
      title: '15 minutes',
      subtitle: 'Quick Session',
      description: 'Short practice • Focused learning • Quick wins',
      color: '#4ecdc4',
      icon: 'flash'
    },
    {
      id: '30min',
      title: '30 minutes',
      subtitle: 'Standard Session',
      description: 'Balanced practice • Good coverage • Recommended',
      color: '#45b7d1',
      icon: 'time'
    },
    {
      id: '45min',
      title: '45 minutes',
      subtitle: 'Extended Session',
      description: 'Deep practice • Comprehensive learning • Thorough',
      color: '#ff6b6b',
      icon: 'hourglass'
    },
    {
      id: '60min',
      title: '60 minutes',
      subtitle: 'Long Session',
      description: 'Intensive practice • Full immersion • Maximum learning',
      color: '#9b59b6',
      icon: 'timer'
    },
    {
      id: 'custom',
      title: 'Custom',
      subtitle: 'Flexible Duration',
      description: 'Set your own time • Personal preference • Adaptive',
      color: '#96ceb4',
      icon: 'settings'
    },
  ];

  const handleSessionLengthSelect = (sessionLength: string) => {
    triggerHaptic('light');
    onSessionLengthSelect(sessionLength);
    onClose();
  };

  const handleClose = () => {
    triggerHaptic('light');
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Session Length</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Session Length Options */}
          <View style={styles.optionsContainer}>
            {sessionLengths.map((sessionLength) => (
              <TouchableOpacity
                key={sessionLength.id}
                style={[
                  styles.sessionLengthOption,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: colors.divider,
                    borderWidth: 1,
                  },
                  currentSessionLength === sessionLength.id && {
                    borderColor: sessionLength.color,
                    borderWidth: 2,
                  }
                ]}
                onPress={() => handleSessionLengthSelect(sessionLength.id)}
                activeOpacity={0.7}
              >
                <View style={styles.sessionLengthLeft}>
                  <View style={[styles.iconBackground, { backgroundColor: sessionLength.color + '15' }]}>
                    <Ionicons name={sessionLength.icon as any} size={24} color={sessionLength.color} />
                  </View>
                  <View style={styles.sessionLengthInfo}>
                    <Text style={[styles.sessionLengthTitle, { color: colors.text }]}>
                      {sessionLength.title}
                    </Text>
                    <Text style={[styles.sessionLengthSubtitle, { color: colors.textSecondary }]}>
                      {sessionLength.subtitle}
                    </Text>
                    <Text style={[styles.sessionLengthDescription, { color: colors.textTertiary }]}>
                      {sessionLength.description}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.sessionLengthRight}>
                  {currentSessionLength === sessionLength.id && (
                    <View style={[styles.selectedIndicator, { backgroundColor: sessionLength.color }]}>
                      <Ionicons name="checkmark" size={16} color="white" />
                    </View>
                  )}
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cancel Button */}
          <View style={styles.cancelContainer}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.surface, borderColor: colors.divider }]}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  optionsContainer: {
    padding: 20,
    gap: 15,
  },
  sessionLengthOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
  },
  sessionLengthLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 15,
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionLengthInfo: {
    flex: 1,
  },
  sessionLengthTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  sessionLengthSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  sessionLengthDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  sessionLengthRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  cancelButton: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SessionLengthModal;
