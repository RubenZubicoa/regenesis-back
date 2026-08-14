import { ObjectId } from "mongodb";

import type { WorkoutMedia } from "./WorkoutHistory";

export const SOCIAL_FEED_COLLECTION = "SocialFeed";

export type SocialFeedKind =
  | "workout"
  | "weight"
  | "measurement"
  | "steps"
  | "wellness"
  | "photos"
  | "challenge";

export type SocialFeedAuthor = {
  clientId: ObjectId;
  fullName: string;
  avatar: string;
};

type SocialFeedBase = {
  _id: ObjectId;
  clientId: ObjectId;
  author: SocialFeedAuthor;
  createdAt: Date;
  likes: number;
  comments: number;
  /** Referencia al registro de dominio (evita duplicados). */
  sourceId?: ObjectId;
};

export type SocialFeedWorkout = SocialFeedBase & {
  kind: "workout";
  workoutHistoryId: ObjectId;
  week: number;
  day: string;
  focus: string;
  duration: string;
  durationMinutes: number;
  exerciseCount: number;
  media?: WorkoutMedia[];
};

export type SocialFeedWeight = SocialFeedBase & {
  kind: "weight";
  weightId: ObjectId;
  label: string;
  previousKg: number;
  currentKg: number;
  unit: string;
};

export type SocialFeedMeasurement = SocialFeedBase & {
  kind: "measurement";
  measurementId: ObjectId;
  MeasurementId: ObjectId;
  label: string;
  unit: string;
  value: number;
  delta: number;
  date: string;
};

export type SocialFeedSteps = SocialFeedBase & {
  kind: "steps";
  dailyStepsId: ObjectId;
  week: number;
  dayLabel: string;
  steps: number;
  goal: number;
};

export type SocialFeedWellnessItem = {
  wellnessId: ObjectId;
  masterId: ObjectId;
  key: string;
  label: string;
  value: number;
};

export type SocialFeedWellness = SocialFeedBase & {
  kind: "wellness";
  date: string;
  items: SocialFeedWellnessItem[];
};

export type SocialFeedPhotos = SocialFeedBase & {
  kind: "photos";
  week: number;
  photos: string[];
};

export type SocialFeedChallenge = SocialFeedBase & {
  kind: "challenge";
  title: string;
  completedDays: number;
  totalDays: number;
  completed: boolean;
};

export type SocialFeedEntry =
  | SocialFeedWorkout
  | SocialFeedWeight
  | SocialFeedMeasurement
  | SocialFeedSteps
  | SocialFeedWellness
  | SocialFeedPhotos
  | SocialFeedChallenge;

type CreateSocialFeedBase = {
  createdAt?: Date;
  likes?: number;
  comments?: number;
};

export type CreateSocialFeedInput =
  | (Omit<SocialFeedWorkout, "_id" | "createdAt" | "likes" | "comments"> & CreateSocialFeedBase)
  | (Omit<SocialFeedWeight, "_id" | "createdAt" | "likes" | "comments"> & CreateSocialFeedBase)
  | (Omit<SocialFeedMeasurement, "_id" | "createdAt" | "likes" | "comments"> & CreateSocialFeedBase)
  | (Omit<SocialFeedSteps, "_id" | "createdAt" | "likes" | "comments"> & CreateSocialFeedBase)
  | (Omit<SocialFeedWellness, "_id" | "createdAt" | "likes" | "comments"> & CreateSocialFeedBase)
  | (Omit<SocialFeedPhotos, "_id" | "createdAt" | "likes" | "comments"> & CreateSocialFeedBase)
  | (Omit<SocialFeedChallenge, "_id" | "createdAt" | "likes" | "comments"> & CreateSocialFeedBase);
