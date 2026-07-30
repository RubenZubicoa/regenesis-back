import { ObjectId } from "mongodb";

export interface DailySteps {
    _id: ObjectId
    clientId: string
    week: number
    goal: number
    days: Day[]
}

export interface Day {
    label: string
    value: number
}

export const DAILY_STEPS_COLLECTION = 'dailySteps';