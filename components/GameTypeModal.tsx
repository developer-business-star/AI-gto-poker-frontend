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
import { useGame } from '@/contexts/GameContext';

const { width } = Dimensions.get('window');

interface GameTypeModalProps {
  visible: boolean;
  onClose: () => void;
  currentGameType: 'cash' | 'tournaments';
  onGameTypeSelect: (gameType: 'cash' | 'tournaments') => void;
}

const GameTypeModal: React.FC<GameTypeModalProps> = ({
  visible,
  onClose,
  currentGameType,
  onGameTypeSelect,
}) => {
  const { colors, isDark } = useTheme();
  const { triggerHaptic } = useHaptic();
  const { selectedFormat, setSelectedFormat } = useGame();

  const gameTypes = [
    {
      id: 'cash' as const,
      title: 'Cash Game',
      subtitle: 'Deep stack strategy • 100bb+',
      icon: 'cash',
      color: '#1a73e8',
      description: 'Master deep stack play with optimal ranges and sizing'
    },
    {
      id: 'tournaments' as const,
      title: 'Spin & Go',
      subtitle: 'Short stack • Fast-paced',
      icon: 'trophy',
      color: '#ea4335',
      description: 'Perfect push/fold decisions and hyper-turbo strategy'
    },
  ];

  const handleGameTypeSelect = (gameType: 'cash' | 'tournaments') => {
    triggerHaptic('light');
    setSelectedFormat(gameType); // Update global game context
    onGameTypeSelect(gameType); // Call parent callback
    onClose();
  };

  const handleClose = () => {
    triggerHaptic('light');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Select Game Type
            </Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.surface }]}
              onPress={handleClose}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Game Type Options */}
          <View style={styles.gameTypeList}>
            {gameTypes.map((gameType) => (
              <TouchableOpacity
                key={gameType.id}
                style={[
                  styles.gameTypeOption,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: colors.divider,
                    borderWidth: 1,
                  },
                  selectedFormat === gameType.id && {
                    borderColor: gameType.color,
                    borderWidth: 2,
                  }
                ]}
                onPress={() => handleGameTypeSelect(gameType.id)}
                activeOpacity={0.7}
              >
                <View style={styles.gameTypeLeft}>
                  <View style={[styles.gameTypeIcon, { backgroundColor: `${gameType.color}15` }]}>
                    <Ionicons 
                      name={gameType.icon as any} 
                      size={24} 
                      color={gameType.color} 
                    />
                  </View>
                  <View style={styles.gameTypeInfo}>
                    <Text style={[styles.gameTypeTitle, { color: colors.text }]}>
                      {gameType.title}
                    </Text>
                    <Text style={[styles.gameTypeSubtitle, { color: colors.textSecondary }]}>
                      {gameType.subtitle}
                    </Text>
                    <Text style={[styles.gameTypeDescription, { color: colors.textTertiary }]}>
                      {gameType.description}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.gameTypeRight}>
                  {selectedFormat === gameType.id && (
                    <View style={[styles.selectedIndicator, { backgroundColor: gameType.color }]}>
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

          {/* Footer */}
          <View style={[styles.modalFooter, { borderTopColor: colors.divider }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.surface }]}
              onPress={handleClose}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameTypeList: {
    padding: 20,
    gap: 12,
  },
  gameTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  gameTypeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  gameTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  gameTypeInfo: {
    flex: 1,
  },
  gameTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  gameTypeSubtitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  gameTypeDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  gameTypeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GameTypeModal;
