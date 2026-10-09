<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import ResourceGraphGroups from '@shell/components/ResourceYaml/ResourceGraphGroups.vue';
import ResourceGraphSection from '@shell/components/ResourceYaml/ResourceGraphSection.vue';
import { RcCounterBadge } from '@components/Pill';
import { ResourceGraphGroup, ResourceGraphNode, ResourceGraphTreeNode } from '@shell/components/ResourceYaml/types';

const props = withDefaults(defineProps<{
  /** The resources shown in the graph, in the order they should appear */
  nodes: ResourceGraphNode[],

  /** The id of the node currently shown in the editor */
  selected?: string | null,

  /** A save is in progress, so no other save can be started */
  saving?: boolean,
}>(), {
  selected: null,
  saving:   false,
});

const emit = defineEmits<{
  /** The user picked a resource to show in the editor */
  select: [id: string],

  /** The user asked to save one resource */
  save: [id: string],
}>();

const store = useStore();
const i18n = useI18n(store);

/** The nodes of the graph by id, keeping the first of any that share an id, in the order given */
const nodesById = computed(() => {
  const byId = new Map<string, ResourceGraphNode>();

  props.nodes.forEach((node) => {
    if (!byId.has(node.id)) {
      byId.set(node.id, node);
    }
  });

  return byId;
});

const parentOf = (node: ResourceGraphNode) => (node.parentId ? nodesById.value.get(node.parentId) : undefined);

/**
 * The id of the node this one should be shown below, or `undefined` to show it at the top level
 *
 * A node pointing at a parent that isn't in the graph is shown at the top level rather than
 * dropped, as is one whose parents lead back around to it, so a bad `parentId` can't hide a
 * resource from the user
 *
 * Read-only nodes are listed in a section of their own rather than in the tree, so a node below a
 * read-only one is shown below its nearest parent that is not read-only
 */
const parentIdOf = (node: ResourceGraphNode): string | undefined => {
  const seen = new Set([node.id]);
  let shownParent: ResourceGraphNode | undefined;

  for (let parent = parentOf(node); parent; parent = parentOf(parent)) {
    if (seen.has(parent.id)) {
      return undefined;
    }

    seen.add(parent.id);
    shownParent = shownParent || (parent.readOnly ? undefined : parent);
  }

  return shownParent?.id;
};

/** The nodes below each parent id, the `undefined` key holding those at the top level */
const nodesByParentId = computed(() => {
  const byParentId = new Map<string | undefined, ResourceGraphNode[]>();

  nodesById.value.forEach((node) => {
    const parentId = parentIdOf(node);

    byParentId.set(parentId, [...(byParentId.get(parentId) || []), node]);
  });

  return byParentId;
});

/**
 * `ResourceGraphTreeNode`s grouped by their `group`, in the order each group first appears
 *
 * Those without a group come first, under no heading, so that the primary resource can be shown
 * above the groups of resources that relate to it
 */
const groupNodes = (nodes: ResourceGraphTreeNode[]): ResourceGraphGroup[] => {
  const groups: ResourceGraphGroup[] = [];

  nodes.forEach((node) => {
    const label = node.group || '';
    const group = groups.find((g) => g.label === label);

    if (group) {
      group.nodes.push(node);
    } else {
      groups.push({ label, nodes: [node] });
    }
  });

  return groups;
};

/**
 * The groups of the nodes that are not read-only shown below the node with this id, or at the top
 * level for `undefined`
 *
 * Each node in turn carries the groups of the nodes found below it, which the graph shows nested
 * within its group
 */
const groupsBelow = (parentId: string | undefined): ResourceGraphGroup[] => groupNodes(
  (nodesByParentId.value.get(parentId) || [])
    .filter((node) => !node.readOnly)
    .map((node) => ({ ...node, groups: groupsBelow(node.id) }))
);

/** The top level of the graph, each node carrying the groups of nodes found below it */
const groups = computed(() => groupsBelow(undefined));

/** The top-level nodes alone, as the groups below them are shown in the sections that follow */
const topGroups = computed(() => groups.value.map((group) => ({
  ...group,
  nodes: group.nodes.map((node) => ({ ...node, groups: [] })),
})));

const groupsBelowTop = computed(() => groups.value.flatMap((group) => group.nodes.flatMap((node) => node.groups)));

/** Every read-only node, wherever it was found, grouped by type alone */
const readOnlyGroups = computed(() => groupNodes(
  Array.from(nodesById.value.values()).filter((node) => node.readOnly).map((node) => ({ ...node, groups: [] }))
));

const expanded = reactive({ related: true, referenced: false });

const sections = computed(() => [
  { id: 'related' as const, groups: groupsBelowTop.value },
  { id: 'referenced' as const, groups: readOnlyGroups.value },
].filter((section) => section.groups.length));
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
        :count="nodes.length"
        type="inactive"
        data-testid="resource-graph-count"
      />
    </div>

    <div class="resource-graph-body">
      <ResourceGraphGroups
        :groups="topGroups"
        :selected="selected"
        :saving="saving"
        @select="emit('select', $event)"
        @save="emit('save', $event)"
      />

      <ResourceGraphSection
        v-for="section in sections"
        :key="section.id"
        v-model:expanded="expanded[section.id]"
        :title="i18n.t(`resourceYaml.resourceGraph.${ section.id }`)"
        :data-testid="`resource-graph-${ section.id }`"
      >
        <ResourceGraphGroups
          :groups="section.groups"
          :selected="selected"
          :saving="saving"
          @select="emit('select', $event)"
          @save="emit('save', $event)"
        />
      </ResourceGraphSection>
    </div>
  </nav>
</template>

<style lang="scss" scoped>
.resource-graph {
  // inherited by ResourceGraphGroups and ResourceGraphSection, which indent from it
  --resource-graph-indent: 20px;

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

// fills remaining height and scrolls; header stays fixed
.resource-graph-body {
  flex: 1 1 0;
  min-height: 0;
  overflow: auto;
}
</style>
