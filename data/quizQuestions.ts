export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct answer (0-3)
  explanation: string;
  category: 'preflop' | 'postflop' | 'theory' | 'ranges' | 'betting';
}

export interface DailyQuiz {
  date: string;
  questions: QuizQuestion[];
}

// Pool of 150+ questions that rotate daily
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // Preflop Questions
  {
    id: 1,
    question: "What is the optimal 3-bet range from the Big Blind vs UTG open in 6-max?",
    options: ["AA-QQ, AK", "AA-JJ, AKs-AQs, AKo", "AA-TT, AK-AJ, KQs", "AA-99, AKs-A9s, AKo-AJo"],
    correctAnswer: 1,
    explanation: "The BB should 3-bet a polarized range against UTG, including premium hands and some suited aces for balance.",
    category: "preflop"
  },
  {
    id: 2,
    question: "In a 100bb cash game, what's the standard open-raise size from UTG?",
    options: ["2bb", "2.5bb", "3bb", "3.5bb"],
    correctAnswer: 1,
    explanation: "2.5bb is the standard open size in modern poker, balancing between building the pot and maintaining fold equity.",
    category: "preflop"
  },
  {
    id: 3,
    question: "Which hands should you fold from the Small Blind vs a Button open?",
    options: ["Only 72o-32o", "All offsuit hands except broadways", "Weak suited hands like 63s-92s", "Most hands except top 40%"],
    correctAnswer: 2,
    explanation: "From SB vs BTN, you should fold weak suited connectors and one-gappers due to poor post-flop playability.",
    category: "preflop"
  },
  {
    id: 4,
    question: "What's the minimum 4-bet range from UTG vs CO 3-bet?",
    options: ["AA-KK only", "AA-QQ, AK", "AA-JJ, AKs", "AA-TT, AK-AQ"],
    correctAnswer: 1,
    explanation: "UTG should have a tight 4-bet range against CO 3-bet, focusing on premium hands that play well in 4-bet pots.",
    category: "preflop"
  },
  {
    id: 5,
    question: "When should you flat call a 3-bet instead of 4-betting with QQ?",
    options: ["Never, always 4-bet QQ", "Against tight players only", "When deep stacked (200bb+)", "In position against loose 3-bettors"],
    correctAnswer: 3,
    explanation: "QQ can flat call 3-bets in position to realize equity post-flop, especially against wide 3-betting ranges.",
    category: "preflop"
  },

  // Postflop Questions
  {
    id: 6,
    question: "On A♠7♣2♦, you have K♠Q♠ as the preflop aggressor. What's your best action?",
    options: ["Bet for value", "Check-call", "Check-fold", "Bet as a bluff"],
    correctAnswer: 3,
    explanation: "KQ has good equity with backdoor draws and should bet as a bluff on this dry ace-high board.",
    category: "postflop"
  },
  {
    id: 7,
    question: "What's the optimal c-bet size on K♥9♠4♣ as the preflop raiser?",
    options: ["25% pot", "33% pot", "50% pot", "75% pot"],
    correctAnswer: 1,
    explanation: "On dry boards like K94 rainbow, a small 25-33% c-bet is optimal to build the pot with your strong hands.",
    category: "postflop"
  },
  {
    id: 8,
    question: "You have A♠A♥ on 9♠8♠7♣. Opponent bets pot. What should you do?",
    options: ["Fold", "Call", "Raise small", "Raise large"],
    correctAnswer: 1,
    explanation: "AA should call to keep in opponent's bluffs while maintaining pot control against strong draws.",
    category: "postflop"
  },
  {
    id: 9,
    question: "On which texture should you check your entire range as the preflop aggressor?",
    options: ["A♠A♥7♣", "K♠Q♠J♣", "9♠8♠7♣", "A♠K♥2♣"],
    correctAnswer: 2,
    explanation: "On KQJ with two suits, both players have many strong hands and draws, favoring a check-heavy strategy.",
    category: "postflop"
  },
  {
    id: 10,
    question: "What's the key factor in deciding bet size on the river?",
    options: ["Pot size", "Stack depth", "Opponent's calling range", "Board texture"],
    correctAnswer: 2,
    explanation: "River bet sizing should be based on what hands your opponent can call with to maximize value or fold equity.",
    category: "postflop"
  },

  // Theory Questions
  {
    id: 11,
    question: "What does 'minimum defense frequency' refer to in poker theory?",
    options: ["How often to call vs bluffs", "Minimum hands needed to continue", "Pot odds calculation", "Required calling frequency to prevent exploitation"],
    correctAnswer: 3,
    explanation: "MDF is the minimum frequency you must continue to prevent your opponent from profitably bluffing any two cards.",
    category: "theory"
  },
  {
    id: 12,
    question: "In Game Theory Optimal play, what should your strategy be based on?",
    options: ["Opponent's tendencies", "Maximizing expected value", "Unexploitable balance", "Stack sizes"],
    correctAnswer: 2,
    explanation: "GTO strategy aims to be unexploitable by balancing value bets and bluffs optimally.",
    category: "theory"
  },
  {
    id: 13,
    question: "What is 'polarization' in poker strategy?",
    options: ["Playing only premium hands", "Betting with strong hands and bluffs only", "Avoiding medium-strength hands", "Playing tight-aggressive"],
    correctAnswer: 1,
    explanation: "Polarization means betting with your strongest hands and best bluffs while checking medium-strength hands.",
    category: "theory"
  },
  {
    id: 14,
    question: "What does ICM stand for and when is it most important?",
    options: ["Independent Chip Model - always important", "Internal Chip Management - in cash games", "Independent Chip Model - in tournaments", "Immediate Cash Model - when short-stacked"],
    correctAnswer: 2,
    explanation: "ICM (Independent Chip Model) is crucial in tournaments where chip value changes based on payout structure.",
    category: "theory"
  },
  {
    id: 15,
    question: "What is the Nash equilibrium in poker?",
    options: ["Perfect balance of value and bluffs", "Strategy where no player can improve by changing", "Optimal preflop ranges", "50/50 betting frequency"],
    correctAnswer: 1,
    explanation: "Nash equilibrium is a strategy profile where no player can unilaterally deviate and improve their payoff.",
    category: "theory"
  },

  // Ranges Questions
  {
    id: 16,
    question: "What percentage of hands should UTG open in a 6-max game?",
    options: ["8-10%", "12-15%", "18-22%", "25-30%"],
    correctAnswer: 1,
    explanation: "UTG should open around 12-15% of hands, focusing on premium pairs, broadways, and suited connectors.",
    category: "ranges"
  },
  {
    id: 17,
    question: "How should your calling range change when facing a 3-bet out of position?",
    options: ["Call wider for pot odds", "Call tighter due to positional disadvantage", "Call the same range", "Only call premium hands"],
    correctAnswer: 1,
    explanation: "Out of position, you should tighten your calling range and favor 4-betting or folding over calling.",
    category: "ranges"
  },
  {
    id: 18,
    question: "What hands should you never fold preflop in a cash game?",
    options: ["AA-QQ only", "AA-JJ, AK", "AA-TT, AK-AQ", "Top 5% of hands"],
    correctAnswer: 1,
    explanation: "AA-JJ and AK are strong enough to never fold preflop in cash games, even against 4-bets.",
    category: "ranges"
  },
  {
    id: 19,
    question: "Which position should have the widest opening range?",
    options: ["UTG", "MP", "CO", "Button"],
    correctAnswer: 3,
    explanation: "The Button has the widest opening range due to positional advantage and only having to get through the blinds.",
    category: "ranges"
  },
  {
    id: 20,
    question: "What's the optimal defending range from BB vs SB open?",
    options: ["Top 30%", "Top 40%", "Top 50%", "Top 60%"],
    correctAnswer: 2,
    explanation: "BB should defend around 40-50% of hands against SB open due to good pot odds and positional advantage postflop.",
    category: "ranges"
  },

  // Betting Questions
  {
    id: 21,
    question: "What's the primary purpose of a small c-bet (25-33% pot)?",
    options: ["Build pot with strong hands", "Bluff efficiently", "Get value from weak hands", "Control pot size"],
    correctAnswer: 0,
    explanation: "Small c-bets are primarily used to build the pot with strong hands while maintaining a balanced range.",
    category: "betting"
  },
  {
    id: 22,
    question: "When should you use a large bet size (75%+ pot) on the river?",
    options: ["Always with strong hands", "When polarized", "Against calling stations", "With medium-strength hands"],
    correctAnswer: 1,
    explanation: "Large river bets should be used when your range is polarized between very strong hands and bluffs.",
    category: "betting"
  },
  {
    id: 23,
    question: "What's the optimal bluff-to-value ratio for a pot-sized bet?",
    options: ["1:1", "1:2", "2:3", "1:3"],
    correctAnswer: 1,
    explanation: "For a pot-sized bet, the optimal ratio is 1 bluff for every 2 value bets to make opponent indifferent.",
    category: "betting"
  },
  {
    id: 24,
    question: "Why might you choose to check-call instead of betting with a strong hand?",
    options: ["To trap opponent", "Pot control", "Induce bluffs", "All of the above"],
    correctAnswer: 3,
    explanation: "Check-calling with strong hands can trap, control pot size, and induce bluffs from opponent's weak hands.",
    category: "betting"
  },
  {
    id: 25,
    question: "What should determine your bet sizing on the flop?",
    options: ["Your hand strength", "Board texture", "Opponent type", "Stack depth"],
    correctAnswer: 1,
    explanation: "Board texture is the primary factor - bet smaller on dry boards and larger on wet, connected boards.",
    category: "betting"
  },

  // Additional questions to reach 30+ for variety
  {
    id: 26,
    question: "In a tournament, when does fold equity become most important?",
    options: ["Early stages", "Middle stages", "Final table", "Short-stacked situations"],
    correctAnswer: 3,
    explanation: "Fold equity becomes crucial when short-stacked as you need opponents to fold to win pots.",
    category: "theory"
  },
  {
    id: 27,
    question: "What's the most important factor when deciding to call a river bet?",
    options: ["Pot odds", "Opponent's range", "Your hand strength", "Betting pattern"],
    correctAnswer: 1,
    explanation: "Understanding opponent's value and bluff range is crucial for making correct river calling decisions.",
    category: "postflop"
  },
  {
    id: 28,
    question: "Which hand has the best equity against AA preflop?",
    options: ["KK", "AKs", "QQ", "87s"],
    correctAnswer: 1,
    explanation: "AKs has the best equity against AA (~31%) due to straight and flush potential plus ace outs.",
    category: "preflop"
  },
  {
    id: 29,
    question: "What's the key difference between cash games and tournament strategy?",
    options: ["Betting sizes", "Hand selection", "Chip value changes", "Position importance"],
    correctAnswer: 2,
    explanation: "In tournaments, chip values change due to ICM considerations and payout structures.",
    category: "theory"
  },
  {
    id: 30,
    question: "On a monotone flop, how should you adjust your c-betting strategy?",
    options: ["Bet larger", "Bet smaller", "Check more", "Bet more frequently"],
    correctAnswer: 2,
    explanation: "On monotone flops, both players have many draws, so checking more often is optimal.",
    category: "postflop"
  }
];

