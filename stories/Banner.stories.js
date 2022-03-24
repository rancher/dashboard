import Banner from '../components/Banner.vue';
import BannerDocumentation from './BannerDocumentation.mdx';

export default {
  component: Banner,
  title:     'Components/Banner',
  argTypes:  {
    color: {
      control: {
        type:    'select',
        options: ['primary', 'secondary', 'info', 'warning', 'error']
      }
    },
    icon: { description: 'Optional icon to show before the label' }
  },
  parameters: {
    docs:              { page: BannerDocumentation },
    component:         Banner,
    componentSubtitle:
    'They appear as a fixed, full-width strip, on top of the screen throughout the application.',
  },
};

const Template = (args, { argTypes, events }) => ({
  components: { Banner },
  props:      Object.keys(argTypes),
  template:   '<Banner v-on="events" v-bind="$props" />',
  data:       () => ({ events }),
});

export const Primary = Template.bind({});
Primary.args = {
  label:    'Banner Component - Primary',
  closable: false,
  color:    'primary',
};
Primary.parameters = { docs: { description: { story: `This is a Primary story.` } } };

export const Info = Template.bind({});
Info.args = {
  label:    'Banner Component - Info',
  closable: false,
  color:    'info',
};
Info.parameters = { docs: { description: { story: `This is a Info story` } } };

export const Warning = Template.bind({});
Warning.args = {
  label:    'Banner Component - Warning',
  closable: false,
  color:    'warning'
};

export const Error = Template.bind({});
Error.args = {
  label:    'Banner Component - Error',
  closable: false,
  color:    'error'
};
