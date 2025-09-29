// import { ThemedText } from '@/components/ThemedText';
// import { ThemedView } from '@/components/ThemedView';
// import { useGame } from '@/contexts/GameContext';
// import { useTheme } from '@/contexts/ThemeContext';
// import { useHaptic } from '@/contexts/HapticContext';
// import { Ionicons, MaterialIcons } from '@expo/vector-icons';
// import { useLocalSearchParams } from 'expo-router';
// import React, { useEffect, useState, useMemo } from 'react';
// import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// interface HandData {
//   heroCards: string[];
//   board: string[];
//   position: string;
//   stackSize: number;
//   potSize: number;
//   action: string;
//   gameType: 'cash' | 'tournaments';
//   blindLevel?: string; // For tournaments
//   ante?: number; // For tournaments
// }

// export default function TrainingScreen() {
//   const params = useLocalSearchParams();
//   const { selectedFormat, formatDisplayName, sessionDurationMinutes, selectedFocusAreas } = useGame();
//   const { colors, isDark } = useTheme();
//   const { triggerHaptic } = useHaptic();
  
//   // Prioritize global context over route parameters
//   const gameType = selectedFormat;
//   const gameFormat = formatDisplayName;

//   const [currentHand, setCurrentHand] = useState<HandData>({
//     heroCards: ['A♠', 'K♥'],
//     board: ['Q♦', '7♣', '2♠'],
//     position: 'Button',
//     stackSize: gameType === 'cash' ? 100 : 15, // Different stack sizes
//     potSize: gameType === 'cash' ? 15 : 3,
//     action: gameType === 'cash' ? 'Villain bets 10bb' : 'Villain shoves 12bb',
//     gameType: gameType,
//     blindLevel: gameType === 'tournaments' ? '50/100' : undefined,
//     ante: gameType === 'tournaments' ? 10 : undefined,
//   });

//   const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);

//   const [selectedAction, setSelectedAction] = useState<string | null>(null);
//   const [showResult, setShowResult] = useState(false);
//   const [gtoDecision, setGtoDecision] = useState('');
//   const [sessionStats, setSessionStats] = useState({
//     hands: 0,
//     correct: 0,
//     accuracy: 0
//   });

//   // Session timing state
//   const [sessionTime, setSessionTime] = useState(0); // Time in seconds
//   const [sessionActive, setSessionActive] = useState(false);
//   const [sessionEnded, setSessionEnded] = useState(false);

//   // Session timer effect
//   useEffect(() => {
//     let interval: ReturnType<typeof setInterval> | null = null;
    
//     if (sessionActive && !sessionEnded) {
//       interval = setInterval(() => {
//         setSessionTime(prevTime => {
//           const newTime = prevTime + 1;
//           // Check if session time has reached the selected duration
//           if (newTime >= sessionDurationMinutes * 60) {
//             setSessionEnded(true);
//             setSessionActive(false);
//             triggerHaptic('success'); // Notify user that session ended
//             return sessionDurationMinutes * 60; // Cap at max time
//           }
//           return newTime;
//         });
//       }, 1000);
//     }

//     return () => {
//       if (interval) {
//         clearInterval(interval);
//       }
//     };
//   }, [sessionActive, sessionEnded, sessionDurationMinutes, triggerHaptic]);

//   // Start session when component mounts
//   useEffect(() => {
//     setSessionActive(true);
//     setSessionTime(0);
//     setSessionEnded(false);
//   }, [sessionDurationMinutes]); // Restart when session length changes

//   // Update current hand when focus areas change
//   useEffect(() => {
//     if (trainingScenarios.length > 0) {
//       const randomIndex = Math.floor(Math.random() * trainingScenarios.length);
//       setCurrentScenarioIndex(randomIndex);
//       setCurrentHand(trainingScenarios[randomIndex]);
//     }
//   }, [selectedFocusAreas]); // Remove trainingScenarios from dependency array

