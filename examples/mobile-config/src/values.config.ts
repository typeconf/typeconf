import { MobileFeatureConfig } from "../types/all.js";

let config: MobileFeatureConfig = {
    platformConfigs: {
        android: {
            versionConfigs: {
                "<17": {
                    enablePushNotifications: true,
                    adFrequency: 5,
                    featureToggles: {
                        "newUserOnboarding": false,
                        "premiumUI": false,
                    },
                },
                ">=17": {
                    enablePushNotifications: true,
                    adFrequency: 3,
                    featureToggles: {
                        "newUserOnboarding": true,
                        "premiumUI": true,
                    },
                },
            },
        },
        ios: {
            versionConfigs: {
                "<15": {
                    enablePushNotifications: false,
                    adFrequency: 0,
                    featureToggles: {
                        "newUserOnboarding": false,
                        "premiumUI": false,
                    },
                },
                ">=15": {
                    enablePushNotifications: true,
                    adFrequency: 2,
                    featureToggles: {
                        "newUserOnboarding": true,
                        "premiumUI": true,
                    },
                },
            },
        },
    },
};

export default config;
