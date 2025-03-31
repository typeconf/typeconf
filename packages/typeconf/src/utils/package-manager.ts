import { promises as fsAsync } from 'fs';
import path from "path";
import { runCommand } from './run-command.js'

export type PackageManager = 'pnpm' | 'yarn' | 'npm';

export async function detectPackageManager(configDir: string): Promise<PackageManager> {
  // First check packageManager field in package.json
  try {
    const packageJsonPath = path.join(configDir, 'package.json');
    const packageJson = await fsAsync.readFile(packageJsonPath, 'utf-8');
    const packageData = JSON.parse(packageJson);
    
    if (packageData.packageManager) {
      if (packageData.packageManager.startsWith('pnpm@')) return 'pnpm';
      if (packageData.packageManager.startsWith('yarn@')) return 'yarn';
      if (packageData.packageManager.startsWith('npm@')) return 'npm';
    }
  } catch (error) {
    // Ignore errors reading package.json
  }

  // Then check the root directory (could be a monorepo)
  let currentDir = configDir;
  const root = path.parse(currentDir).root;

  while (currentDir !== root) {
    try {
      const pnpmWorkspace = await fsAsync.access(path.join(currentDir, 'pnpm-workspace.yaml'))
        .then(() => true)
        .catch(() => false);
      if (pnpmWorkspace) return 'pnpm';

      const yarnWorkspace = await fsAsync.access(path.join(currentDir, 'yarn.lock'))
        .then(() => true)
        .catch(() => false);
      if (yarnWorkspace) return 'yarn';

      const packageJson = await fsAsync.readFile(path.join(currentDir, 'package.json'), 'utf-8');
      const packageData = JSON.parse(packageJson);
      if (packageData.packageManager) {
        if (packageData.packageManager.startsWith('pnpm@')) return 'pnpm';
        if (packageData.packageManager.startsWith('yarn@')) return 'yarn';
        if (packageData.packageManager.startsWith('npm@')) return 'npm';
      }
    } catch (error) {
      // Ignore errors and continue searching up
    }

    currentDir = path.dirname(currentDir);
  }

  // Default to npm if nothing else is found
  return 'npm';
}

export async function installDependency(configDir: string, dependency: string): Promise<void> {
  const packageManager = await detectPackageManager(configDir);
  const installCommand = packageManager === 'yarn' ? 'add' : 'install';
  await runCommand(configDir, packageManager, [installCommand, '--save', dependency]);
} 