/**
 * Get 15 random questions for today's quiz based on date
 * This ensures the same questions appear for all users on the same day
 */
export const getDailyQuiz = (date: Date = new Date()): DailyQuiz => {
  // Use date as seed for consistent daily questions
  const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
  const seed = dateString.split('-').reduce((acc, val) => acc + parseInt(val), 0);
  
  // Simple seeded random function
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  
  // Shuffle questions based on date seed
  const shuffledQuestions = [...QUIZ_QUESTIONS];
  for (let i = shuffledQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [shuffledQuestions[i], shuffledQuestions[j]] = [shuffledQuestions[j], shuffledQuestions[i]];
  }
  
  // Select first 15 questions
  return {
    date: dateString,
    questions: shuffledQuestions.slice(0, 15)
  };
};

/**
 * Calculate quiz score and determine if user gets reward
 */
export const calculateQuizResult = (answers: number[], correctAnswers: number[]) => {
  const correctCount = answers.reduce((count, answer, index) => {
    return answer === correctAnswers[index] ? count + 1 : count;
  }, 0);
  
  const score = Math.round((correctCount / answers.length) * 100);
  const passed = score >= 80;
  const reward = passed ? 15 : 0; // 15 availableUsage points for 80%+ score
  
  return {
    correctCount,
    totalQuestions: answers.length,
    score,
    passed,
    reward
  };
};
