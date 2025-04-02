/**
 * Local implementations of path manipulation functions to avoid Node.js path module dependency
 */

/**
 * Joins path segments using the platform-specific separator
 */
export function join(...paths: string[]): string {
  return paths
    .map((path, i) => {
      if (i === 0) {
        return path.trim().replace(/[/\\]+$/, '');
      } else {
        return path.trim().replace(/(^[/\\]+|[/\\]+$)/g, '');
      }
    })
    .filter(x => x.length > 0)
    .join('/');
}

/**
 * Returns the directory name of a path
 */
export function dirname(path: string): string {
  const parts = path.split(/[/\\]/);
  if (parts.length <= 1) return '.';
  if (parts.length === 2 && parts[0] === '') return '/';
  parts.pop();
  return parts.join('/') || '.';
}

/**
 * Returns the relative path from one path to another
 */
export function relative(from: string, to: string): string {
  // Normalize paths
  const fromParts = from.split(/[/\\]/).filter(Boolean);
  const toParts = to.split(/[/\\]/).filter(Boolean);

  // Find common prefix
  let commonLength = 0;
  for (let i = 0; i < Math.min(fromParts.length, toParts.length); i++) {
    if (fromParts[i] !== toParts[i]) break;
    commonLength++;
  }

  // Build relative path
  const upCount = fromParts.length - commonLength;
  const downParts = toParts.slice(commonLength);
  
  const upPath = '../'.repeat(upCount);
  const downPath = downParts.join('/');
  
  return upPath + downPath || '.';
} 