//   // Helper function to format time
//   const formatTime = (seconds: number): string => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   };

//   // Calculate remaining time
//   const remainingTime = sessionDurationMinutes * 60 - sessionTime;
//   const progressPercentage = (sessionTime / (sessionDurationMinutes * 60)) * 100;

//   // Focus area-based training scenarios
//   const trainingScenarios = useMemo(() => {
//     const allScenarios = {
//       preflop: [
//         {
//           heroCards: ['A♠', 'K♥'],
//           board: [],
//           position: 'Button',
//           stackSize: gameType === 'cash' ? 100 : 15,
//           potSize: gameType === 'cash' ? 3 : 1.5,
//           action: gameType === 'cash' ? 'UTG opens 2.5bb' : 'UTG shoves 12bb',
//           gameType: gameType,
//           blindLevel: gameType === 'tournaments' ? '50/100' : undefined,
//           ante: gameType === 'tournaments' ? 10 : undefined,
//           focusArea: 'preflop',
//           description: 'UTG opens, action to you on the button'
//         },
//         {
//           heroCards: ['Q♠', 'Q♥'],
//           board: [],
//           position: 'UTG',
//           stackSize: gameType === 'cash' ? 100 : 15,
//           potSize: gameType === 'cash' ? 1.5 : 1.5,
//           action: 'Action to you first to act',
//           gameType: gameType,
//           blindLevel: gameType === 'tournaments' ? '50/100' : undefined,
//           ante: gameType === 'tournaments' ? 10 : undefined,
//           focusArea: 'preflop',
//           description: 'You have pocket queens UTG'
//         }
//       ],
//       flop: [
//         {
//           heroCards: ['A♠', 'K♥'],
//           board: ['A♦', '7♣', '2♠'],
//           position: 'Button',
//           stackSize: gameType === 'cash' ? 100 : 15,
//           potSize: gameType === 'cash' ? 15 : 3,
//           action: 'Villain checks, action to you',
//           gameType: gameType,
//           blindLevel: gameType === 'tournaments' ? '50/100' : undefined,
//           ante: gameType === 'tournaments' ? 10 : undefined,
//           focusArea: 'flop',
//           description: 'You have top pair on a dry board'
//         }
//       ],
//       turn: [
//         {
//           heroCards: ['A♠', 'K♥'],
//           board: ['A♦', '7♣', '2♠', 'K♣'],
//           position: 'Button',
//           stackSize: gameType === 'cash' ? 100 : 15,
//           potSize: gameType === 'cash' ? 30 : 6,
//           action: 'Villain bets 15bb, action to you',
//           gameType: gameType,
//           blindLevel: gameType === 'tournaments' ? '50/100' : undefined,
//           ante: gameType === 'tournaments' ? 10 : undefined,
//           focusArea: 'turn',
//           description: 'You have two pair, villain bets'
//         }
//       ],
//       river: [
//         {
//           heroCards: ['A♠', 'K♥'],
//           board: ['A♦', '7♣', '2♠', 'K♣', '9♥'],
//           position: 'Button',
//           stackSize: gameType === 'cash' ? 100 : 15,
//           potSize: gameType === 'cash' ? 60 : 12,
//           action: 'Villain checks, action to you',
//           gameType: gameType,
//           blindLevel: gameType === 'tournaments' ? '50/100' : undefined,
//           ante: gameType === 'tournaments' ? 10 : undefined,
//           focusArea: 'river',
//           description: 'You have two pair, villain checks river'
//         }
//       ],
//       bluffing: [
//         {
//           heroCards: ['9♠', '8♠'],
//           board: ['A♦', 'K♣', 'Q♠', 'J♥'],
//           position: 'Button',
//           stackSize: gameType === 'cash' ? 100 : 15,
//           potSize: gameType === 'cash' ? 20 : 4,
//           action: 'Villain checks, action to you',
//           gameType: gameType,
//           blindLevel: gameType === 'tournaments' ? '50/100' : undefined,
//           ante: gameType === 'tournaments' ? 10 : undefined,
//           focusArea: 'bluffing',
//           description: 'You have a straight draw, good bluff spot?'
//         }
//       ],
//       value_betting: [
//         {
//           heroCards: ['A♠', 'A♥'],
//           board: ['A♦', '7♣', '2♠', 'K♣'],
//           position: 'Button',
//           stackSize: gameType === 'cash' ? 100 : 15,
//           potSize: gameType === 'cash' ? 30 : 6,
//           action: 'Villain checks, action to you',
//           gameType: gameType,
//           blindLevel: gameType === 'tournaments' ? '50/100' : undefined,
//           ante: gameType === 'tournaments' ? 10 : undefined,
//           focusArea: 'value_betting',
//           description: 'You have top set, value bet sizing?'
//         }
//       ],
//       position: [
//         {
//           heroCards: ['J♠', 'T♥'],
//           board: ['9♦', '8♣', '7♠'],
//           position: 'Small Blind',
//           stackSize: gameType === 'cash' ? 100 : 15,
//           potSize: gameType === 'cash' ? 10 : 2,
//           action: 'Action to you in small blind',
//           gameType: gameType,
//           blindLevel: gameType === 'tournaments' ? '50/100' : undefined,
//           ante: gameType === 'tournaments' ? 10 : undefined,
//           focusArea: 'position',
//           description: 'You have a straight in small blind'
//         }
//       ],
//       stack_sizes: [
//         {
//           heroCards: ['A♠', 'K♥'],
//           board: ['A♦', '7♣', '2♠'],
//           position: 'Button',
//           stackSize: gameType === 'cash' ? 200 : 8,
//           potSize: gameType === 'cash' ? 15 : 3,
//           action: 'Villain bets 10bb, action to you',
//           gameType: gameType,
//           blindLevel: gameType === 'tournaments' ? '50/100' : undefined,
//           ante: gameType === 'tournaments' ? 10 : undefined,
//           focusArea: 'stack_sizes',
//           description: gameType === 'cash' ? 'Deep stack play' : 'Short stack decision'
//         }
//       ]
//     };

