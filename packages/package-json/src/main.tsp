model ProjectConfig {
  projectName: string;
}

model PackageExports {
  types: string;
  default: string;
}

model PackageJson {
  name: string;
  version: string;
  type: string;
  main: string;
  keywords: string[];
  exports: Record<PackageExports>;
  dependencies?: Record<string>;
  devDependencies?: Record<string>;
  scripts?: Record<string>;
}
