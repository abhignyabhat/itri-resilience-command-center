export type MeasurementOperator = "GT" | "GTE" | "EQ" | "LT" | "LTE" | "BETWEEN";

export type MeasurementCriterion = {
  id: string;
  description: string;
  operator: MeasurementOperator;
  value: number;
  upperValue: number | null;
  score: number;
  sortOrder: number;
};

export type ModelSubparameter = {
  id: string;
  name: string;
  weight: number;
  score: number;
  source: string;
  sortOrder: number;
  description: string;
  measurement: string;
  measurementCriteria: MeasurementCriterion[];
};

export type ModelParameter = {
  id: string;
  name: string;
  chartLabel: string[];
  weight: number;
  score: number;
  source: string;
  sortOrder: number;
  description: string;
  measurement: string;
  subparameters: ModelSubparameter[];
};

export type ModelConfiguration = {
  name: string;
  status?: "DRAFT" | "PUBLISHED";
  goodThreshold: number;
  okayThreshold: number;
  parameters: ModelParameter[];
};
