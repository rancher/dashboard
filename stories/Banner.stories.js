import Banner from '../components/Banner.vue';

export default {
  component: Banner,
  title: 'Components/Banner',
  parameters: {
    docs: {
      description: {
        // component: 'Badge component'
      }
    }
  },
  argTypes: {
    color: {
      control: {
         type: 'select',
         options: ['primary', 'secondary', 'info', 'warning', 'error']
      }
    },
    icon: {
      description: 'Optional icon to show before the label'
    },
  }
};

const Template = (args, { argTypes, events }) => ({
  components: { Banner },
  props: Object.keys(argTypes),
  template: '<Banner v-on="events" v-bind="$props" />',
  data: () => ({ events }),
});

export const Primary = Template.bind({});
Primary.args = {
  label: 'Banner Component - Primary',
  closable: false,
  color: 'primary',
};

export const Info = Template.bind({});
Info.args = {
  label: 'Banner Component - Info',
  closable: false,
  color: 'info',
};

export const Warning = Template.bind({});
Warning.args = {
  label: 'Banner Component - Warning',
  closable: false,
  color: 'warning'
};

export const Error = Template.bind({});
Error.args = {
  label: 'Banner Component - Error',
  closable: false,
  color: 'error'
};
