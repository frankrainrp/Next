export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

export type IntentPair = {
  action: string;
  purpose: string;
};

export type TaskProfile = {
  background: string;
  constraints: string;
  expectedOutcome: string;
  capability: string;
};

export type StakeholderAnalysis = {
  motivation: string;
  preference: string;
  winPattern: string;
  advantage: string;
  strategy: string;
};

export type MoSCoWNode = {
  id: string;
  priority: "Must" | "Should" | "Could" | "Won't";
  userStory: string;
  valueReason: string;
};

export type ExecutableSpec = {
  id: string;
  function: string;
  priority: string;
  techScheme: string;
  goalAlignment: string;
};

export type DailyTarget = {
  phase: string;
  goal: string;
  hours: number;
  sprintPercent: number;
  milestone?: string;
};

export type CompletionTiers = {
  minimum: { description: string; sprintPercent: number };
  standard: { description: string; sprintPercent: number };
  ideal: { description: string; sprintPercent: number };
};

export type SprintProgress = {
  plannedPercent: number;
  actualPercent: number;
  hoursPlanned: number;
  hoursSpent: number;
  efficiencyIndex: number;
  deviation: number;
  level: "ahead" | "on_track" | "slightly_behind" | "seriously_behind";
  suggestion: string;
};

export type StepData = {
  step1?: {
    intentPair: IntentPair;
    completeness: Record<string, "confirmed" | "missing">;
  };
  step2?: {
    taskProfile: TaskProfile;
    stakeholderAnalysis: StakeholderAnalysis;
  };
  step3?: {
    endUsers: string;
    userJourney: string;
    moscowNodes: MoSCoWNode[];
    criticalPath: string[];
  };
  step4?: {
    requirements: string;
    techSchemes: ExecutableSpec[];
    alignmentMatrix: string;
  };
  step5?: {
    timeFrame: { total: number; buffer: number; effective: number };
    dailyTargets: DailyTarget[];
    completionTiers: CompletionTiers;
  };
  step6?: {
    progress: SprintProgress;
    updatedPlan: DailyTarget[];
    updatedEstimate: string;
  };
};

export type WizardState = {
  projectId: string;
  currentStep: WizardStep;
  completedSteps: WizardStep[];
  steps: StepData;
  busy: boolean;
  status: string;
};
