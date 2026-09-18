export type CardSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export interface Card {
  suit: CardSuit;
  value: string; // '2'-'10', 'J', 'Q', 'K', 'A'
  numericValue: number; // 2-10, 10 for J/Q/K, 11 for A
  hidden?: boolean;
}

export type Player21Status =
  | 'waiting'
  | 'betting'
  | 'playing'
  | 'stand'
  | 'bust'
  | 'blackjack';

export interface Cyber21Dealer {
  hand: Card[];
  handValue: number;
  status: 'idle' | 'drawing' | 'stand' | 'bust' | 'blackjack';
}

export interface Cyber21Log {
  id: string;
  text: string;
  timestamp: number;
  type: 'dealer' | 'player' | 'system';
}

export interface CyberBombLog {
  id: string;
  type: 'explosion' | 'transfer' | 'chat' | 'system';
  title?: string;
  text: string;
  timestamp: number;
  senderName?: string;
}

export interface Player {
  id: string; // Socket ID
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
  jokers: {
    pass: number;
    changeQuestion: number;
  };
  // Cyber-21 Tournament Mode fields
  chips?: number;
  currentBet?: number;
  hand?: Card[];
  handValue?: number;
  status21?: Player21Status;
  roundResult?: 'win' | 'lose' | 'push' | 'blackjack' | null;
  payout?: number;
  // Cyber-Bomb Mode fields
  lives?: number;
  maxLives?: number;
  isEliminated?: boolean;
  rp?: number;
}

export type GamePhase =
  | 'lobby'
  | 'spin_questioner'
  | 'spin_answerer'
  | 'choose_type'
  | 'ask_question'
  | 'wait_answer'
  | 'dare_proof'
  | 'dare_vote'
  | 'round_end'
  | 'game_over'
  | 'lexis_playing'
  | 'lexis_write'
  | 'lexis_guess'
  | 'lexis_round_end'
  | 'cyber21_betting'
  | 'cyber21_dealing'
  | 'cyber21_player_turns'
  | 'cyber21_dealer_turn'
  | 'cyber21_round_end'
  | 'cyberbomb_playing'
  | 'cyberbomb_round_end';

export interface ChatMessage {
  id: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface RoomSettings {
  rounds: number;
  passJokers: number;
  changeJokers: number;
  isPrivate?: boolean;
  maxPlayers?: number;
  timeLimit?: number;
  sfx?: boolean;
  gameMode?: 'truth' | 'lexis' | 'cyber21' | 'cyberbomb';
  startingChips?: number;
}

export interface Room {
  id: string;
  settings: RoomSettings;
  players: Player[];
  phase: GamePhase;
  currentRound: number;
  questionerId: string | null;
  answererId: string | null;
  selectedType: 'truth' | 'dare' | null;
  question: string | null;
  proofMedia: string | null;
  votes: Record<string, 'approve' | 'reject'>; // voterId -> vote
  bets: Record<string, string>; // bettorId -> bet value (e.g. 'truth' or 'dare')
  chat: ChatMessage[];
  answerText?: string | null;
  dareResult?: 'approved' | 'rejected' | 'passed' | null;
  readyForNextRound?: string[];
  lexisSubmissions?: Record<string, {word: string, hint: string, targetId?: string}>;
  lexisAssignments?: Record<string, string>; // guesserId -> writerId
  lexisGuesses?: Record<string, string[]>;
  lexisCorrectGuesserIds?: string[];
  // Cyber-21 fields
  cyber21Dealer?: Cyber21Dealer;
  cyber21TurnPlayerId?: string | null;
  cyber21BetTimeLeft?: number;
  cyber21Logs?: Cyber21Log[];
  cyber21InitialChips?: number;
  // Cyber-Bomb fields
  bombHolderId?: string | null;
  bombTimeLeft?: number;
  bombMaxTime?: number;
  bombPassStreak?: number;
  bombLastWord?: string;
  bombRequiredLetter?: string;
  bombUsedWords?: string[];
  bombExplosionCount?: number;
  bombLogs?: CyberBombLog[];
  bombStatus?: 'ticking' | 'exploded' | 'transferred';
  bombHints?: string[];
}
