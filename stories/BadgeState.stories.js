// BadgeState.stories.js

import BadgeState from '@/pkg/rancher-components/src/components/BadgeState/BadgeState.vue';

export default {
  component:   BadgeState,
  title:      'Components/BadgeState',
  // parameters: {
  //   docs: {
  //     description: {
  //       component: 'Badge component'
  //     }
  //   }
  // },
  argTypes:   {
    color: {
      control: {
        type:    'select',
        options: ['bg-info', 'bg-warning', 'bg-error']
      }
    },
    icon: { description: 'Optional icon to show before the label' }
  }
};

const Template = (args, { argTypes }) => ({
  components: { BadgeState },
  props:      Object.keys(argTypes),
  template:   '<BadgeState v-bind="$props" />',
});

export const Info = Template.bind({});
Info.args = {
  label: 'Hello World',
  color: 'bg-info'
};

export const Warning = Template.bind({});
Warning.args = {
  label: 'Hello World',
  color: 'bg-warning'
};

export const Error = Template.bind({});
Error.args = {
  label: 'Hello World',
  color: 'bg-error'
};
