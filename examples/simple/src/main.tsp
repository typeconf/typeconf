model CatsInventory {
    cats: Array<string>;
    cutenessRatio: float32;
}

model DebuggingConfig {
    logLevel: int32;
    maxRetries: int32;
    timeout: duration;
}

model ProjectConfig {
    projectName: string;
    inventory: CatsInventory;
    debugging: DebuggingConfig;
}
