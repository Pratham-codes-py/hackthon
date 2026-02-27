// User and Auth Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  points: number;
  level: number;
  streak: number;
  memberSince: string;
  totalCO2Saved: number;
  actionsCompleted: number;
}

// Footprint Types
export interface FootprintEntry {
  id: string;
  date: string;
  total: number;
  transport: number;
  energy: number;
  diet: number;
  waste: number;
  actionsActive: string[];
}

export interface FootprintData {
  month: string;
  value: number;
  projected?: boolean;
}

// Form Types
export interface TransportData {
  carMilesPerWeek: number;
  transitRidesPerWeek: number;
  flightsPerYear: number;
}

export interface EnergyData {
  kwhPerMonth: number;
  heatingType: "natural_gas" | "oil" | "electric" | "renewable";
}

export interface DietData {
  type: "meat_lover" | "average" | "vegetarian" | "vegan";
}

export interface WasteData {
  recyclingFrequency: "always" | "sometimes" | "never";
  composting: boolean;
}

export interface FootprintInputData {
  transport: TransportData;
  energy: EnergyData;
  diet: DietData;
  waste: WasteData;
}

// AI Suggestion Types
export interface AISuggestion {
  id: string;
  category: "transport" | "energy" | "diet" | "waste" | "lifestyle";
  title: string;
  description: string;
  shortDescription: string;
  savingsPerYear: number;
  costSavingsPerYear?: number;
  difficulty: "easy" | "medium" | "hard";
  timeToImplement: string;
  whyItWorks: string;
  icon: string;
  selected?: boolean;
}

// Badge / Achievement Types
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  category: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

// Leaderboard Types
export interface LeaderboardEntry {
  rank: number;
  username: string;
  reductionPercent: number;
  badge: string;
  isCurrentUser?: boolean;
  co2Saved: number;
}

// Chart Types
export interface ChartDataPoint {
  month: string;
  historical?: number;
  projected?: number;
  baseline?: number;
  withStrategies?: number;
  stretch?: number;
}

// Simulation Types
export interface SimulationResult {
  totalSavings: number;
  monthlyData: ChartDataPoint[];
  equivalents: string[];
}

// Notification Types
export interface Notification {
  id: string;
  message: string;
  type: "achievement" | "tip" | "reminder" | "milestone";
  read: boolean;
  createdAt: string;
}
