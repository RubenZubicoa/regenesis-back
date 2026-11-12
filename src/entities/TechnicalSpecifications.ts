import { ObjectId } from "mongodb";

export const TECHNICAL_SPECIFICATIONS_COLLECTION = "TechnicalSpecifications";

export interface TechnicalSpecifications {
  _id: ObjectId;
  clientId: string;
  personalHistory: PersonalHistory;
  eatingHabits: EatingHabits;
  lifestyle: Lifestyle;
  exerciseHabits: ExerciseHabits;
  dailyRecall: DailyRecall;
  expectations: string;
  laboralHabits: LaboralHabits;
  observations: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PersonalHistory = {
  diseases: string;
  injuries: string;
  medications: string;
  supplements: string;
  allergies: string;
  bowelHabit: string;
  contraceptives: string;
};

export type EatingHabits = {
  numberOfMeals: string;
  snacks: string;
  drinks: string;
  bread: string;
  favoriteFoods: string;
  rejectedFoods: string;
};

export type Lifestyle = {
  smoking: string;
  alcohol: string;
  sleep: string;
  waterIntake: string;
};

export type ExerciseHabits = {
  sport: string;
  exerciseFrequency: string;
  strengthLevel: string;
  strengthTrainingFrequency: string;
  material: string;
};

export type DailyRecallEntry = {
  ingredients: string;
  quantities: string;
  timeAndPlace: string;
};

export type DailyRecall = {
  breakfast: DailyRecallEntry;
  morningSnack: DailyRecallEntry;
  lunch: DailyRecallEntry;
  afternoonSnack: DailyRecallEntry;
  dinner: DailyRecallEntry;
};

export type Job = 'Activo' | 'Sedentario'

export type LaboralHabits = {
  job: Job;
  schedule: string;
}


/** Datos para crear una ficha técnica (sin `_id`). */
export type CreateTechnicalSpecificationsInput = Omit<
  TechnicalSpecifications,
  "_id" | "createdAt" | "updatedAt"
> & {
  createdAt?: Date;
  updatedAt?: Date;
};

/** Datos parciales para actualizar una ficha técnica. */
export type UpdateTechnicalSpecificationsInput = Partial<
  Omit<TechnicalSpecifications, "_id" | "createdAt">
>;
