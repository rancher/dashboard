import IconIsDefault from '@shell/components/formatter/IconIsDefault';

const DefaultColumnState = {
  name:      'builtIn',
  value:     'builtIn',
  formatter: 'IconIsDefault'
};

const DefaultNotTrue = { builtIn: false };
const DefaultIsTrue = { builtIn: true };

export default {
  title:      'WIP/IconIsDefault',
  component:  IconIsDefault,
  decorators: [],
};

export const DefaultStory = () => ({
  components: { IconIsDefault },
  data() {
    return {
      row: DefaultNotTrue,
      col: DefaultColumnState
    };
  },
  template: `<IconIsDefault :row="row" :col="col" />`
});

DefaultStory.story = { name: 'Input Not Default' };

export const IsDefault = () => ({
  components: { IconIsDefault },
  data() {
    return {
      row: DefaultIsTrue,
      col: DefaultColumnState
    };
  },
  template: `<IconIsDefault :row="row" :col="col" />`
});

IsDefault.story = { name: 'Input Is Default' };
