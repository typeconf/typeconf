export type MobileFeatureConfig = {
  platformConfigs: Record<
    string,
    {
      versionConfigs: Record<
        string,
        {
          enablePushNotifications: boolean;
          adFrequency: number;
          featureToggles: Record<string, boolean>;
        }
      >;
    }
  >;
};
export namespace TypeSpec {}
