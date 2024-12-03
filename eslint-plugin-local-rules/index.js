const vCleanTooltip = require('./v-clean-tooltip');

module.exports = {
  configs: { all: { rules: { 'local-rules/v-clean-tooltip': 'error' } } },
  rules:   { 'v-clean-tooltip': vCleanTooltip }
};
