import { CountrySettings } from "@root/types/all.js";

// In this config you can define list of regions in the same way you categorize them
// and query by them when you read the config.
let config: CountrySettings = {
    byCountryAndRegion: {
        "uk": {
            "london": {
                breakEverything: true,
                randomnessRatio: 100.0,
                formulaCoeff: 42.0,
                tags: ["test", "new_ab"],
            }
        },
        "usa": {
            "sf": {
                breakEverything: false,
                randomnessRatio: 420.0,
                formulaCoeff: 32.0,
                tags: ["sf_test", "special_promo"],
            }
        },
    },
};
export default config;
