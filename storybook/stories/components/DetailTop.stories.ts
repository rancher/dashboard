
import { Canvas, Meta, Story, ArgsTable, Source } from '@storybook/addon-docs';
import DetailTop from '@shell/components/DetailTop';

<Meta
  title="Components/DetailTop"
  component={DetailTop}
/>

export const Template = (args, { argTypes, events }) => ({
  components: { DetailTop },
  props:      Object.keys(argTypes),
  template:   '<DetailTop v-bind="$props" />',
})

# DetailTop

Display labels for the current resource.

### Description

This component is strictly bound to the k8s `value` model.

#### Default

Default view with all the options.

<Canvas>
  <Story
    name="Default"
    args={{
      value: {
        namespaces: [{
          medatada: { 
            name: 'default',
            detailLocation: 'location'
          },
        }],
        labels: {
          'kubernetes.io/metadata.name': 'anyValue',
          'label/with': 'icon',
        }
      },
      icons: {
        'label/with': 'icon-lock',
      }
    }}>
    {Template.bind({})}
  </Story>
</Canvas>

#### Tooltips

Replace the text from the label with a prettified version. This is provided by the tooltip dictionary, using key as reference and may contain any type of information, therefore it may not include any related information.
The tooltips will then display the actual key/value content.

<Canvas>
  <Story
    name="Tooltips"
    args={{
      value: {
        namespaces: [{
          medatada: { 
            name: 'default',
            detailLocation: 'location'
          },
        }],
        labels: {
          'kubernetes.io/metadata.name': 'anyValue',
          'pod-security.kubernetes.io/enforce': 'privileged',
          'originalKey': 'value displayed in tooltip only',
        }
      },
      icons: {
        'pod-security.kubernetes.io/enforce': 'icon-pod_security',
      },
      tooltips: {
        'pod-security.kubernetes.io/enforce': 'Enforce Privileged (latest)',
        'originalKey': 'Hover me',
      },
    }}>
    {Template.bind({})}
  </Story>
</Canvas>

### Import

<Source
  language='js'
  light
  format={false}
  code={`
     import DetailTop from '@shell/components/DetailTop.vue'
  `}
/>

### Props table

<ArgsTable of={DetailTop} />
