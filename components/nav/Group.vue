<script>
import Accordion from '@/components/Accordion';
import Type from '@/components/nav/Type';

export default {
  name: 'Group',

  components: { Accordion, Type },

  props: {
    group: {
      type:     Object,
      required: true,
    },

    idPrefix: {
      type:     String,
      required: true,
    },

    isExpanded: {
      type:     Function,
      required: true,
    },

    toggleGroup: {
      type:     Function,
      required: true,
    },

    childrenKey: {
      type:    String,
      default: 'children',
    },

    canCollapse: {
      type:    Boolean,
      default: true,
    }
  },

  computed: {
    id() {
      return (this.idPrefix || '') + this.group.label;
    }
  }
};
</script>

<template>
  <Accordion
    :id="id"
    :key="group.label"
    :label="group.label"
    :expanded="isExpanded"
    :can-collapse="canCollapse"
    class="group"
    @on-toggle="toggleGroup"
  >
    <template #header>
      <slot name="accordion">
        {{ group.label }}
      </slot>
    </template>

    <ul class="list-unstyled">
      <template v-for="(child, idx) in group[childrenKey]">
        <li v-if="child.divider" :key="idx">
          <hr />
        </li>
        <li v-else-if="child[childrenKey]" :key="child.name">
          <Group
            :key="child.name"
            :is-expanded="isExpanded"
            :toggle-group="toggleGroup"
            :children-key="childrenKey"
            :id-prefix="id+'_'"
            :group="child"
          />
        </li>
        <Type
          v-else
          :key="child.name"
          :type="child"
        />
      </template>
    </ul>
  </Accordion>
</template>

<style lang="scss" scoped>
  ul {
    border-left: solid thin var(--border);
    margin-left: 10px;
  }
</style>
