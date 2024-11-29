model ProductSettings {
    breakEverything: boolean;
    randomnessRatio: float32;
    formulaCoeff: float32;
    tags: Array<string>;
}

model CountrySettings {
    byCountryAndRegion: Record<Record<ProductSettings>>;
};
