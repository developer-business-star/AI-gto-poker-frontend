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

interface AnalysisSpeedModalProps {
  visible: boolean;
  onClose: () => void;
  currentAnalysisSpeed: string;
  onAnalysisSpeedSelect: (analysisSpeed: string) => void;
}

const AnalysisSpeedModal: React.FC<AnalysisSpeedModalProps> = ({
  visible,
  onClose,
  currentAnalysisSpeed,
  onAnalysisSpeedSelect,
}) => {
  const { colors, isDark } = useTheme();
  const { triggerHaptic } = useHaptic();

  const analysisSpeeds = [
    {
      id: 'slow',
      title: 'Slow',
      subtitle: 'Thorough Analysis',
    //   description: 'Deep calculations • Maximum accuracy • 3-5 seconds',
      description: 'Deep calculations • Maximum accuracy',
      color: '#ff6b6b',
      icon: 'hourglass'
    },
    {
      id: 'fast',
      title: 'Fast',
      subtitle: 'Quick Analysis',
    //   description: 'Balanced speed • Good accuracy • 1-2 seconds',
      description: 'Balanced speed • Good accuracy',
      color: '#4ecdc4',
      icon: 'flash'
    },
    {
      id: 'instant',
      title: 'Instant',
      subtitle: 'Lightning Fast',
    //   description: 'Minimal delay • Basic accuracy • <1 second',
      description: 'Minimal delay • Basic accuracy',
      color: '#45b7d1',
      icon: 'thunderstorm'
    },
    {
      id: 'adaptive',
      title: 'Adaptive',
      subtitle: 'Smart Speed',
    //   description: 'Auto-adjusts • Optimal balance • Variable timing',
      description: 'Auto-adjusts • Optimal balance',
      color: '#96ceb4',
      icon: 'settings'
    },
  ];

  const handleAnalysisSpeedSelect = (analysisSpeed: string) => {
    triggerHaptic('light');
    onAnalysisSpeedSelect(analysisSpeed);
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
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Analysis Speed</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Analysis Speed Options */}
          <View style={styles.optionsContainer}>
            {analysisSpeeds.map((analysisSpeed) => (
              <TouchableOpacity
                key={analysisSpeed.id}
                style={[
                  styles.analysisSpeedOption,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: colors.divider,
                    borderWidth: 1,
                  },
                  currentAnalysisSpeed === analysisSpeed.id && {
                    borderColor: analysisSpeed.color,
                    borderWidth: 2,
                  }
                ]}
                onPress={() => handleAnalysisSpeedSelect(analysisSpeed.id)}
                activeOpacity={0.7}
              >
                <View style={styles.analysisSpeedLeft}>
                  <View style={[styles.iconBackground, { backgroundColor: analysisSpeed.color + '15' }]}>
                    <Ionicons name={analysisSpeed.icon as any} size={24} color={analysisSpeed.color} />
                  </View>
                  <View style={styles.analysisSpeedInfo}>
                    <Text style={[styles.analysisSpeedTitle, { color: colors.text }]}>
                      {analysisSpeed.title}
                    </Text>
                    <Text style={[styles.analysisSpeedSubtitle, { color: colors.textSecondary }]}>
                      {analysisSpeed.subtitle}
                    </Text>
                    <Text style={[styles.analysisSpeedDescription, { color: colors.textTertiary }]}>
                      {analysisSpeed.description}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.analysisSpeedRight}>
                  {currentAnalysisSpeed === analysisSpeed.id && (
                    <View style={[styles.selectedIndicator, { backgroundColor: analysisSpeed.color }]}>
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
  analysisSpeedOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
  },
  analysisSpeedLeft: {
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
  analysisSpeedInfo: {
    flex: 1,
  },
  analysisSpeedTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  analysisSpeedSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  analysisSpeedDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  analysisSpeedRight: {
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

export default AnalysisSpeedModal;
