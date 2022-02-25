# Style

## SCSS

SCSS Styles can be found in `assets/styles/`. It's recommended to browse through some of the common styles in `_helpers.scss` and `_mixins.scss`.

### Examples

The following pages contain example components and their styling

- Buttons - `<dashboard url>/design-system`
- Form Controls - `<dashboard url>/design-system/form-controls`
- Provider Images - `<dashboard url>/design-system/provider-images`

### Icons 
Icons are font based and can be shown via the icon class

```
<i class="icon icon-fw icon-gear" /></a>
```

Icons can be browsed via `assets/fonts/icons/demo.html`.

Additional icon styles can be found in via `assets/styles/fonts/_icons.scss`.

## Date
The Dashboard uses the [dayjs](https://day.js.org/) library to handle dates, times and date algebra. However when showing a date and time they should take into account the date and time format. Therefore it's advised to use a formatter such as `/components/formatter/Date.vue` to display them.

## Loading Indicator

When a component uses `async fetch` it's best practise to gate the component template on fetch's `$fetchState.pending`. When the component is page based this should be applied to the `/components/Loading` component

```
<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    ...
  </div>
</template>
```
