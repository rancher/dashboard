/**
 * Runtime helper for import.meta.glob in Jest tests.
 *
 * Resolves glob patterns against the filesystem using fast-glob,
 * then uses require() to load the matched modules.
 *
 * This mimics Vite's import.meta.glob behaviour at test time.
 */
const fg = require('fast-glob');
const path = require('path');

// Resolve alias prefixes used in glob patterns to absolute paths
const ROOT = path.resolve(__dirname, '..');

const ALIASES = {
  '@shell/':      `${ path.join(ROOT, 'shell') }/`,
  '~shell/':      `${ path.join(ROOT, 'shell') }/`,
  '@pkg/':        `${ path.join(ROOT, 'pkg') }/`,
  '@components/': `${ path.join(ROOT, 'pkg', 'rancher-components', 'src', 'components') }/`,
};

/**
 * Resolve a glob pattern, replacing known aliases with absolute paths.
 */
function resolvePattern(pattern, callerDir) {
  for (const [alias, replacement] of Object.entries(ALIASES)) {
    if (pattern.startsWith(alias)) {
      return pattern.replace(alias, replacement);
    }
  }

  // Relative pattern — resolve from the caller's directory
  if (pattern.startsWith('./') || pattern.startsWith('../')) {
    return path.join(callerDir, pattern);
  }

  return pattern;
}

/**
 * Convert an absolute file path to a Vite-style glob key.
 *
 * Vite resolves aliases but returns keys as paths relative to the
 * project root with a leading slash (e.g. '/shell/models/foo.js').
 * For relative globs, keys are like './foo.vue'.
 */
function toGlobKey(absolutePath, callerDir, originalPattern) {
  // If the original pattern was relative, return a relative key
  if (originalPattern.startsWith('./') || originalPattern.startsWith('../')) {
    const rel = path.relative(callerDir, absolutePath);

    return rel.startsWith('.') ? rel : `./${ rel }`;
  }

  // For alias patterns, return /shell/... or /pkg/... style keys
  const relToRoot = path.relative(ROOT, absolutePath);

  return `/${ relToRoot }`;
}

/**
 * __viteImportMetaGlob(patterns, options, callerFilename)
 *
 * @param {string|string[]} patterns - Glob pattern(s)
 * @param {object} [options] - { eager: boolean, query: string, import: string }
 * @param {string} callerFilename - __filename of the calling module
 * @returns {object} Map of glob keys to modules (eager) or loader functions (lazy)
 */
function viteImportMetaGlob(patterns, options, callerFilename) {
  // Handle cases where options is actually __filename (no options argument)
  if (typeof options === 'string') {
    callerFilename = options;
    options = {};
  }

  const opts = options || {};
  const eager = opts.eager !== false;
  const callerDir = path.dirname(callerFilename);

  // Normalise to array of patterns
  const patternList = Array.isArray(patterns) ? patterns : [patterns];

  // Separate positive and negative patterns
  const positivePatterns = [];
  const negativePatterns = [];

  for (const p of patternList) {
    if (p.startsWith('!')) {
      negativePatterns.push(resolvePattern(p.slice(1), callerDir));
    } else {
      positivePatterns.push(resolvePattern(p, callerDir));
    }
  }

  const ignore = negativePatterns.length > 0 ? negativePatterns : undefined;

  // Resolve files synchronously
  let files = [];

  try {
    files = fg.sync(positivePatterns, {
      ignore,
      absolute:  true,
      onlyFiles: true,
    });
  } catch (e) {
    // If glob resolution fails, return empty object (graceful degradation)
    return {};
  }

  const result = {};

  // Determine the original pattern for key formatting
  const firstOriginalPattern = patternList.find((p) => !p.startsWith('!')) || patternList[0];

  for (const file of files) {
    const key = toGlobKey(file, callerDir, firstOriginalPattern);

    if (eager) {
      try {
        result[key] = require(file);
      } catch (e) {
        // Skip files that can't be required (e.g. binary assets)
        result[key] = {};
      }
    } else {
      // Lazy: return a function that loads the module
      const filePath = file;

      result[key] = () => Promise.resolve(require(filePath));
    }
  }

  return result;
}

module.exports = viteImportMetaGlob;
