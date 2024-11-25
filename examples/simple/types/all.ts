export type CatsInventory = {
  cats: string[];
  cutenessRatio: number;
};

export type DebuggingConfig = {
  logLevel: number;
  maxRetries: number;
  timeout: any;
};

export type ProjectConfig = {
  projectName: string;
  inventory: CatsInventory;
  debugging: DebuggingConfig;
};