//     // Filter scenarios based on selected focus areas
//     if (selectedFocusAreas.length === 0) {
//       // If no focus areas selected, return all scenarios
//       return Object.values(allScenarios).flat();
//     }

//     // Return scenarios for selected focus areas
//     return selectedFocusAreas.flatMap(area => allScenarios[area] || []);
//   }, [selectedFocusAreas, gameType]);

//   const actions = gameType === 'cash' 
//     ? [
//         { id: 'fold', label: 'Fold', color: '#ef4444' },
//         { id: 'call', label: 'Call', color: '#f59e0b' },
//         { id: 'raise', label: 'Raise 2.5x', color: '#22c55e' },
//         { id: 'raise_large', label: 'Raise 3.5x', color: '#8b5cf6' },
//       ]
//     : [
//         { id: 'fold', label: 'Fold', color: '#ef4444' },
//         { id: 'call', label: 'Call', color: '#f59e0b' },
//         { id: 'shove', label: 'All-In', color: '#22c55e' },
//       ];

//   const handleActionPress = (action: string) => {
//     setSelectedAction(action);
//     triggerHaptic('light'); // Haptic feedback for action selection
    
//     // Simulate GTO calculation
//     setTimeout(() => {
//       const actionIds = actions.map(a => a.id);
//       const randomGto = actionIds[Math.floor(Math.random() * actionIds.length)];
//       setGtoDecision(randomGto);
//       setShowResult(true);
      
//       // Update session stats
//       const isCorrect = action === randomGto;
      
//       // Haptic feedback for result
//       if (isCorrect) {
//         triggerHaptic('success');
//       } else {
//         triggerHaptic('error');
//       }
      
