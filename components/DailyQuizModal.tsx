import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDailyQuiz, calculateQuizResult, QuizQuestion, DailyQuiz } from '@/data/quizQuestions';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

interface DailyQuizModalProps {
  visible: boolean;
  onClose: () => void;
  onRewardEarned: (points: number) => void;
}

interface QuizState {
  currentQuestionIndex: number;
  answers: number[];
  isCompleted: boolean;
  showResult: boolean;
}

const DailyQuizModal: React.FC<DailyQuizModalProps> = ({ visible, onClose, onRewardEarned }) => {
  const [quiz, setQuiz] = useState<DailyQuiz | null>(null);
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestionIndex: 0,
    answers: [],
    isCompleted: false,
    showResult: false
  });
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasCompletedToday, setHasCompletedToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user has already completed quiz today
  useEffect(() => {
    if (visible) {
      checkDailyCompletion();
      loadDailyQuiz();
    }
  }, [visible]);

  const checkDailyCompletion = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const lastCompletedDate = await AsyncStorage.getItem('dailyQuizCompleted');
      setHasCompletedToday(lastCompletedDate === today);
    } catch (error) {
      console.error('Error checking daily completion:', error);
    }
  };

  const loadDailyQuiz = () => {
    setIsLoading(true);
    try {
      const dailyQuiz = getDailyQuiz();
      setQuiz(dailyQuiz);
      setQuizState({
        currentQuestionIndex: 0,
        answers: [],
        isCompleted: false,
        showResult: false
      });
      setSelectedOption(null);
    } catch (error) {
      console.error('Error loading daily quiz:', error);
      Alert.alert('Error', 'Failed to load daily quiz. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
  };

  const handleNextQuestion = () => {
    if (selectedOption === null) {
      Alert.alert('Please select an answer', 'You must choose an option before proceeding.');
      return;
    }

    const newAnswers = [...quizState.answers, selectedOption];
    const nextQuestionIndex = quizState.currentQuestionIndex + 1;

    if (nextQuestionIndex >= (quiz?.questions.length || 0)) {
      // Quiz completed
      finishQuiz(newAnswers);
    } else {
      // Move to next question
      setQuizState({
        ...quizState,
        currentQuestionIndex: nextQuestionIndex,
        answers: newAnswers
      });
      setSelectedOption(null);
    }
  };

  const finishQuiz = async (finalAnswers: number[]) => {
    if (!quiz) return;

    const correctAnswers = quiz.questions.map(q => q.correctAnswer);
    const result = calculateQuizResult(finalAnswers, correctAnswers);

    setQuizState({
      ...quizState,
      answers: finalAnswers,
      isCompleted: true,
      showResult: true
    });

    // Mark as completed for today
    try {
      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem('dailyQuizCompleted', today);
      setHasCompletedToday(true);

      // Award points if passed
      if (result.passed) {
        onRewardEarned(result.reward);
      }
    } catch (error) {
      console.error('Error saving quiz completion:', error);
    }
  };

  const handleClose = () => {
    setQuizState({
      currentQuestionIndex: 0,
      answers: [],
      isCompleted: false,
      showResult: false
    });
    setSelectedOption(null);
    onClose();
  };

  const renderQuizCompleted = () => {
    return (
      <View style={styles.completedContainer}>
        <Ionicons name="checkmark-circle" size={80} color="#10b981" />
        <Text style={styles.completedTitle}>Quiz Already Completed!</Text>
        <Text style={styles.completedMessage}>
          You've already completed today's quiz. Come back tomorrow for a new set of questions!
        </Text>
        <TouchableOpacity style={styles.completedButton} onPress={handleClose}>
          <Text style={styles.completedButtonText}>OK</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderQuizResult = () => {
    if (!quiz) return null;

    const correctAnswers = quiz.questions.map(q => q.correctAnswer);
    const result = calculateQuizResult(quizState.answers, correctAnswers);

    return (
      <ScrollView style={styles.resultContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.resultHeader}>
          <Ionicons 
            name={result.passed ? "trophy" : "close-circle"} 
            size={60} 
            color={result.passed ? "#f59e0b" : "#ef4444"} 
          />
          <Text style={styles.resultTitle}>
            {result.passed ? "Congratulations!" : "Better Luck Next Time!"}
          </Text>
          <Text style={styles.resultScore}>
            Score: {result.score}% ({result.correctCount}/{result.totalQuestions})
          </Text>
          {result.passed && (
            <Text style={styles.resultReward}>
              🎉 You earned {result.reward} availableUsage points!
            </Text>
          )}
        </View>

        <View style={styles.answersReview}>
          <Text style={styles.reviewTitle}>Review Your Answers:</Text>
          {quiz.questions.map((question, index) => {
            const userAnswer = quizState.answers[index];
            const isCorrect = userAnswer === question.correctAnswer;
            
            return (
              <View key={question.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewQuestionNumber}>Q{index + 1}</Text>
                  <Ionicons 
                    name={isCorrect ? "checkmark-circle" : "close-circle"} 
                    size={20} 
                    color={isCorrect ? "#10b981" : "#ef4444"} 
                  />
                </View>
                <Text style={styles.reviewQuestion}>{question.question}</Text>
                <Text style={[
                  styles.reviewAnswer,
                  { color: isCorrect ? "#10b981" : "#ef4444" }
                ]}>
                  Your answer: {question.options[userAnswer]}
                </Text>
                {!isCorrect && (
                  <Text style={styles.reviewCorrectAnswer}>
                    Correct answer: {question.options[question.correctAnswer]}
                  </Text>
                )}
                <Text style={styles.reviewExplanation}>{question.explanation}</Text>
              </View>
            );
          })}
        </View>

        <TouchableOpacity style={styles.finishButton} onPress={handleClose}>
          <Text style={styles.finishButtonText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderQuestion = () => {
    if (!quiz || !quiz.questions[quizState.currentQuestionIndex]) return null;

    const currentQuestion = quiz.questions[quizState.currentQuestionIndex];
    const progress = ((quizState.currentQuestionIndex + 1) / quiz.questions.length) * 100;

    return (
      <ScrollView style={styles.questionContainer} showsVerticalScrollIndicator={false}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {quizState.currentQuestionIndex + 1} of {quiz.questions.length}
          </Text>
        </View>

        {/* Question */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
          
          {/* Category Badge */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{currentQuestion.category.toUpperCase()}</Text>
          </View>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedOption === index && styles.optionButtonSelected
              ]}
              onPress={() => handleAnswerSelect(index)}
            >
              <View style={styles.optionContent}>
                <View style={[
                  styles.optionIndicator,
                  selectedOption === index && styles.optionIndicatorSelected
                ]}>
                  <Text style={[
                    styles.optionLetter,
                    selectedOption === index && styles.optionLetterSelected
                  ]}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>
                <Text style={[
                  styles.optionText,
                  selectedOption === index && styles.optionTextSelected
                ]}>
                  {option}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Next Button */}
        <TouchableOpacity
          style={[
            styles.nextButton,
            selectedOption === null && styles.nextButtonDisabled
          ]}
          onPress={handleNextQuestion}
          disabled={selectedOption === null}
        >
          <Text style={[
            styles.nextButtonText,
            selectedOption === null && styles.nextButtonTextDisabled
          ]}>
            {quizState.currentQuestionIndex === quiz.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Quiz Challenge</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading today's quiz...</Text>
          </View>
        ) : hasCompletedToday && !quizState.showResult ? (
          renderQuizCompleted()
        ) : quizState.showResult ? (
          renderQuizResult()
        ) : (
          renderQuestion()
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  completedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 20,
    marginBottom: 12,
  },
  completedMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  completedButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  completedButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  questionContainer: {
    flex: 1,
  },
  questionCard: {
    margin: 20,
    padding: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    lineHeight: 26,
    marginBottom: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  optionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  optionButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  optionButtonSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionIndicatorSelected: {
    backgroundColor: '#3b82f6',
  },
  optionLetter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  optionLetterSelected: {
    color: 'white',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
  },
  optionTextSelected: {
    color: '#1f2937',
    fontWeight: '500',
  },
  nextButton: {
    margin: 20,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonTextDisabled: {
    color: '#9ca3af',
  },
  resultContainer: {
    flex: 1,
  },
  resultHeader: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  resultScore: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  resultReward: {
    fontSize: 16,
    color: '#f59e0b',
    fontWeight: '600',
  },
  answersReview: {
    paddingHorizontal: 20,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  reviewItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewQuestionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  reviewQuestion: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 22,
  },
  reviewAnswer: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  reviewCorrectAnswer: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
    marginBottom: 8,
  },
  reviewExplanation: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  finishButton: {
    margin: 20,
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  finishButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DailyQuizModal;
