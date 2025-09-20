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

interface DifficultyLevelModalProps {
  visible: boolean;
  onClose: () => void;
  currentDifficultyLevel: string;
  onDifficultyLevelSelect: (difficultyLevel: string) => void;
}

const DifficultyLevelModal: React.FC<DifficultyLevelModalProps> = ({
  visible,
  onClose,
  currentDifficultyLevel,
  onDifficultyLevelSelect,
}) => {
  const { colors, isDark } = useTheme();
  const { triggerHaptic } = useHaptic();

  const difficultyLevels = [
    {
      id: 'beginner',
      title: 'Beginner',
      subtitle: 'Learning Basics',
      description: 'Basic concepts • Simple scenarios • Easy decisions',
      color: '#4ecdc4',
      icon: 'school'
    },
    {
      id: 'intermediate',
      title: 'Intermediate',
      subtitle: 'Building Skills',
      description: 'Common situations • Standard plays • Moderate complexity',
      color: '#45b7d1',
      icon: 'trending-up'
    },
    {
      id: 'advanced',
      title: 'Advanced',
      subtitle: 'Expert Level',
      description: 'Complex scenarios • Advanced strategies • Tough decisions',
      color: '#ff6b6b',
      icon: 'trophy'
    },
    {
      id: 'expert',
      title: 'Expert',
      subtitle: 'Master Level',
      description: 'Elite scenarios • Pro strategies • Maximum difficulty',
      color: '#9b59b6',
      icon: 'diamond'
    },
  ];

  const handleDifficultyLevelSelect = (difficultyLevel: string) => {
    triggerHaptic('light');
    onDifficultyLevelSelect(difficultyLevel);
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
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Difficulty Level</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Difficulty Level Options */}
          <View style={styles.optionsContainer}>
            {difficultyLevels.map((difficultyLevel) => (
              <TouchableOpacity
                key={difficultyLevel.id}
                style={[
                  styles.difficultyLevelOption,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: colors.divider,
                    borderWidth: 1,
                  },
                  currentDifficultyLevel === difficultyLevel.id && {
                    borderColor: difficultyLevel.color,
                    borderWidth: 2,
                  }
                ]}
                onPress={() => handleDifficultyLevelSelect(difficultyLevel.id)}
                activeOpacity={0.7}
              >
                <View style={styles.difficultyLevelLeft}>
                  <View style={[styles.iconBackground, { backgroundColor: difficultyLevel.color + '15' }]}>
                    <Ionicons name={difficultyLevel.icon as any} size={24} color={difficultyLevel.color} />
                  </View>
                  <View style={styles.difficultyLevelInfo}>
                    <Text style={[styles.difficultyLevelTitle, { color: colors.text }]}>
                      {difficultyLevel.title}
                    </Text>
                    <Text style={[styles.difficultyLevelSubtitle, { color: colors.textSecondary }]}>
                      {difficultyLevel.subtitle}
                    </Text>
                    <Text style={[styles.difficultyLevelDescription, { color: colors.textTertiary }]}>
                      {difficultyLevel.description}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.difficultyLevelRight}>
                  {currentDifficultyLevel === difficultyLevel.id && (
                    <View style={[styles.selectedIndicator, { backgroundColor: difficultyLevel.color }]}>
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
  difficultyLevelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
  },
  difficultyLevelLeft: {
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
  difficultyLevelInfo: {
    flex: 1,
  },
  difficultyLevelTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  difficultyLevelSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  difficultyLevelDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  difficultyLevelRight: {
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

export default DifficultyLevelModal;
