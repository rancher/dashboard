// This registers all of the built-in formatters into the SortableTable cache

// We do it here to keep it away from plugins
// It was in SortableTable itself, but this causes plugins to pull in all formatters and their dependencies

import { FORMATTERS } from '@shell/components/SortableTable/sortable-config';

const components = require.context('@shell/components/formatter', false, /[A-Z]\w+\.(vue)$/);

components.keys().forEach((fileName) => {
  const componentConfig = components(fileName);
  const componentName = fileName.split('/').pop().split('.')[0];

  FORMATTERS[componentName] = componentConfig.default || componentConfig;
});
