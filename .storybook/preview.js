import { addParameters } from '@storybook/vue';

import '!style-loader!css-loader!sass-loader!../assets/styles/app.scss';

addParameters({
  layout: 'centered',
  docs: {
    inlineStories: true,
  },
  themes: [
    { name: 'Light Theme', class: [ 'theme-light', 'overflow-hidden', 'dashboard-body' ], color: '#FFFFFF', default: true },
    { name: 'Dark Theme', class: [ 'theme-dark', 'overflow-hidden', 'dashboard-body' ], color: '#1B1C21' },
  ],
});
