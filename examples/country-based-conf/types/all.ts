export type ProductSettings = {
  breakEverything: boolean;
  randomnessRatio: number;
  formulaCoeff: number;
  tags: string[];
};

export type CountrySettings = {
  byCountryAndRegion: Record<string, Record<string, ProductSettings>>;
};
export namespace TypeSpec {}
