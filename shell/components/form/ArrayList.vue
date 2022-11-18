<script>
import ArrayList from '@components/Form/ArrayList/ArrayList';

/*
The purpose of this component is to allow the ArrayList component
to use translations from Rancher's Vuex store, while also separating out
that dependency on the store so that the ArrayList can be added to the Rancher
component library.
*/

export default {
  name:         'ArrayListWrapper',
  components:   { ArrayList },
  inheritAttrs: false,
  props:        {
    addLabel: {
      type: String,
      default() {
        return this.$store.getters['i18n/t']('generic.add');
      },
    },
    removeLabel: {
      type: String,
      default() {
        return this.$store.getters['i18n/t']('generic.remove');
      },
    },
  }
};
</script>

<template>
  <array-list
    v-bind="$attrs"
    :add-label="addLabel"
    :remove-label="removeLabel"
    v-on="$listeners"
  >
    <template
      v-for="(_, slot) of $scopedSlots"
      v-slot:[slot]="scope"
    >
      <slot
        :name="slot"
        v-bind="scope"
      />
    </template>
  </array-list>
</template>