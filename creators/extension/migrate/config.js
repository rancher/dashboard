module.exports = {
  nodeRequirement:   '20.0.0',
  isDry:             process.argv.includes('--dry'),
  isVerbose:         process.argv.includes('--verbose'),
  isSuggest:         process.argv.includes('--suggest'),
  removePlaceholder: 'REMOVE',
};
