<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import ResourceGraphGroups from '@shell/components/ResourceYaml/ResourceGraphGroups.vue';
import { RcCounterBadge } from '@components/Pill';
import { ResourceGraphGroup, ResourceGraphNode, ResourceGraphTreeNode } from '@shell/components/ResourceYaml/types';

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

/** The nodes of the graph by id, keeping the first of any that share an id */
const nodesById = computed(() => props.nodes.reduce((acc, node) => {
  if (!acc.has(node.id)) {
    acc.set(node.id, node);
  }

  return acc;
}, new Map<string, ResourceGraphNode>()));

/**
 * The id of the node this one should be shown below, or `undefined` to show it at the top level
 *
 * A node pointing at a parent that isn't in the graph is shown at the top level rather than
 * dropped, as is one whose parents lead back around to it, so a bad `parentId` can't hide a
 * resource from the user
 */
const parentIdOf = (node: ResourceGraphNode): string | undefined => {
  const seen = new Set([node.id]);
  let parent = node.parentId ? nodesById.value.get(node.parentId) : undefined;

  const first = parent;

  while (parent) {
    if (seen.has(parent.id)) {
      return undefined;
    }

    seen.add(parent.id);
    parent = parent.parentId ? nodesById.value.get(parent.parentId) : undefined;
  }

  return first?.id;
};

/** The nodes below each parent id, the `undefined` key holding those at the top level */
const nodesByParentId = computed(() => {
  const byParentId = new Map<string | undefined, ResourceGraphNode[]>();
  const seen = new Set<string>();

  props.nodes.forEach((node) => {
    // Only the first of any nodes sharing an id, so that a duplicate can't be nested below itself
    if (seen.has(node.id)) {
      return;
    }

    seen.add(node.id);

    const parentId = parentIdOf(node);
    const siblings = byParentId.get(parentId) || [];

    siblings.push(node);
    byParentId.set(parentId, siblings);
  });

  return byParentId;
});

/**
 * The groups of nodes shown below the node with this id, or at the top level for `undefined`
 *
 * Nodes sharing a group are grouped together under a single heading, in the order they first
 * appear, and those without a group come first, under no heading, so that the primary resource can
 * be shown above the groups of resources that relate to it. Each node in turn carries the groups of
 * the nodes found below it, which the graph shows nested within its group
 */
const groupsBelow = (parentId: string | undefined): ResourceGraphGroup[] => (nodesByParentId.value.get(parentId) || []).reduce((acc, node) => {
  const label = node.group || '';
  const group = acc.find((g) => g.label === label);
  const treeNode: ResourceGraphTreeNode = { ...node, groups: groupsBelow(node.id) };

  if (group) {
    group.nodes.push(treeNode);
  } else {
    acc.push({ label, nodes: [treeNode] });
  }

  return acc;
}, [] as ResourceGraphGroup[]);

/** The top level of the graph, each node carrying the groups of nodes found below it */
const groups = computed<ResourceGraphGroup[]>(() => groupsBelow(undefined));
</script>

<template>
  <nav
    class="resource-graph"
    :aria-label="i18n.t('resourceYaml.resourceGraph.title')"
  >
    <div class="resource-graph-header">
      <h3 class="resource-graph-title mb-0">
        {{ i18n.t('resourceYaml.resourceGraph.title') }}
      </h3>
      <RcCounterBadge
        :count="props.nodes.length"
        type="inactive"
        data-testid="resource-graph-count"
      />
    </div>

    <ResourceGraphGroups
      :groups="groups"
      :selected="props.selected"
      @select="emit('select', $event)"
    />

    <div
      v-if="props.canCreate"
      class="resource-graph-footer"
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
  min-height: 0;
  height: 100%;
}

.resource-graph-header {
  flex-shrink: 0;
  padding: 12px 14px;
  display: flex;
  justify-content: flex-start;
  gap: 12px;
  align-items: center;
  background-color: var(--tabbed-sidebar-bg);
  border-bottom: 1px solid var(--border);
}

// groups fill remaining height and scroll; header and footer stay fixed
:deep(.resource-graph-groups) {
  flex: 1 1 0;
  min-height: 0;
  overflow: auto;
}

.resource-graph-footer {
  flex-shrink: 0;
  padding: 12px 14px;
  border-top: 1px solid var(--border);
}
</style>
