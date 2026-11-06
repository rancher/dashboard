import type { Meta, StoryObj } from '@storybook/vue3';
import { computed, ref } from 'vue';
import { RcInputSearch } from '@components/RcInput';
import { RcFieldGroup } from '@components/RcField';

const column = 'display: flex; flex-direction: column; gap: 24px; max-width: 400px;';

const meta: Meta<typeof RcInputSearch> = {
  component: RcInputSearch,
  argTypes:  {
    modelValue:  { control: { type: 'text' }, description: 'The search term, bound with `v-model`.' },
    size:        { options: ['small', 'medium', 'large'], control: { type: 'select' } },
    disabled:    { control: { type: 'boolean' }, description: 'Unset, the input takes the disabled state of the nearest RcFieldGroup.' },
    placeholder: { control: { type: 'text' } },
    clearable:   { control: { type: 'boolean' } },
    label:       { control: { type: 'text' }, description: 'Usually omitted for search. Give an `aria-label` instead.' },
  },
};

export default meta;
type Story = StoryObj<typeof RcInputSearch>;

export const Default: Story = {
  render: (args: any) => ({
    components: { RcInputSearch },
    setup() {
      return { args };
    },
    template: `
      <div style="${ column }">
        <RcInputSearch v-bind="args" aria-label="Search clusters" @update:model-value="args.modelValue = $event" />
      </div>`,
  }),
  args: {
    modelValue:  '',
    placeholder: 'Search for value',
    clearable:   true,
  },
};

export const Sizes: Story = {
  render: () => ({
    components: { RcInputSearch },
    setup() {
      return { sizes: ['small', 'medium', 'large'], term: ref('') };
    },
    template: `
      <div style="${ column }">
        <RcInputSearch
          v-for="size in sizes"
          :key="size"
          v-model="term"
          :size="size"
          :aria-label="'Search, ' + size"
          :placeholder="size"
        />
      </div>`,
  }),
};

export const FilteringAList: Story = {
  render: () => ({
    components: { RcInputSearch },
    setup() {
      const term = ref('');
      const clusters = ['local', 'downstream-east', 'downstream-west', 'edge-01', 'edge-02'];
      const matches = computed(() => clusters.filter((name) => name.includes(term.value.toLowerCase())));

      return { term, matches };
    },
    template: `
      <div style="${ column }">
        <RcInputSearch v-model="term" aria-label="Filter clusters" placeholder="Filter clusters" clearable />
        <ul style="margin: 0; padding-left: 16px;">
          <li v-for="name in matches" :key="name">{{ name }}</li>
          <li v-if="!matches.length" style="list-style: none; color: var(--input-label);">No clusters match.</li>
        </ul>
      </div>`,
  }),
};

export const InsideAFieldGroup: Story = {
  render: () => ({
    components: { RcInputSearch, RcFieldGroup },
    setup() {
      return { term: ref('') };
    },
    template: `
      <div style="${ column }">
        <RcFieldGroup mode="view">
          <RcInputSearch v-model="term" aria-label="Search in a view mode group" placeholder="Still editable in view mode" />
        </RcFieldGroup>
        <RcFieldGroup disabled>
          <RcInputSearch v-model="term" aria-label="Search in a disabled group" placeholder="Disabled by its group" />
        </RcFieldGroup>
      </div>`,
  }),
};
