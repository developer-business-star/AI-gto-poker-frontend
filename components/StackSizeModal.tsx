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

interface StackSizeModalProps {
  visible: boolean;
  onClose: () => void;
  currentStackSize: string;
  onStackSizeSelect: (stackSize: string) => void;
}

const StackSizeModal: React.FC<StackSizeModalProps> = ({
  visible,
  onClose,
  currentStackSize,
  onStackSizeSelect,
}) => {
  const { colors, isDark } = useTheme();
  const { triggerHaptic } = useHaptic();

  const stackSizes = [
    {
      id: '50bb',
      title: '50bb',
      subtitle: 'Short Stack',
      description: 'Quick decisions • Push/fold strategy',
      color: '#ff6b6b',
      icon: 'trending-down'
    },
    {
      id: '100bb',
      title: '100bb',
      subtitle: 'Standard Stack',
      description: 'Balanced play • Optimal ranges',
      color: '#4ecdc4',
      icon: 'trending-up'
    },
    {
      id: '200bb',
      title: '200bb',
      subtitle: 'Deep Stack',
      description: 'Complex strategy • Post-flop mastery',
      color: '#45b7d1',
      icon: 'trending-up'
    },
    {
      id: '300bb+',
      title: '300bb+',
      subtitle: 'Very Deep',
      description: 'Advanced play • Multi-street strategy',
      color: '#96ceb4',
      icon: 'trending-up'
    },
  ];

  const handleStackSizeSelect = (stackSize: string) => {
    triggerHaptic('light');
    onStackSizeSelect(stackSize);
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
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Stack Size</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Stack Size Options */}
          <View style={styles.optionsContainer}>
            {stackSizes.map((stackSize) => (
              <TouchableOpacity
                key={stackSize.id}
                style={[
                  styles.stackSizeOption,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: colors.divider,
                    borderWidth: 1,
                  },
                  currentStackSize === stackSize.id && {
                    borderColor: stackSize.color,
                    borderWidth: 2,
                  }
                ]}
                onPress={() => handleStackSizeSelect(stackSize.id)}
                activeOpacity={0.7}
              >
                <View style={styles.stackSizeLeft}>
                  <View style={[styles.iconBackground, { backgroundColor: stackSize.color + '15' }]}>
                    <Ionicons name={stackSize.icon as any} size={24} color={stackSize.color} />
                  </View>
                  <View style={styles.stackSizeInfo}>
                    <Text style={[styles.stackSizeTitle, { color: colors.text }]}>
                      {stackSize.title}
                    </Text>
                    <Text style={[styles.stackSizeSubtitle, { color: colors.textSecondary }]}>
                      {stackSize.subtitle}
                    </Text>
                    <Text style={[styles.stackSizeDescription, { color: colors.textTertiary }]}>
                      {stackSize.description}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.stackSizeRight}>
                  {currentStackSize === stackSize.id && (
                    <View style={[styles.selectedIndicator, { backgroundColor: stackSize.color }]}>
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
  stackSizeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
  },
  stackSizeLeft: {
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
  stackSizeInfo: {
    flex: 1,
  },
  stackSizeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  stackSizeSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  stackSizeDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  stackSizeRight: {
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

export default StackSizeModal;
