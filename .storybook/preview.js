import { addParameters } from '@storybook/vue';

import '!style-loader!css-loader!sass-loader!../assets/styles/app.scss';

addParameters({
  // default background colors for light and dark themes
  backgrounds: [
    { name: 'Dark Theme', value: '#1B1C21', default: true },
    { name: 'Light Theme', value: '#6C6C76' },
  ],
  options: {
    showRoots: true
  }
});
