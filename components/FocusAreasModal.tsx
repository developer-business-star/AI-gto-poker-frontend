import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useHaptic } from '@/contexts/HapticContext';

const { width } = Dimensions.get('window');

interface FocusAreasModalProps {
  visible: boolean;
  onClose: () => void;
  currentFocusAreas: string[];
  onFocusAreasSelect: (focusAreas: string[]) => void;
}

const FocusAreasModal: React.FC<FocusAreasModalProps> = ({
  visible,
  onClose,
  currentFocusAreas,
  onFocusAreasSelect,
}) => {
  const { colors, isDark } = useTheme();
  const { triggerHaptic } = useHaptic();

  const focusAreas = [
    {
      id: 'preflop',
      title: 'Preflop',
      subtitle: 'Starting Hands',
      description: 'Hand selection • Position play • Opening ranges',
      color: '#4ecdc4',
      icon: 'card'
    },
    {
      id: 'flop',
      title: 'Flop',
      subtitle: 'Post-Flop Play',
      description: 'Continuation betting • Board texture • Draws',
      color: '#45b7d1',
      icon: 'layers'
    },
    {
      id: 'turn',
      title: 'Turn',
      subtitle: 'Turn Strategy',
      description: 'Second barrel • Draw completion • Value betting',
      color: '#ff6b6b',
      icon: 'trending-up'
    },
    {
      id: 'river',
      title: 'River',
      subtitle: 'River Play',
      description: 'Value betting • Bluffing • Pot control',
      color: '#9b59b6',
      icon: 'flag'
    },
    {
      id: 'bluffing',
      title: 'Bluffing',
      subtitle: 'Bluff Strategy',
      description: 'Semi-bluffs • Pure bluffs • Bluff frequency',
      color: '#f39c12',
      icon: 'flash'
    },
    {
      id: 'value_betting',
      title: 'Value Betting',
      subtitle: 'Value Extraction',
      description: 'Thin value • Bet sizing • Hand strength',
      color: '#27ae60',
      icon: 'diamond'
    },
    {
      id: 'position',
      title: 'Position',
      subtitle: 'Positional Play',
      description: 'Late position • Early position • Stealing blinds',
      color: '#e74c3c',
      icon: 'compass'
    },
    {
      id: 'stack_sizes',
      title: 'Stack Sizes',
      subtitle: 'Stack Management',
      description: 'Deep stack • Short stack • Push/fold',
      color: '#8e44ad',
      icon: 'stats-chart'
    },
  ];

  const handleFocusAreaToggle = (focusAreaId: string) => {
    triggerHaptic('light');
    const isSelected = currentFocusAreas.includes(focusAreaId);
    let newFocusAreas: string[];
    
    if (isSelected) {
      // Remove from selection
      newFocusAreas = currentFocusAreas.filter(id => id !== focusAreaId);
    } else {
      // Add to selection
      newFocusAreas = [...currentFocusAreas, focusAreaId];
    }
    
    onFocusAreasSelect(newFocusAreas);
  };

  const handleClose = () => {
    triggerHaptic('light');
    onClose();
  };

  const handleSelectAll = () => {
    triggerHaptic('light');
    onFocusAreasSelect(focusAreas.map(area => area.id));
  };

  const handleClearAll = () => {
    triggerHaptic('light');
    onFocusAreasSelect([]);
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
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Focus Areas</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={handleSelectAll}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionButtonText, { color: 'white' }]}>Select All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.divider }]}
              onPress={handleClearAll}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Clear All</Text>
            </TouchableOpacity>
          </View>

          {/* Focus Areas Options */}
          <ScrollView style={styles.optionsScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.optionsContainer}>
              {focusAreas.map((focusArea) => {
              const isSelected = currentFocusAreas.includes(focusArea.id);
              return (
                <TouchableOpacity
                  key={focusArea.id}
                  style={[
                    styles.focusAreaOption,
                    { 
                      backgroundColor: colors.surface,
                      borderColor: colors.divider,
                      borderWidth: 1,
                    },
                    isSelected && {
                      borderColor: focusArea.color,
                      borderWidth: 2,
                    }
                  ]}
                  onPress={() => handleFocusAreaToggle(focusArea.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.focusAreaLeft}>
                    <View style={[styles.iconBackground, { backgroundColor: focusArea.color + '15' }]}>
                      <Ionicons name={focusArea.icon as any} size={24} color={focusArea.color} />
                    </View>
                    <View style={styles.focusAreaInfo}>
                      <Text style={[styles.focusAreaTitle, { color: colors.text }]}>
                        {focusArea.title}
                      </Text>
                      <Text style={[styles.focusAreaSubtitle, { color: colors.textSecondary }]}>
                        {focusArea.subtitle}
                      </Text>
                      <Text style={[styles.focusAreaDescription, { color: colors.textTertiary }]}>
                        {focusArea.description}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.focusAreaRight}>
                    {isSelected && (
                      <View style={[styles.selectedIndicator, { backgroundColor: focusArea.color }]}>
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
              );
            })}
            </View>
          </ScrollView>

          {/* Selection Summary */}
          <View style={[styles.selectionSummary, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <Text style={[styles.selectionText, { color: colors.text }]}>
              {currentFocusAreas.length} focus area{currentFocusAreas.length !== 1 ? 's' : ''} selected
            </Text>
          </View>

          {/* Cancel Button */}
          <View style={styles.cancelContainer}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.surface, borderColor: colors.divider }]}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Done</Text>
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
    maxHeight: '90%',
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
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionsScrollView: {
    maxHeight: Dimensions.get('window').height * 0.4,
  },
  optionsContainer: {
    padding: 20,
    gap: 15,
  },
  focusAreaOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
  },
  focusAreaLeft: {
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
  focusAreaInfo: {
    flex: 1,
  },
  focusAreaTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  focusAreaSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  focusAreaDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  focusAreaRight: {
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
  selectionSummary: {
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '500',
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

export default FocusAreasModal;