//       setSessionStats(prev => ({
//         hands: prev.hands + 1,
//         correct: prev.correct + (isCorrect ? 1 : 0),
//         accuracy: Math.round(((prev.correct + (isCorrect ? 1 : 0)) / (prev.hands + 1)) * 100)
//       }));
//     }, 1000);
//   };

//   const getResultMessage = () => {
//     if (selectedAction === gtoDecision) {
//       return '✅ Correct! This matches GTO strategy.';
//     }
//     const correctAction = actions.find(a => a.id === gtoDecision)?.label || gtoDecision;
//     return `❌ GTO suggests: ${correctAction}`;
//   };

//   const nextHand = () => {
//     triggerHaptic('medium'); // Haptic feedback for next hand
//     setSelectedAction(null);
//     setShowResult(false);
//     setGtoDecision('');
    
//     // Select next scenario from focus areas
//     if (trainingScenarios.length > 0) {
//       const randomIndex = Math.floor(Math.random() * trainingScenarios.length);
//       setCurrentScenarioIndex(randomIndex);
//       setCurrentHand(trainingScenarios[randomIndex]);
//     } else {
//       // Fallback to default hand if no scenarios available
//       const cards = ['A♠', 'K♥', 'Q♦', 'J♣', '10♠', '9♥', '8♦', '7♣'];
//       const newHeroCards = [
//         cards[Math.floor(Math.random() * cards.length)],
//         cards[Math.floor(Math.random() * cards.length)]
//       ];
      
//       const positions = gameType === 'cash' 
//         ? ['UTG', 'MP', 'CO', 'Button', 'SB', 'BB']
//         : ['UTG', 'MP', 'CO', 'Button', 'SB', 'BB'];
      
//       const newPosition = positions[Math.floor(Math.random() * positions.length)];
      
//       if (gameType === 'cash') {
//         setCurrentHand({
//           ...currentHand,
//           heroCards: newHeroCards,
//           position: newPosition,
//           stackSize: Math.floor(Math.random() * 200) + 50, // 50-250bb
//           potSize: Math.floor(Math.random() * 30) + 5,
//           action: `Villain bets ${Math.floor(Math.random() * 20) + 5}bb`,
//           gameType: 'cash'
//         });
//       } else {
//         setCurrentHand({
//           ...currentHand,
//           heroCards: newHeroCards,
//           position: newPosition,
//           stackSize: Math.floor(Math.random() * 20) + 8, // 8-28bb
//           potSize: Math.floor(Math.random() * 8) + 2,
//           action: `Villain shoves ${Math.floor(Math.random() * 15) + 8}bb`,
//           gameType: 'tournaments',
//           blindLevel: ['25/50', '50/100', '75/150', '100/200'][Math.floor(Math.random() * 4)],
//           ante: [0, 5, 10, 15][Math.floor(Math.random() * 4)]
//         });
//       }
//     }
//   };

//   // Auto-generate appropriate training scenarios on component mount
//   useEffect(() => {
//     nextHand();
//   }, [gameType]);

//   return (
//     <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
//       <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
//         {/* Header */}
//         <View style={[styles.header]}>
//           <ThemedText style={[styles.title, { color: gameType === 'cash' ? '#3b82f6' : '#f87171' }]}>{gameFormat} Training</ThemedText>
//           <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
//             {gameType === 'cash' 
//               ? 'Practice deep stack decision making' 
//               : 'Master short stack and ICM situations'
//             }
//           </ThemedText>
//         </View>

