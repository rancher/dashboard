import { addParameters } from '@storybook/vue';

addParameters({
  // default background colors for light and dark themes
  backgrounds: [
    { name: 'Dark Theme', value: '#1B1C21', default: true },
    { name: 'Light Theme', value: '#6C6C76' },
  ]
});
