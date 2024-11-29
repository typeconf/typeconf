import { ProjectConfig } from "@root/types/all.js";


let config: ProjectConfig = {
    // Use can just have plain feature flags
    enable_new_way_of_routing: true,
    // Or rollout per user
    rollout_this_feature_by_user: {
        "user1": true,
        "customer2": false,
    },
    // Or per platform, you can even add version here
    mobile_rollout: {
        "android": false,
        "ios": true,
    }
};
export default config;
