model MobileFeatureConfig {
    platformConfigs: Record<{
        versionConfigs: Record<{
            enablePushNotifications: boolean;
            adFrequency: int32;
            featureToggles: Record<boolean>;
        }>;
    }>;
}
