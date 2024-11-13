import type { Meta, StoryObj } from '@storybook/vue3';
import Table from '@shell/components/SortableTable';

const meta: Meta<typeof Table> = { component: Table };

export default meta;
type Story = StoryObj<typeof Table>;

export const rows = [
  {
    name:        'First row',
    description: 'This is the first row',
    type:        'first type',
  },
  {
    name:        'Second row',
    description: 'This is another row',
    type:        'first type',
  },
  {
    name:        'No description',
    description: '',
    type:        'second type',
  },
];

export const headers = [
  {
    name:  'name',
    label: 'Name',
  },
  {
    name:  'description',
    label: 'Description',
  },
  {
    name:  'type',
    label: 'Type',
  },
];

export const slots: [string, string][] = [
  ['loadingSlot', 'loading'],
  ['noRowSlot', 'no-rows'],
  ['noResultsSlot', 'no-results'],
  ['titleSlot', 'title'],
  ['headerLeftSlot', 'header-left'],
  ['headerMiddleSlot', 'header-middle'],
  ['headerRightSlot', 'header-right'],
  ['headerButtonSlot', 'header-button'],
  ['groupRowSlot', 'group-row'],
  ['groupBySlot', 'group-by'],
  ['mainRowSlot', 'main-row'],
  ['mainRowISlot', 'main-row:0'],
  ['colISlot', 'col:name'],
  ['cellISlot', 'cell:name'],
  ['rowActionsSlot', 'row-actions'],
  ['subRowSlot', 'sub-row'],
  ['shortkeysSlot', 'shortkeys'],
];

export const getSlots = (list: [string, string][], args: any) => list.map(([key, name]) => `<template v-if="${ key in args }" v-slot:${ name }>${ args[key] }</template>`).join('\n');
export const textSlotArea = (text: string) => `<div style="background: red; color: white">${ text }</div>`;
export const getButton = (text: string) => `${ text }`;

export const Default: Story = {
  render: (args: any) => ({
    components: { Table },
    setup() {
      return { args };
    },
    template: `
      <Table v-bind="args">
        ${ getSlots(slots, args) }
      </Table>`
  }),
  args: {
    headers,
    rows,
  },
};

export const Grouped: Story = {
  ...Default,
  args: {
    headers,
    rows,
    groupBy: 'type',
  },
};

export const Simplified: Story = {
  ...Default,
  args: {
    headers,
    rows,
    search:       false,
    rowActions:   false,
    tableActions: false,
  },
};

export const Loading: Story = {
  ...Default,
  args: {
    headers,
    rows:    [],
    loading: true
  },
};

export const SlotLoading: Story = {
  ...Default,
  args: {
    headers,
    rows:        [],
    loading:     true,
    loadingSlot: textSlotArea(`Loading...`)
  },
};

export const SlotNoRow: Story = {
  ...Default,
  args: {
    headers,
    rows:      [],
    noRowSlot: textSlotArea(`No row found`)
  },
};

export const SlotNoResults: Story = {
  ...Default,
  args: {
    headers,
    rows:          [],
    noResultsSlot: textSlotArea(`No result found`)
  },
};

export const SlotTitle: Story = {
  ...Default,
  args: {
    headers,
    rows:          [],
    noResultsSlot: textSlotArea(`No result found`)
  },
};

export const SlotHeader: Story = {
  ...Default,
  args: {
    headers,
    rows:             [],
    headerLeftSlot:   textSlotArea(getButton('Left')),
    headerMiddleSlot: textSlotArea(getButton('Middle')),
    headerRightSlot:  textSlotArea(getButton('Right')),
    headerButtonSlot: textSlotArea(getButton('Header'))
  },
};

export const SlotGroupBy: Story = {
  ...Default,
  args: {
    headers,
    rows,
    groupBy:      'type',
    groupRowSlot: textSlotArea(`Group row slot`),
    groupBySlot:  textSlotArea(`Group by slot`)
  },
};

export const SlotMainRow: Story = {
  ...Default,
  args: {
    headers,
    rows,
    mainRowSlot: textSlotArea(`Main row slot`)
  },
};

export const SlotMainRowKey: Story = {
  ...Default,
  args: {
    headers,
    rows,
    mainRowISlot: textSlotArea(`Main row for this row slot`)
  },
};

export const SlotColumnName: Story = {
  ...Default,
  args: {
    headers,
    rows,
    colISlot: textSlotArea(`Slot to replace this column`)
  },
};

export const SlotCellName: Story = {
  ...Default,
  args: {
    headers,
    rows,
    cellISlot: textSlotArea(`Slot to replace this cell`)
  },
};

export const SlotRowActions: Story = {
  ...Default,
  args: {
    headers,
    rows,
    rowActionsSlot: textSlotArea(`Row actions slot`)
  },
};

export const SlotSubRow: Story = {
  ...Default,
  args: {
    headers,
    subRows:    true,
    rows,
    subRowSlot: textSlotArea(`Sub row slot`)
  },
};

export const SlotSubRowExpandable: Story = {
  ...Default,
  args: {
    headers,
    subExpandable:   true,
    subRows:         true,
    subExpandColumn: true,
    rows,
    subRowSlot:      textSlotArea(`Sub row slot expandable`)
  },
};

export const SlotShortkey: Story = {
  ...Default,
  args: {
    headers,
    rows:          [],
    shortkeysSlot: textSlotArea(`Use CMD+W to close this tab :)`)
  },
};

export const Filtering: Story = {
  ...Default,
  args: {
    headers,
    rows,
    hasAdvancedFiltering: true,
  },
};

export const Sorting: Story = {
  ...Default,
  args: {
    headers: headers.map((header) => ({ ...header, sort: ['name'] })),
    rows,
  },
};

export const Pagination: Story = {
  ...Default,
  args: {
    headers,
    rows:        Array.from(new Array(100)).map((el, i) => ({ name: `Row ${ i }` })),
    paging:      true,
    rowsPerPage: 5
  },
};
