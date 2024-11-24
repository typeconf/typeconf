export type DebuggingConfig = {
  enableLogging: boolean;
  maxRetries: number;
  timeout: any;
};

export type PetServiceConfig = {
  showBreed: boolean;
  petTypes: string[];
  debugging: DebuggingConfig;
};
