# Storybook

### Create component

MDX is a standard file format that combines Markdown with JSX. It means you can use Markdown’s terse syntax (such as # heading) for your documentation, write stories that compile to our component story format, and freely embed JSX component blocks at any point in the file. All at once.


### Basic example

```html


<!-- Checkbox.stories.mdx -->

import { Canvas, Meta, Story } from '@storybook/addon-docs';

import Checkbox from './Checkbox.vue';

<Meta title="MDX/Checkbox" component={Checkbox} />

<!-- Add templet for checkbox stories -->
export const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { Checkbox },
  template: '<Checkbox v-bind="$props" />',
});

# Checkbox

With `MDX`, we can define a story for `Checkbox` right in the middle of our
Markdown documentation.

<!-- Define different states for checkbox -->
<Canvas columns={2}>
  Default
  <Story
    name="Checked"
    args={{
      label: 'Accept term of service',
    }}>
    {Template.bind({})}
  </Story>
  Selected
  <Story
    name="Selected"
    args={{
      label: 'Accept term of service',
      value: true
    }}>
    {Template.bind({})}
  </Story>
  Disabled
  <Story
    name="Disabled"
    args={{
      label: 'Accept term of service',
      disabled: true,
      value: true
    }}>
    {Template.bind({})}
  </Story>
</Canvas>

<!-- Add ArgsTable for Checkbox  -->
<ArgsTable of={Checkbox} />

```