//         {/* Game Info */}
//         <View style={[
//           styles.gameInfo,
//           { 
//             borderColor: gameType === 'cash' ? '#3b82f6' : '#f87171',
//             backgroundColor: colors.card,
//           }
//         ]}>
//           <View style={styles.infoGrid}>
//             <View style={[
//               styles.infoItem,
//               { 
//                 backgroundColor: isDark ? colors.surface : (gameType === 'cash' ? '#eff6ff' : '#fef2f2'),
//                 borderColor: colors.divider
//               }
//             ]}>
//               <Text style={[
//                 styles.infoLabel,
//                 { color: gameType === 'cash' ? '#1d4ed8' : '#dc2626' }
//               ]}>Position:</Text>
//               <Text style={[styles.infoValue, { color: colors.text }]}>{currentHand.position}</Text>
//             </View>
//             <View style={[
//               styles.infoItem,
//               { 
//                 backgroundColor: isDark ? colors.surface : (gameType === 'cash' ? '#eff6ff' : '#fef2f2'),
//                 borderColor: colors.divider
//               }
//             ]}>
//               <Text style={[
//                 styles.infoLabel,
//                 { color: gameType === 'cash' ? '#1d4ed8' : '#dc2626' }
//               ]}>Stack:</Text>
//               <Text style={[styles.infoValue, { color: colors.text }]}>{currentHand.stackSize}bb</Text>
//             </View>
//             <View style={[
//               styles.infoItem,
//               { 
//                 backgroundColor: isDark ? colors.surface : (gameType === 'cash' ? '#eff6ff' : '#fef2f2'),
//                 borderColor: colors.divider
//               }
//             ]}>
//               <Text style={[
//                 styles.infoLabel,
//                 { color: gameType === 'cash' ? '#1d4ed8' : '#dc2626' }
//               ]}>Pot:</Text>
//               <Text style={[styles.infoValue, { color: colors.text }]}>{currentHand.potSize}bb</Text>
//             </View>
//             {gameType === 'tournaments' && (
//               <>
//                 <View style={[
//                   styles.infoItem,
//                   { 
//                     backgroundColor: isDark ? colors.surface : '#fef2f2',
//                     borderColor: colors.divider
//                   }
//                 ]}>
//                   <Text style={[
//                     styles.infoLabel,
//                     { color: '#dc2626' }
//                   ]}>Blinds:</Text>
//                   <Text style={[styles.infoValue, { color: colors.text }]}>{currentHand.blindLevel}</Text>
//                 </View>
//                 {currentHand.ante && currentHand.ante > 0 && (
//                   <View style={[
//                     styles.infoItem,
//                     { 
//                       backgroundColor: isDark ? colors.surface : '#fef2f2',
//                       borderColor: colors.divider
//                     }
//                   ]}>
//                     <Text style={[
//                       styles.infoLabel,
//                       { color: '#dc2626' }
//                     ]}>Ante:</Text>
//                     <Text style={[styles.infoValue, { color: colors.text }]}>{currentHand.ante}</Text>
//                   </View>
//                 )}
//               </>
//             )}
//           </View>
//         </View>

//         {/* Session Timer */}
//         <View style={[
//           styles.sessionTimer,
//           { 
//             backgroundColor: colors.card,
//             borderColor: sessionEnded ? colors.error : colors.border
//           }
//         ]}>
//           <View style={styles.timerHeader}>
//             <Text style={[styles.timerTitle, { color: colors.text }]}>
//               {sessionEnded ? 'Session Complete!' : 'Session Timer'}
//             </Text>
//             <Text style={[styles.timerTime, { color: sessionEnded ? colors.error : colors.primary }]}>
//               {formatTime(sessionTime)}
//             </Text>
//           </View>
          
//           <View style={styles.timerProgress}>
//             <View style={[
//               styles.timerProgressBar,
//               { 
//                 backgroundColor: colors.divider,
//                 width: '100%'
//               }
//             ]}>
//               <View style={[
//                 styles.timerProgressFill,
//                 { 
//                   backgroundColor: sessionEnded ? colors.error : colors.primary,
//                   width: `${Math.min(progressPercentage, 100)}%`
//                 }
//               ]} />
//             </View>
//             <Text style={[styles.timerRemaining, { color: colors.textSecondary }]}>
//               {sessionEnded ? 'Session ended' : `${formatTime(remainingTime)} remaining`}
//             </Text>
//           </View>
//         </View>

