import { action } from '@storybook/addon-actions';
import { withKnobs, text } from '@storybook/addon-knobs';
import Card from '@/components/Card';

export default {
  title:      'Components',
  component:  Card,
  decorators: [withKnobs]
};

export const card = () => ({
  components: { Card },
  methods:      { buttonAction: action('button action clicked') },
  props:        {
    title:      { default: text('Title Text', 'This is a Title') },
    content:    { default: text('Content Text', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.') },
    buttonText: { default: text('Button Text', 'Save') },
  },
  template:   `
    <div class="row">
      <Card
        style="max-width: 50vw;"
        :title="title"
        :content="content"
        :buttonText="buttonText"
        :buttonAction="buttonAction"
      />
    </div>`,
});
