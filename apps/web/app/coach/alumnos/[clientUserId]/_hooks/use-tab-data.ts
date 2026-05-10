import { useHealthData } from "./use-health-data";
import { useFoodData } from "./use-food-data";
import { useGoalsData } from "./use-goals-data";
import { useSummaryData } from "./use-summary-data";
import type { HealthData, FoodItem, GoalItem, WeeklySummary, CoachNote } from "../_components/_types";

export interface TabData {
  // Health
  health: HealthData | null;
  healthLoading: boolean;
  loadHealthData: (force?: boolean) => Promise<void>;
  noteDay: string;
  setNoteDay: React.Dispatch<React.SetStateAction<string>>;
  noteText: string;
  setNoteText: React.Dispatch<React.SetStateAction<string>>;
  savingNote: boolean;
  saveCoachNote: () => Promise<void>;
  notesForDay: CoachNote[];
  // Food
  food: FoodItem[] | null;
  foodLoading: boolean;
  foodCommentDrafts: Record<string, string>;
  setFoodCommentDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  loadFoodData: (force?: boolean) => Promise<void>;
  postFoodComment: (foodId: string) => Promise<void>;
  // Goals
  goals: GoalItem[] | null;
  goalsShared: boolean | null;
  goalsLoading: boolean;
  goalKind: string;
  setGoalKind: React.Dispatch<React.SetStateAction<string>>;
  goalTarget: string;
  setGoalTarget: React.Dispatch<React.SetStateAction<string>>;
  loadGoalsData: (force?: boolean) => Promise<void>;
  addGoal: () => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  // Summary
  summary: WeeklySummary | null;
  summaryLoading: boolean;
  loadSummaryData: (force?: boolean) => Promise<void>;
}

export function useTabData(clientUserId: string): TabData {
  const healthData = useHealthData(clientUserId);
  const foodData = useFoodData(clientUserId);
  const goalsData = useGoalsData(clientUserId);
  const summaryData = useSummaryData(clientUserId);

  return { ...healthData, ...foodData, ...goalsData, ...summaryData };
}