//         {/* Focus Areas Indicator */}
//         {selectedFocusAreas.length > 0 && (
//           <View style={[styles.focusAreasIndicator, { backgroundColor: colors.card, borderColor: colors.border }]}>
//             <Text style={[styles.focusAreasTitle, { color: colors.text }]}>Focus Areas:</Text>
//             <View style={styles.focusAreasTags}>
//               {selectedFocusAreas.map((area, index) => (
//                 <View key={index} style={[styles.focusAreaTag, { backgroundColor: colors.primary + '15' }]}>
//                   <Text style={[styles.focusAreaTagText, { color: colors.primary }]}>
//                     {area.charAt(0).toUpperCase() + area.slice(1).replace('_', ' ')}
//                   </Text>
//                 </View>
//               ))}
//             </View>
//           </View>
//         )}

//         {/* Game Type Indicator */}
//         <View style={styles.gameTypeIndicator}>
//           <View style={[
//             styles.gameTypeBadge, 
//             { backgroundColor: gameType === 'cash' ? '#1a73e8' : '#ea4335' }
//           ]}>
//             <Text style={[styles.gameTypeText, { color: 'white' }]}>
//               {gameType === 'cash' ? '💰 Cash Game' : '🏆 Tournament'}
//             </Text>
//           </View>
//         </View>

//         {/* Poker Table */}
//         <View style={[styles.pokerTable, { backgroundColor: colors.card, borderColor: colors.border }]}>
//           <View style={styles.board}>
//             <Text style={[styles.boardLabel, { color: colors.text }]}>Board</Text>
//             <View style={styles.boardCards}>
//               {currentHand.board.map((card, index) => (
//                 <View key={index} style={styles.card}>
//                   <Text style={styles.cardText}>{card}</Text>
//                 </View>
//               ))}
//             </View>
//           </View>

//           <View style={styles.heroCards}>
//             <Text style={[styles.heroLabel, { color: colors.text }]}>Your Cards</Text>
//             <View style={styles.heroCardContainer}>
//               {currentHand.heroCards.map((card, index) => (
//                 <View key={index} style={[styles.card, styles.heroCard]}>
//                   <Text style={styles.cardText}>{card}</Text>
//                 </View>
//               ))}
//             </View>
//           </View>
//         </View>

//         {/* Action Description */}
//         <View style={[styles.actionSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
//           <Text style={[styles.actionText, { color: colors.text }]}>{currentHand.action}</Text>
//           <Text style={[styles.questionText, { color: colors.textSecondary }]}>What's your optimal decision?</Text>
//         </View>

//         {/* Action Buttons */}
//         <View style={[styles.actionButtons, { borderColor: colors.border }]}>
//           {actions.map((action) => (
//             <TouchableOpacity
//               key={action.id}
//               style={[
//                 styles.actionButton,
//                 { backgroundColor: action.color },
//                 selectedAction === action.id && styles.selectedAction
//               ]}
//               onPress={() => handleActionPress(action.id)}
//               disabled={showResult}
//             >
//               <Text style={[styles.actionButtonText, { color: 'white' }]}>{action.label}</Text>
//             </TouchableOpacity>
//           ))}
//         </View>

//         {/* Result Feedback */}
//         {showResult && (
//           <View style={[styles.resultSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
//             <Text style={[styles.resultText, { color: colors.text }]}>{getResultMessage()}</Text>
//             <TouchableOpacity style={[styles.nextHandButton, { backgroundColor: colors.primary }]} onPress={nextHand}>
//               <Text style={[styles.nextHandText, { color: 'white' }]}>Next Hand</Text>
//             </TouchableOpacity>
//           </View>
//         )}

