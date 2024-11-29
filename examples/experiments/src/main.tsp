model ProjectConfig {
    enable_new_way_of_routing: boolean;
    rollout_this_feature_by_user: Record<boolean>;
    mobile_rollout: Record<boolean>;
}
