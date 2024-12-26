export type ProjectConfig = {
  projectName: string;
};

export type PackageExports = {
  types: string;
  default: string;
};

export type PackageJson = {
  name: string;
  version: string;
  type: string;
  main: string;
  keywords: string[];
  exports: Record<string, PackageExports>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};
export namespace TypeSpec {}