//         {/* Statistics */}
//         <View style={[styles.statsSection, { borderColor: colors.border }]}>
//           <Text style={[styles.statsTitle, { color: colors.text }]}>Session Stats</Text>
//           <View style={styles.statsGrid}>
//             <View style={styles.statItem}>
//               <View style={[styles.statIconContainer, { backgroundColor: sessionStats.accuracy >= 70 ? '#dcfce7' : '#fef3c7' }]}>
//                 <Ionicons 
//                   name="analytics" 
//                   size={24} 
//                   color={sessionStats.accuracy >= 70 ? '#22c55e' : '#f59e0b'} 
//                 />
//               </View>
//               <Text style={[
//                 styles.statValue, 
//                 { color: sessionStats.accuracy >= 70 ? '#22c55e' : '#f59e0b' }
//               ]}>
//                 {sessionStats.accuracy}%
//               </Text>
//               <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Overall Accuracy</Text>
//             </View>
//             <View style={styles.statItem}>
//               <View style={[styles.statIconContainer, { backgroundColor: '#dbeafe' }]}>
//                 <MaterialIcons name="casino" size={24} color="#3b82f6" />
//               </View>
//               <Text style={[styles.statValue, { color: '#3b82f6' }]}>{sessionStats.hands}</Text>
//               <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Hands Played</Text>
//             </View>
//             <View style={styles.statItem}>
//               <View style={[styles.statIconContainer, { backgroundColor: '#f3e8ff' }]}>
//                 <Ionicons name="checkmark-circle" size={24} color="#8b5cf6" />
//               </View>
//               <Text style={[styles.statValue, { color: '#8b5cf6' }]}>{sessionStats.correct}</Text>
//               <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Correct Decisions</Text>
//             </View>
//           </View>
//         </View>
//       </ScrollView>
//     </ThemedView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8fafc',
//   },
//   scrollView: {
//     flex: 1,
//     paddingTop: 60,
//   },
//   header: {
//     paddingHorizontal: 20,
//     paddingBottom: 24,
//     alignItems: 'center',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     // color: "#3b82f6",
//     // color: '#1f2937',
//     marginBottom: 4,
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#6b7280',
//     textAlign: 'center',
//   },
//   gameInfo: {
//     marginHorizontal: 20,
//     marginBottom: 24,
//     backgroundColor: 'white',
//     borderRadius: 20,
//     padding: 24,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 12,
//     elevation: 6,
//     borderWidth: 2,
//   },
//   infoGrid: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     flexWrap: 'wrap',
//     gap: 20,
//   },
//   infoItem: {
//     flex: 1,
//     minWidth: '45%',
//     alignItems: 'center',
//     borderRadius: 12,
//     padding: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(0,0,0,0.06)',
//   },
//   infoLabel: {
//     fontSize: 12,
//     marginBottom: 6,
//     fontWeight: '600',
//     textTransform: 'uppercase',
//     letterSpacing: 0.5,
//   },
//   infoValue: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#1e293b',
//   },
//   gameTypeIndicator: {
//     alignItems: 'center',
//     marginBottom: 24,
//     paddingHorizontal: 20,
//     marginTop: -12,
//   },
//   gameTypeBadge: {
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 30,
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     elevation: 5,
//     borderWidth: 2,
//     borderColor: 'rgba(255,255,255,0.2)',
//   },
//   gameTypeText: {
//     color: 'white',
//     fontSize: 15,
//     fontWeight: '700',
//     letterSpacing: 0.8,
//   },
//   pokerTable: {
//     backgroundColor: '#0f5132',
//     marginHorizontal: 20,
//     borderRadius: 20,
//     padding: 24,
//     marginBottom: 24,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 12,
//     elevation: 6,
//   },
//   board: {
//     alignItems: 'center',
//     marginBottom: 32,
//   },
//   boardLabel: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '700',
//     marginBottom: 16,
//     letterSpacing: 0.5,
//   },
//   boardCards: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   heroCards: {
//     alignItems: 'center',
//   },
//   heroLabel: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '700',
//     marginBottom: 16,
//     letterSpacing: 0.5,
//   },
//   heroCardContainer: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   card: {
//     backgroundColor: 'white',
//     borderRadius: 12,
//     padding: 14,
//     minWidth: 56,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.2,
//     shadowRadius: 6,
//     elevation: 4,
//   },
//   heroCard: {
//     backgroundColor: '#fef3c7',
//     borderWidth: 2,
//     borderColor: '#f59e0b',
//     shadowColor: '#f59e0b',
//     shadowOpacity: 0.3,
//   },
//   cardText: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#1f2937',
//   },
//   actionSection: {
//     paddingHorizontal: 20,
//     marginBottom: 24,
//     alignItems: 'center',
//     backgroundColor: 'white',
//     marginHorizontal: 20,
//     borderRadius: 16,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   actionText: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#1f2937',
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   questionText: {
//     fontSize: 16,
//     color: '#6b7280',
//     textAlign: 'center',
//   },
//   actionButtons: {
//     flexDirection: 'row',
//     paddingHorizontal: 20,
//     gap: 12,
//     marginBottom: 24,
//   },
//   actionButton: {
//     flex: 1,
//     paddingVertical: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.15,
//     shadowRadius: 6,
//     elevation: 4,
//   },
//   selectedAction: {
//     transform: [{ scale: 0.95 }],
//     shadowOpacity: 0.25,
//   },
//   actionButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '700',
//     letterSpacing: 0.3,
//   },
//   resultSection: {
//     paddingHorizontal: 20,
//     marginBottom: 24,
//     alignItems: 'center',
//     backgroundColor: 'white',
//     marginHorizontal: 20,
//     borderRadius: 16,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   resultText: {
//     fontSize: 18,
//     fontWeight: '600',
//     marginBottom: 16,
//     textAlign: 'center',
//     color: '#1f2937',
//   },
//   nextHandButton: {
//     backgroundColor: '#1a73e8',
//     paddingHorizontal: 32,
//     paddingVertical: 14,
//     borderRadius: 24,
//     shadowColor: '#1a73e8',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.3,
//     shadowRadius: 6,
//     elevation: 4,
//   },
//   nextHandText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '700',
//     letterSpacing: 0.3,
//   },
//   statsSection: {
//     paddingHorizontal: 20,
//     marginBottom: 80,
//   },
//   statsTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#1f2937',
//     marginBottom: 16,
//   },
//   statsGrid: {
//     flexDirection: 'row',
//     backgroundColor: 'white',
//     borderRadius: 16,
//     padding: 20,
//     gap: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   statItem: {
//     flex: 1,
//     alignItems: 'center',
//   },
//   statIconContainer: {
//     marginBottom: 8,
//     borderRadius: 12,
//     padding: 10,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   statValue: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 4,
//   },
//   statLabel: {
//     fontSize: 12,
//     color: '#6b7280',
//     textAlign: 'center',
//     fontWeight: '500',
//   },
//   // Session Timer Styles
//   sessionTimer: {
//     marginHorizontal: 20,
//     marginBottom: 20,
//     padding: 16,
//     borderRadius: 12,
//     borderWidth: 1,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   timerHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   timerTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   timerTime: {
//     fontSize: 18,
//     fontWeight: '700',
//     fontFamily: 'monospace',
//   },
//   timerProgress: {
//     gap: 8,
//   },
//   timerProgressBar: {
//     height: 6,
//     borderRadius: 3,
//     overflow: 'hidden',
//   },
//   timerProgressFill: {
//     height: '100%',
//     borderRadius: 3,
//     // transition: 'width 0.3s ease',
//   },
//   timerRemaining: {
//     fontSize: 12,
//     textAlign: 'center',
//     fontWeight: '500',
//   },
//   // Focus Areas Styles
//   focusAreasIndicator: {
//     marginHorizontal: 20,
//     marginBottom: 20,
//     padding: 16,
//     borderRadius: 12,
//     borderWidth: 1,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   focusAreasTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     marginBottom: 8,
//   },
//   focusAreasTags: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//   },
//   focusAreaTag: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: 'transparent',
//   },
//   focusAreaTagText: {
//     fontSize: 12,
//     fontWeight: '600',
//   },
// });