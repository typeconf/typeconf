export type ProjectConfig = {
  enable_new_way_of_routing: boolean;
  rollout_this_feature_by_user: Record<string, boolean>;
  mobile_rollout: Record<string, boolean>;
};
export namespace TypeSpec {}
