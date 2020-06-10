<script>
import Accordion from '@/components/Accordion';
import Type from '@/components/nav/Type';
export default {
  name: 'Group',

  components: { Accordion, Type },

  props: {
    depth: {
      type:    Number,
      default: 0,
    },

    group: {
      type:     Object,
      required: true,
    },

    idPrefix: {
      type:     String,
      required: true,
    },

    isExpanded: {
      type:     [Function, Boolean],
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
  },

  methods: {
    toggleGroup(group, expanded) {
      this.$store.dispatch('type-map/toggleGroup', { group, expanded });
    }
  }
};
</script>

<template>
  <Accordion
    :id="id"
    :key="group.label"
    :depth="depth"
    :label="group.label"
    :expanded="isExpanded"
    :can-collapse="canCollapse"
    :has-children="group.children && group.children.length > 0"
    class="group"
    @on-toggle="toggleGroup"
  >
    <template #header>
      <slot name="accordion">
        <Type
          v-if="group.route"
          :key="group.name"
          :type="group"
        />
        <span v-else v-html="group.labelDisplay || group.label" />
      </slot>
    </template>

    <ul class="list-unstyled">
      <template v-for="(child, idx) in group[childrenKey]">
        <li v-if="child.divider" :key="idx">
          <hr />
        </li>
        <li v-else-if="child[childrenKey]" :key="child.name">
          <ul class="list-unstyled m-0">
            <Group
              :key="child.name"
              :depth="depth + 1"
              :is-expanded="isExpanded"
              :children-key="childrenKey"
              :can-collapse="canCollapse"
              :id-prefix="id+'_'"
              :group="child"
            />
          </ul>
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
