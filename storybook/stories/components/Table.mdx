
import { Canvas, Meta, Story, ArgsTable, Source } from '@storybook/addon-docs';
import SortableTable from '@shell/components/SortableTable';

<Meta 
  title="Components/Table"
  component={SortableTable}
/>

export const slots = [
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

export const getSlots = (list, args) => list.map(([key, name]) => `<template v-if="${key in args}" v-slot:${name}>${args[key]}</template>`).join('\n')

export const Template = (args, { argTypes, events }) => ({
  components: { SortableTable },
  props:      Object.keys(argTypes),
  template:   `<SortableTable v-bind="$props">
                  ${getSlots(slots, args)}
               </SortableTable>`
});

export const textSlotArea = (text) => `<div style="background: red; color: white">${text}</div>`;
export const getButton = (text) => `${text}`;

export const rows = [
  {
    name: 'First row',
    description: 'This is the first row',
    type: 'first type',
  },
  {
    name: 'Second row',
    description: 'This is another row',
    type: 'first type',
  },
  {
    name: 'No description',
    description: '',
    type: 'second type',
  },
];

export const headers = [
  {
    name: 'name',
    label: 'Name',
  },
  {
    name: 'description',
    label: 'Description',
  },
  {
    name: 'type',
    label: 'Type',
  },
];

# Table

Table with multiple functionalities. 

Note: Within our project 2 tables exists for this purpose: `SortableTable` and `ResourceTable`. 
The first one is an abstracted version, while the `ResourceTable` is a wrapper bound to the state.

## Description

This is just a visual rapresentation of the Rancher tables.
As the component ties in to product config, models, stores, etc, consider some existing docs as well during the development

- https://rancher.github.io/dashboard/code-base-works/sortable-table
- https://rancher.github.io/dashboard/code-base-works/kubernetes-resources-data-load
- https://rancher.github.io/dashboard/code-base-works/customising-how-k8s-resources-are-presented#list

<br/>

### Styles and sections

#### Default view

Default view case without change any prop and just providing required data.

<Canvas>
  <Story
    name="Default view"
    args={{
      headers,
      rows,
    }}>
    {Template.bind({})}
  </Story>
</Canvas>

#### Grouped

Rows can be grouped by matching types.

<Canvas>
  <Story
    name="Grouped view"
    args={{
      headers,
      rows,
      groupBy: 'type',
    }}>
    {Template.bind({})}
  </Story>
</Canvas>

#### Simplified

The default table can also be stripped out of each interactive functionality by props.

<Canvas>
  <Story
    name="Simplified view"
    args={{
      headers,
      rows,
      search: false,
      rowActions: false,
      tableActions: false,
    }}>
    {Template.bind({})}
  </Story>
</Canvas>


#### Loading

Loading status for the table.

<Canvas>
  <Story
    name="Loading"
    args={{
      headers,
      rows: [],
      loading: true
    }}>
    {Template.bind({})}
  </Story>
</Canvas>


#### Slots

#### Custom Loading slot

Custom loading slot element.

<Canvas>
  <Story
    name="Custom Loading slot"
    args={{
      headers,
      rows: [],
      loading: true, 
      loadingSlot: textSlotArea(`Loading...`)
    }}>
    {Template.bind({})}
  </Story>
</Canvas>


#### Custom No Row slot

Custom no row element.

<Canvas>
  <Story
    name="Custom No Row slot"
    args={{
      headers,
      rows: [],
      noRowSlot: textSlotArea(`No row found`)
    }}>
    {Template.bind({})}
  </Story>
</Canvas>


#### Custom No Results slot

Custom no results element, got while searching for an entry without results.

<Canvas>
  <Story
    name="Custom No Results slot"
    args={{
      headers,
      rows: [],
      noResultsSlot: textSlotArea(`No result found`)
    }}>
    {Template.bind({})}
  </Story>
</Canvas>


#### Title slot

Title for the table.

<Canvas>
  <Story
    name="Title slot"
    args={{
      headers,
      rows: [],
      titleSlot: textSlotArea(`Table title`)
    }}>
    {Template.bind({})}
  </Story>
</Canvas>


#### Header slots

Slots reserved for adding elements on the header.
Areas are left, middle, right and generic.

<Canvas>
  <Story
    name="Header slots"
    args={{
      headers,
      rows: [],
      headerLeftSlot: textSlotArea(getButton('Left')),
      headerMiddleSlot: textSlotArea(getButton('Middle')),
      headerRightSlot: textSlotArea(getButton('Right')),
      headerButtonSlot: textSlotArea(getButton('Header'))
    }}>
    {Template.bind({})}
  </Story>
</Canvas>


#### Group Row and Group By slots

Elements added in case of groupped rows using `groupBy`.

<Canvas>
  <Story
    name="Group Row slot"
    args={{
      headers,
      rows,
      groupBy: 'type',
      groupRowSlot: textSlotArea(`Group row slot`),
      groupBySlot: textSlotArea(`Group by slot`)
    }}>
    {Template.bind({})}
  </Story>
</Canvas>


#### Main Row 	slot

<Canvas>
  <Story
    name="Main Row  slot"
    args={{
      headers,
      rows,
      mainRowSlot: textSlotArea(`Main row slot`)
    }}>
    {Template.bind({})}
  </Story>
</Canvas>


#### Main Row Key	slot

<Canvas>
  <Story
    name="Main Row Key slot"
    args={{
      headers,
      rows,
      mainRowISlot: textSlotArea(`Main row for this row slot`)
    }}>
    {Template.bind({})}
  </Story>
</Canvas>


#### Column Name	slot

<Canvas>
  <Story
    name="Column Name slot"
    args={{
      headers,
      rows,
      colISlot: textSlotArea(`Slot to replace this column`)
    }}>
    {Template.bind({})}
  </Story>
</Canvas>


#### Cell Name	slot

<Canvas>
  <Story
    name="Cell Name slot"
    args={{
      headers,
      rows,
      cellISlot: textSlotArea(`Slot to replace this cell`)
    }}>
    {Template.bind({})}
  </Story>
</Canvas>


#### Row actions slot

<Canvas>
  <Story
    name="Row actions slot"
    args={{
      headers,
      rows,
      rowActionsSlot: textSlotArea(`Row actions slot`)
    }}>
    {Template.bind({})}
  </Story>
</Canvas>


#### Sub Row slot

Rows may have extra sub rows, but it's necessary to enable them by prop `subRows`.

<Canvas>
  <Story
    name="Sub Row slot"
    args={{
      headers,
      subRows: true,
      rows,
      subRowSlot: textSlotArea(`Sub row slot`)
    }}>
    {Template.bind({})}
  </Story>
</Canvas>


#### Sub Row slot - Expandable

Sub rows may be turned expandable row by enabling `subExpandable`.

<Canvas>
  <Story
    name="Sub Row slot expandable"
    args={{
      headers,
      subExpandable: true,
      subRows: true,
      subExpandColumn: true,
      rows,
      subRowSlot: textSlotArea(`Sub row slot expandable`)
    }}>
    {Template.bind({})}
  </Story>
</Canvas>


#### Shortkeys slot

Footer area slot used to add messages related to shortkeys.

<Canvas>
  <Story
    name="Shortkeys slot"
    args={{
      headers,
      rows: [],
      shortkeysSlot: textSlotArea(`Use CMD+W to close this tab :)`)
    }}>
    {Template.bind({})}
  </Story>
</Canvas>


### Functionalities

#### Advanced Filtering

Entries can be optionally filtered by key and term or optionally hide them.

<Canvas>
  <Story
    name="Advanced Filtering"
    args={{
      headers,
      rows,
      hasAdvancedFiltering: true,
    }}>
    {Template.bind({})}
  </Story>
</Canvas>


#### Sorting

Sorting is defined by header configuration using the key `sort` and a list of key to be used.

<Canvas>
  <Story
    name="Sorting"
    args={{
      headers: headers.map(header => ({ ...header, sort: ['name'] })),
      rows,
    }}>
    {Template.bind({})}
  </Story>
</Canvas>

#### Action menu

Row can have action menu enabled by the configuration `rowActions`.

<Canvas>
  <Story
    name="Action menu"
    args={{
      headers,
      rows,
    }}>
    {Template.bind({})}
  </Story>
</Canvas>


#### Pagination

Table pagination can be enabled with `paging` and set the amount of entries with `rowsPerPage`.

<Canvas>
  <Story
    name="Pagination"
    args={{
      headers,
      rows: Array.from(new Array(100)).map((el, i) => ({
        name: `Row ${i}`,
      })),
      paging: true,
      rowsPerPage: 5
    }}>
    {Template.bind({})}
  </Story>
</Canvas>

#### Context menu

## Props table

<ArgsTable of={SortableTable} />
