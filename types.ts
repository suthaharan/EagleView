
export enum AnalysisType {
  PILLBOX = 'PILLBOX',
  FINE_PRINT = 'FINE_PRINT',
  DOCUMENT = 'DOCUMENT'
}

export enum UserRole {
  CAREGIVER = 'CAREGIVER',
  SENIOR = 'SENIOR'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedSeniors?: string[]; // IDs of seniors if role is CareGiver
}

export interface UserPreferences {
  highContrast: boolean;
  fontSize: 'normal' | 'large';
  medicationSchedule: string;
  caregiverNote?: string; // Note left by a caregiver for the senior
}

export interface AnalysisResult {
  id: string;
  userId: string; // The senior this belongs to
  performedBy: string; // The user ID who actually took the photo
  timestamp: number;
  type: AnalysisType;
  imageUrl: string;
  summary: string;
  details: any;
  fraudRisk?: 'Low' | 'Medium' | 'High';
}
