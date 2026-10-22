export type MatchFormat = 'T20' | 'ODI' | 'Test';
export type MatchStatus = 'live' | 'upcoming' | 'completed';
export type MatchCategory = 'international' | 'league' | 'women';

export interface Player {
  id: string;
  name: string;
  shortName: string;
  country: string;
  team: string;
  role: 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicket-keeper';
  battingStyle: string;
  bowlingStyle?: string;
  age: number;
  matches: number;
  runs: number;
  highestScore: number;
  battingAvg: number;
  strikeRate: number;
  centuries: number;
  fifties: number;
  wickets?: number;
  bestBowling?: string;
  bowlingAvg?: number;
  economy?: number;
  image?: string;
  isCaptain?: boolean;
  isWicketKeeper?: boolean;
}

export interface BatsmanScore {
  playerId: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  out: boolean;
  dismissal?: string;
  isBattingNow?: boolean;
  isStriker?: boolean;
}

export interface BowlerScore {
  playerId: string;
  name: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
  isBowlingNow?: boolean;
}

export interface FallOfWicket {
  score: number;
  wicketNumber: number;
  batsmanName: string;
  over: number;
}

export interface Inning {
  teamId: string;
  teamName: string;
  teamShort: string;
  runs: number;
  wickets: number;
  overs: number;
  maxOvers: number;
  isCompleted: boolean;
  batsmen: BatsmanScore[];
  bowlers: BowlerScore[];
  fallOfWickets: FallOfWicket[];
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    total: number;
  };
}

export interface BallCommentary {
  id: string;
  over: number;
  ball: number; // 1 to 6
  bowlerName: string;
  batsmanName: string;
  runs: number;
  isWicket: boolean;
  wicketType?: string;
  wicketPlayerName?: string;
  isFour: boolean;
  isSix: boolean;
  isExtra: boolean;
  extraType?: 'wide' | 'noBall' | 'bye' | 'legBye';
  commentary: string;
  timestamp: string;
}

export interface Match {
  id: string;
  title: string;
  subtitle: string;
  series: string;
  format: MatchFormat;
  status: MatchStatus;
  category: MatchCategory;
  venue: string;
  date: string;
  time: string;
  toss: string;
  summaryStatus: string;
  teamA: {
    id: string;
    name: string;
    shortName: string;
    flag: string;
    score?: string;
    overs?: string;
    color: string;
  };
  teamB: {
    id: string;
    name: string;
    shortName: string;
    flag: string;
    score?: string;
    overs?: string;
    color: string;
  };
  currentInningIndex: number;
  innings: Inning[];
  commentary: BallCommentary[];
  winProbability: {
    teamA: number; // percentage 0-100
    teamB: number;
  };
  targetRuns?: number;
  requiredRunRate?: number;
  currentRunRate: number;
  playerOfTheMatch?: string;
}

export interface Standing {
  rank: number;
  teamName: string;
  teamShort: string;
  flag: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  nr: number;
  points: number;
  nrr: string;
  form: ('W' | 'L' | 'D' | 'NR')[];
}

export interface PlayerRanking {
  rank: number;
  change: 'up' | 'down' | 'same';
  changeCount?: number;
  name: string;
  country: string;
  countryShort: string;
  points: number;
  ratingHistory?: number[];
}

export interface NewsArticle {
  id: string;
  title: string;
  snippet: string;
  fullContent: string;
  author: string;
  category: 'Match Report' | 'Exclusive' | 'Fantasy Tips' | 'Analysis' | 'Interviews';
  publishedAt: string;
  readTime: string;
  imageUrl: string;
  relatedMatchId?: string;
}

export interface FantasySelectedPlayer extends Player {
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  creditCost: number;
}
