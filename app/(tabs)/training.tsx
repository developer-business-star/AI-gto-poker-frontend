import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useGame } from '@/contexts/GameContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface HandData {
  heroCards: string[];
  board: string[];
  position: string;
  stackSize: number;
  potSize: number;
  action: string;
  gameType: 'cash' | 'tournaments';
  blindLevel?: string; // For tournaments
  ante?: number; // For tournaments
}

export default function TrainingScreen() {
  const params = useLocalSearchParams();
  const { selectedFormat, formatDisplayName } = useGame();
  
  // Prioritize global context over route parameters
  const gameType = selectedFormat;
  const gameFormat = formatDisplayName;

  const [currentHand, setCurrentHand] = useState<HandData>({
    heroCards: ['A♠', 'K♥'],
    board: ['Q♦', '7♣', '2♠'],
    position: 'Button',
    stackSize: gameType === 'cash' ? 100 : 15, // Different stack sizes
    potSize: gameType === 'cash' ? 15 : 3,
    action: gameType === 'cash' ? 'Villain bets 10bb' : 'Villain shoves 12bb',
    gameType: gameType,
    blindLevel: gameType === 'tournaments' ? '50/100' : undefined,
    ante: gameType === 'tournaments' ? 10 : undefined,
  });

  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gtoDecision, setGtoDecision] = useState('');
  const [sessionStats, setSessionStats] = useState({
    hands: 0,
    correct: 0,
    accuracy: 0
  });

  const actions = gameType === 'cash' 
    ? [
        { id: 'fold', label: 'Fold', color: '#ef4444' },
        { id: 'call', label: 'Call', color: '#f59e0b' },
        { id: 'raise', label: 'Raise 2.5x', color: '#22c55e' },
        { id: 'raise_large', label: 'Raise 3.5x', color: '#8b5cf6' },
      ]
    : [
        { id: 'fold', label: 'Fold', color: '#ef4444' },
        { id: 'call', label: 'Call', color: '#f59e0b' },
        { id: 'shove', label: 'All-In', color: '#22c55e' },
      ];

  const handleActionPress = (action: string) => {
    setSelectedAction(action);
    // Simulate GTO calculation
    setTimeout(() => {
      const actionIds = actions.map(a => a.id);
      const randomGto = actionIds[Math.floor(Math.random() * actionIds.length)];
      setGtoDecision(randomGto);
      setShowResult(true);
      
      // Update session stats
      const isCorrect = action === randomGto;
      setSessionStats(prev => ({
        hands: prev.hands + 1,
        correct: prev.correct + (isCorrect ? 1 : 0),
        accuracy: Math.round(((prev.correct + (isCorrect ? 1 : 0)) / (prev.hands + 1)) * 100)
      }));
    }, 1000);
  };

  const getResultMessage = () => {
    if (selectedAction === gtoDecision) {
      return '✅ Correct! This matches GTO strategy.';
    }
    const correctAction = actions.find(a => a.id === gtoDecision)?.label || gtoDecision;
    return `❌ GTO suggests: ${correctAction}`;
  };

  const nextHand = () => {
    setSelectedAction(null);
    setShowResult(false);
    setGtoDecision('');
    
    // Generate new hand based on game type
    const cards = ['A♠', 'K♥', 'Q♦', 'J♣', '10♠', '9♥', '8♦', '7♣'];
    const newHeroCards = [
      cards[Math.floor(Math.random() * cards.length)],
      cards[Math.floor(Math.random() * cards.length)]
    ];
    
    const positions = gameType === 'cash' 
      ? ['UTG', 'MP', 'CO', 'Button', 'SB', 'BB']
      : ['UTG', 'MP', 'CO', 'Button', 'SB', 'BB'];
    
    const newPosition = positions[Math.floor(Math.random() * positions.length)];
    
    if (gameType === 'cash') {
      setCurrentHand({
        ...currentHand,
        heroCards: newHeroCards,
        position: newPosition,
        stackSize: Math.floor(Math.random() * 200) + 50, // 50-250bb
        potSize: Math.floor(Math.random() * 30) + 5,
        action: `Villain bets ${Math.floor(Math.random() * 20) + 5}bb`,
        gameType: 'cash'
      });
    } else {
      setCurrentHand({
        ...currentHand,
        heroCards: newHeroCards,
        position: newPosition,
        stackSize: Math.floor(Math.random() * 20) + 8, // 8-28bb
        potSize: Math.floor(Math.random() * 8) + 2,
        action: `Villain shoves ${Math.floor(Math.random() * 15) + 8}bb`,
        gameType: 'tournaments',
        blindLevel: ['25/50', '50/100', '75/150', '100/200'][Math.floor(Math.random() * 4)],
        ante: [0, 5, 10, 15][Math.floor(Math.random() * 4)]
      });
    }
  };

  // Auto-generate appropriate training scenarios on component mount
  useEffect(() => {
    nextHand();
  }, [gameType]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={[styles.title, { color: gameType === 'cash' ? '#3b82f6' : '#f87171' }]}>{gameFormat} Training</ThemedText>
          <ThemedText style={styles.subtitle}>
            {gameType === 'cash' 
              ? 'Practice deep stack decision making' 
              : 'Master short stack and ICM situations'
            }
          </ThemedText>
        </View>

        {/* Game Info */}
        <View style={[
          styles.gameInfo,
          { borderColor: gameType === 'cash' ? '#3b82f6' : '#f87171' }
        ]}>
          <View style={styles.infoGrid}>
            <View style={[
              styles.infoItem,
              { backgroundColor: gameType === 'cash' ? '#eff6ff' : '#fef2f2' }
            ]}>
              <Text style={[
                styles.infoLabel,
                { color: gameType === 'cash' ? '#1d4ed8' : '#dc2626' }
              ]}>Position:</Text>
              <Text style={styles.infoValue}>{currentHand.position}</Text>
            </View>
            <View style={[
              styles.infoItem,
              { backgroundColor: gameType === 'cash' ? '#eff6ff' : '#fef2f2' }
            ]}>
              <Text style={[
                styles.infoLabel,
                { color: gameType === 'cash' ? '#1d4ed8' : '#dc2626' }
              ]}>Stack:</Text>
              <Text style={styles.infoValue}>{currentHand.stackSize}bb</Text>
            </View>
            <View style={[
              styles.infoItem,
              { backgroundColor: gameType === 'cash' ? '#eff6ff' : '#fef2f2' }
            ]}>
              <Text style={[
                styles.infoLabel,
                { color: gameType === 'cash' ? '#1d4ed8' : '#dc2626' }
              ]}>Pot:</Text>
              <Text style={styles.infoValue}>{currentHand.potSize}bb</Text>
            </View>
            {gameType === 'tournaments' && (
              <>
                <View style={[
                  styles.infoItem,
                  { backgroundColor: '#fef2f2' }
                ]}>
                  <Text style={[
                    styles.infoLabel,
                    { color: '#dc2626' }
                  ]}>Blinds:</Text>
                  <Text style={styles.infoValue}>{currentHand.blindLevel}</Text>
                </View>
                {currentHand.ante && currentHand.ante > 0 && (
                  <View style={[
                    styles.infoItem,
                    { backgroundColor: '#fef2f2' }
                  ]}>
                    <Text style={[
                      styles.infoLabel,
                      { color: '#dc2626' }
                    ]}>Ante:</Text>
                    <Text style={styles.infoValue}>{currentHand.ante}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* Game Type Indicator */}
        <View style={styles.gameTypeIndicator}>
          <View style={[
            styles.gameTypeBadge, 
            { backgroundColor: gameType === 'cash' ? '#1a73e8' : '#ea4335' }
          ]}>
            <Text style={styles.gameTypeText}>
              {gameType === 'cash' ? '💰 Cash Game' : '🏆 Tournament'}
            </Text>
          </View>
        </View>

        {/* Poker Table */}
        <View style={styles.pokerTable}>
          <View style={styles.board}>
            <Text style={styles.boardLabel}>Board</Text>
            <View style={styles.boardCards}>
              {currentHand.board.map((card, index) => (
                <View key={index} style={styles.card}>
                  <Text style={styles.cardText}>{card}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.heroCards}>
            <Text style={styles.heroLabel}>Your Cards</Text>
            <View style={styles.heroCardContainer}>
              {currentHand.heroCards.map((card, index) => (
                <View key={index} style={[styles.card, styles.heroCard]}>
                  <Text style={styles.cardText}>{card}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Action Description */}
        <View style={styles.actionSection}>
          <Text style={styles.actionText}>{currentHand.action}</Text>
          <Text style={styles.questionText}>What's your optimal decision?</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.actionButton,
                { backgroundColor: action.color },
                selectedAction === action.id && styles.selectedAction
              ]}
              onPress={() => handleActionPress(action.id)}
              disabled={showResult}
            >
              <Text style={styles.actionButtonText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Result Feedback */}
        {showResult && (
          <View style={styles.resultSection}>
            <Text style={styles.resultText}>{getResultMessage()}</Text>
            <TouchableOpacity style={styles.nextHandButton} onPress={nextHand}>
              <Text style={styles.nextHandText}>Next Hand</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Statistics */}
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Session Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: sessionStats.accuracy >= 70 ? '#dcfce7' : '#fef3c7' }]}>
                <Ionicons 
                  name="analytics" 
                  size={24} 
                  color={sessionStats.accuracy >= 70 ? '#22c55e' : '#f59e0b'} 
                />
              </View>
              <Text style={[
                styles.statValue, 
                { color: sessionStats.accuracy >= 70 ? '#22c55e' : '#f59e0b' }
              ]}>
                {sessionStats.accuracy}%
              </Text>
              <Text style={styles.statLabel}>Overall Accuracy</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#dbeafe' }]}>
                <MaterialIcons name="casino" size={24} color="#3b82f6" />
              </View>
              <Text style={[styles.statValue, { color: '#3b82f6' }]}>{sessionStats.hands}</Text>
              <Text style={styles.statLabel}>Hands Played</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#f3e8ff' }]}>
                <Ionicons name="checkmark-circle" size={24} color="#8b5cf6" />
              </View>
              <Text style={[styles.statValue, { color: '#8b5cf6' }]}>{sessionStats.correct}</Text>
              <Text style={styles.statLabel}>Correct Decisions</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    // color: "#3b82f6",
    // color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  gameInfo: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 20,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  gameTypeIndicator: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
    marginTop: -12,
  },
  gameTypeBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  gameTypeText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  pokerTable: {
    backgroundColor: '#0f5132',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  board: {
    alignItems: 'center',
    marginBottom: 32,
  },
  boardLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  boardCards: {
    flexDirection: 'row',
    gap: 12,
  },
  heroCards: {
    alignItems: 'center',
  },
  heroLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  heroCardContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    minWidth: 56,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  heroCard: {
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOpacity: 0.3,
  },
  cardText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  actionSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  actionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  questionText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  selectedAction: {
    transform: [{ scale: 0.95 }],
    shadowOpacity: 0.25,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  resultSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  resultText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    color: '#1f2937',
  },
  nextHandButton: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  nextHandText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 80,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    marginBottom: 8,
    borderRadius: 12,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
}); 