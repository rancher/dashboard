# Storybook

### Repo

https://github.com/rancher/dashboard


### Folder structure
```bash
├── dashboard
|  ├── stories       // All files and setup for Storybook are here
|  |  |  ├── WIP      // WIP stories 
|  |  |  ├── components   // All components stories are here
|  |  |  ├── foundation   // All foundation stories are here


```

### How to write

### Stories in Document Format

MDX is a standard file format that combines Markdown with JSX. It means you can use Markdown’s terse syntax (such as # heading) for your documentation, write stories that compile to our component story format, and freely embed JSX component blocks at any point in the file. All at once.

For more details refer to [storybook official documentation](https://storybook.js.org/docs/vue/writing-docs/mdx#basic-example).



### Basic example
```html

<!-- Checkbox.stories.mdx -->

import { Canvas, Meta, Story } from '@storybook/addon-docs';

import Checkbox from './Checkbox.vue';

<Meta title="Components/Checkbox" component={Checkbox} />

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


### Stories in Component Story Format

Define stories according to the Component Story Format (CSF), an ES6 module-based standard that is easy to write and portable between tools.

For more details refer to [storybook official documentation](https://storybook.js.org/docs/vue/writing-stories/introduction).



### Basic example

```html

<!-- PercentageBar.stories.js -->

import PercentageBar from './Components/PercentageBar';


export default {
  title:      'WIP/PercentageBar',
  component:  PercentageBar,
  argTypes:   {
    preferredDirection: {
      control: {
        type:    'select',
        options: ['LESS', 'MORE']
      }
    }
  }
};;

<!-- Add templet for PercentageBar stories -->
export const Story = (args, { argTypes }) => ({
  components: { PercentageBar },
  props:      Object.keys(argTypes),
  template:   `
    <div style="width: 300px">
      <PercentageBar v-bind="$props"/>
    </div>`,
});


<!-- Define story for PercentageBar -->
Story.story = { name: 'PercentageBar' };
Story.args = {
  value:              45,
  showPercentage:     true.valueOf,
  preferredDirection: 'LESS'
};

```
