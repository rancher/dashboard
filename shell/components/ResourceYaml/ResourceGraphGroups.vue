<script setup lang="ts">
import { PropType } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { RcIcon } from '@components/RcIcon';
import { ResourceGraphGroup } from '@shell/components/ResourceYaml/types';

const props = defineProps({
  /** The groups to show, in the order they should appear */
  groups: {
    type:     Array as PropType<ResourceGraphGroup[]>,
    required: true,
  },

  /** The id of the node currently shown in the editor */
  selected: {
    type:    String as PropType<string | null>,
    default: null,
  },

  /** How many levels these groups are nested below the top level */
  depth: {
    type:    Number,
    default: 0,
  },
});

const emit = defineEmits<{
  /** The user picked a resource to show in the editor */
  select: [id: string],
}>();

const store = useStore();
const i18n = useI18n(store);
</script>

<template>
  <div
    class="resource-graph-groups"
    :style="{ '--depth': props.depth }"
  >
    <div
      v-for="(group, i) in props.groups"
      :key="`${ !!group.readOnly }/${ group.label }`"
      class="resource-graph-group"
    >
      <!-- the read-only groups follow the others, so this is shown once, above all of them -->
      <h6
        v-if="group.readOnly && !props.groups[i - 1]?.readOnly"
        class="resource-graph-group-label read-only"
        data-testid="resource-graph-referenced-label"
      >
        {{ i18n.t('resourceYaml.resourceGraph.referenced') }}
        -
        {{ i18n.t('resourceYaml.resourceGraph.readOnly') }}
      </h6>
      <h6
        v-if="group.label"
        class="resource-graph-group-label"
      >
        {{ group.label }}
      </h6>
      <div class="resource-graph-nodes">
        <div
          v-for="node in group.nodes"
          :key="node.id"
        >
          <button
            type="button"
            class="btn role-link resource-graph-node"
            :class="{
              'resource-graph-node--selected': node.id === props.selected,
              'resource-graph-node--read-only': node.readOnly,
            }"
            :aria-current="node.id === props.selected ? 'true' : undefined"
            :data-testid="`resource-graph-node-${node.id}`"
            @click="emit('select', node.id)"
          >
            <span class="resource-graph-node-label">{{ node.label }}</span>
            <RcIcon
              v-if="node.modified"
              type="dot"
              size="inherit"
              class="resource-graph-node-modified"
              role="img"
              :aria-hidden="false"
              :aria-label="i18n.t('resourceYaml.resourceGraph.modified')"
              :data-testid="`resource-graph-modified-${node.id}`"
            />
          </button>

          <!-- The resources found below this one, shown as groups nested within its own group -->
          <ResourceGraphGroups
            v-if="node.groups.length"
            class="resource-graph-groups--nested"
            :groups="node.groups"
            :selected="props.selected"
            :depth="props.depth + 1"
            @select="emit('select', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
//TODO nb less custom
.resource-graph-group-label {
  color: #B0B2BC;
  font-family: Lato;
  font-size: 9.5px;
  font-style: normal;
  font-weight: 700;
  line-height: normal;
  letter-spacing: 0.6px;
  margin-top: 12px;
  margin-bottom: 0px;
}

// containers stay full width so the selected marker reaches the left edge of the graph
// indentation is applied as padding on the label and node instead
.resource-graph-groups {
  --indent: calc(20px + var(--depth) * 12px);

  padding: 0px 0;

  &--nested {
    padding-bottom: 0;
  }

  // inherited by every nested level, for the referenced heading
  // var() in a custom property resolves where it is declared, so this holds the indent of the top level
  &:not(.resource-graph-groups--nested) {
    --top-level-indent: var(--indent);
  }
}

.resource-graph-group-label {
  padding-left: var(--indent);

  // shown at the level of the primary resource's heading, above the read-only groups nested below it
  &.read-only{
    margin-top: var(--gap-md);
    padding-left: var(--top-level-indent);
  }

  // RcIcon has no size below 14px, so size="inherit" and set it here
  .resource-graph-group-label-dot {
    font-size: 6px;
    vertical-align: middle;
  }
}

.resource-graph-node {
  position: relative;
  width: 100%;
  text-align: left;
  padding: 0 12px 0 var(--indent);
  display: flex;
  justify-content: space-between;
  transition: background-color 0.5s;

  // pseudo-element instead of border or box-shadow:
  // a border would shift the label when selected
  // .role-link:focus in _button.scss sets box-shadow: none
  // present on every node so opacity can transition when selected
  &::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 2px;
    background: var(--primary);
    opacity: 0;
    transition: opacity 0.5s;
  }

  // fixed color so .role-link:hover in _button.scss does not recolor the icon
  // RcIcon has no size below 14px, so size="inherit" and set it here
  .resource-graph-node-modified {
    color: var(--link);
    font-size: 8px;
  }
}

// 2 selectors for more specificity than role-link styles
.resource-graph-node.resource-graph-node--selected {
  background: var(--category-active);

  &::before {
    opacity: 1;
  }
}


</style>
