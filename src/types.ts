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
  | 'lexis_round_end';

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
  gameMode?: 'truth' | 'lexis';
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
}
