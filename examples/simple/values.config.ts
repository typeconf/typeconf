import { DebuggingConfig, PetServiceConfig } from "./types/output.js";

let dbg: DebuggingConfig = {
  enableLogging: true,
  maxRetries: 10,
  timeout: "10ms",
};

let out_config: PetServiceConfig = {
  showBreed: true,
  petTypes: ["cat", "dog"],
  debugging: dbg,
};

export default out_config;
