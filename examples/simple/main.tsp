model DebuggingConfig {
  enableLogging: boolean;
  maxRetries: int32;
  timeout: duration;
}

model PetServiceConfig {
  showBreed: boolean;
  petTypes: string[];
  debugging: DebuggingConfig;
}
