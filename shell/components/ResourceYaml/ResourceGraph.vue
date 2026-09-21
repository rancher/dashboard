<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { ResourceGraphGroup, ResourceGraphNode } from '@shell/components/ResourceYaml/types';

const props = withDefaults(defineProps<{
  /** The resources shown in the graph, in the order they should appear */
  nodes: ResourceGraphNode[],

  /** The id of the node currently shown in the editor */
  selected?: string | null,

  /** Show the button offering to create another related resource */
  canCreate?: boolean,
}>(), {
  selected:  null,
  canCreate: false,
});

const emit = defineEmits<{
  /** The user picked a resource to show in the editor */
  select: [id: string],

  /** The user asked to create another related resource */
  create: [],
}>();

const store = useStore();
const i18n = useI18n(store);

/**
 * The nodes split into their groups, keeping the order they were given in
 *
 * Nodes without a group come first, under no heading, so that the primary resource can be shown
 * above the groups of resources that relate to it
 */
const groups = computed<ResourceGraphGroup[]>(() => props.nodes.reduce((acc, node) => {
  const label = node.group || '';
  const group = acc.find((g) => g.label === label);

  if (group) {
    group.nodes.push(node);
  } else {
    acc.push({ label, nodes: [node] });
  }

  return acc;
}, [] as ResourceGraphGroup[]));
</script>

<template>
  <nav
    class="resource-graph"
    :aria-label="i18n.t('resourceYaml.resourceGraph.title')"
  >
    <div class="resource-graph__header">
      <h3 class="resource-graph__title">
        {{ i18n.t('resourceYaml.resourceGraph.title') }}
      </h3>
      <span
        class="resource-graph__count"
        data-testid="resource-graph-count"
      >{{ props.nodes.length }}</span>
    </div>

    <div class="resource-graph__groups">
      <div
        v-for="group in groups"
        :key="group.label"
        class="resource-graph__group"
      >
        <h4
          v-if="group.label"
          class="resource-graph__group-label"
        >
          {{ group.label }}
        </h4>
        <ul class="resource-graph__nodes">
          <li
            v-for="node in group.nodes"
            :key="node.id"
          >
            <button
              type="button"
              class="resource-graph__node"
              :class="{
                'resource-graph__node--selected': node.id === props.selected,
                'resource-graph__node--read-only': node.readOnly,
              }"
              :aria-current="node.id === props.selected ? 'true' : undefined"
              :data-testid="`resource-graph-node-${ node.id }`"
              @click="emit('select', node.id)"
            >
              <span class="resource-graph__node-label">{{ node.label }}</span>
              <span
                v-if="node.modified"
                class="resource-graph__node-modified"
                :aria-label="i18n.t('resourceYaml.resourceGraph.modified')"
                :data-testid="`resource-graph-modified-${ node.id }`"
              />
            </button>
          </li>
        </ul>
      </div>
    </div>

    <div
      v-if="props.canCreate"
      class="resource-graph__footer"
    >
      <button
        type="button"
        class="btn role-secondary"
        data-testid="resource-graph-create"
        @click="emit('create')"
      >
        {{ i18n.t('resourceYaml.resourceGraph.create') }}
      </button>
    </div>
  </nav>
</template>

<style lang="scss" scoped>
.resource-graph {
  display: flex;
  flex-direction: column;
  border: var(--border-width) solid var(--border);
  border-radius: var(--border-radius);
  background-color: var(--body-bg);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px;
    border-bottom: var(--border-width) solid var(--border);
  }

  &__title {
    margin: 0;
    font-size: 16px;
  }

  &__count {
    color: var(--muted);
  }

  &__groups {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
  }

  &__group-label {
    margin: 16px 16px 4px 16px;
    color: var(--muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  &__nodes {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__node {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    padding: 8px 16px;
    border: none;
    border-left: 3px solid transparent;
    background-color: transparent;
    color: var(--link);
    cursor: pointer;
    text-align: left;

    &:hover {
      background-color: var(--nav-hover);
    }

    &:focus-visible {
      outline: var(--outline-width) solid var(--outline);
      outline-offset: -2px;
    }

    &--selected {
      border-left-color: var(--primary);
      background-color: var(--nav-active);
    }

    &--read-only {
      color: var(--muted);
      cursor: default;
    }
  }

  &__node-modified {
    flex: 0 0 auto;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--primary);
  }

  &__footer {
    padding: 16px;
    border-top: var(--border-width) solid var(--border);
  }
}
</style>
