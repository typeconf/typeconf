import { ProjectConfig } from "../types/all.js";

let config: ProjectConfig = {
    projectName: "simple",
    inventory: {
        cats: ["calico", "orange"],
        cutenessRatio: 9001.0,
    },
    debugging: {
        logLevel: 2,
        maxRetries: 3,
        timeout: "500ms",
    },
};

export default config;
