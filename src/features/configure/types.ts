export type ModelSubparameter = {
  id: string;
  name: string;
  weight: number;
  score: number;
  source: string;
};

export type ModelParameter = {
  id: string;
  name: string;
  weight: number;
  score: number;
  source: string;
  subparameters: ModelSubparameter[];
};

export type ModelConfiguration = {
  parameters: ModelParameter[];
};
