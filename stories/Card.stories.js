import Card from '../components/Card';
// import { action } from '@storybook/addon-actions';
// import Loading from '../components/Loading.vue'

import '../assets/styles/app.scss'

const defaultState = {
  title: 'This is a Title',
  content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  buttonText: 'Save',
  buttonAction: () => console.log('hey')
};

export default {
  title: 'Card',
  component: Card,
};

export const ToStorybook = () => ({
  components: { Card },
  template: `<Card title="Tod" content="Is" buttonText="Save" />`,
});

ToStorybook.story = {
  name: 'Default Card',
};
