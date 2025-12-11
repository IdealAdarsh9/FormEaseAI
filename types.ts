export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  NEEDS_INFO = 'NEEDS_INFO',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface FilledField {
  value: string;
  box_2d?: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
}

export interface FormAnalysisResponse {
  documentTitle: string;
  summary: string;
  status: "COMPLETE" | "NEEDS_DETAILS";
  questions?: string[];
  markdownGuide?: string;
  filledFields?: FilledField[];
}

export interface ProblemContext {
  image: string; // Base64
  description: string;
}