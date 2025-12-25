
export enum StepType {
  THEORY = 'Theorie',
  PRACTICE = 'Pratique'
}

export interface RoadmapStep {
  etape: number;
  type: StepType | string;
  titre: string;
  description: string;
  duree_estimee: string;
}

export interface RoadmapResponse {
  nom_examen: string;
  priorite: 'Haute' | 'Moyenne' | 'Basse';
  planning: RoadmapStep[];
  conseil_expert: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
}

export interface ExamQuestion {
  id: number;
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
}

export interface ExamSimulation {
  title: string;
  questions: ExamQuestion[];
}
