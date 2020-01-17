import centered from '@storybook/addon-centered/vue';
import Card from '../components/Card';

const defaultState = {
  title:        'This is a Title',
  content:      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  buttonText:   'Save',
  buttonAction: () => console.log('hey')
};

export default {
  title:      'Components/Card',
  component:  Card,
  decorators: [centered],
};

export const ToStorybook = () => ({
  components: { Card },
  template:   `<Card style="max-width: 50vw;" title="${ defaultState.title }" content="${ defaultState.content }" buttonText="${ defaultState.buttonText }" :buttonAction="buttonAction" />`,
  methods:    { buttonAction: defaultState.buttonAction },
});

ToStorybook.story = { name: 'Default Card' };
