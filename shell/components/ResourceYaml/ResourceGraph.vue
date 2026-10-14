<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import ResourceGraphGroups from '@shell/components/ResourceYaml/ResourceGraphGroups.vue';
import ResourceGraphSection from '@shell/components/ResourceYaml/ResourceGraphSection.vue';
import { RcCounterBadge } from '@components/Pill';
import { RcIcon } from '@components/RcIcon';
import { ResourceGraphGroup, ResourceGraphNode, ResourceGraphTreeNode } from '@shell/components/ResourceYaml/types';

const props = withDefaults(defineProps<{
  nodes: ResourceGraphNode[],

  selected?: string | null,

  saving?: boolean,

  loading?: boolean,
}>(), {
  selected: null,
  saving:   false,
  loading:  false,
});

const emit = defineEmits<{

  select: [id: string],


  save: [id: string],
}>();

const store = useStore();
const i18n = useI18n(store);


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


const nodesByParentId = computed(() => {
  const byParentId = new Map<string | undefined, ResourceGraphNode[]>();

  nodesById.value.forEach((node) => {
    const parentId = parentIdOf(node);

    byParentId.set(parentId, [...(byParentId.get(parentId) || []), node]);
  });

  return byParentId;
});


// `ResourceGraphTreeNode`s grouped by their `group`, in the order each group first appears
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


const groupsBelow = (parentId: string | undefined): ResourceGraphGroup[] => groupNodes(
  (nodesByParentId.value.get(parentId) || [])
    .filter((node) => !node.readOnly)
    .map((node) => ({ ...node, groups: groupsBelow(node.id) }))
);


const groups = computed(() => groupsBelow(undefined));


const topGroups = computed(() => groups.value.map((group) => ({
  ...group,
  nodes: group.nodes.map((node) => ({ ...node, groups: [] })),
})));

const groupsBelowTop = computed(() => groups.value.flatMap((group) => group.nodes.flatMap((node) => node.groups)));


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
        v-if="!loading"
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

      <div
        v-if="loading"
        class="resource-graph-loading"
        role="status"
        data-testid="resource-graph-loading"
      >
        <RcIcon
          type="spinner"
          size="small"
          class="icon-spin"
        />
        <span>{{ i18n.t('resourceYaml.resourceGraph.loading') }}</span>
      </div>
      <template v-else>
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
      </template>
    </div>
  </nav>
</template>

<style lang="scss" scoped>
.resource-graph {
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


.resource-graph-body {
  flex: 1 1 0;
  min-height: 0;
  overflow: auto;
}


.resource-graph-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 12px 0 var(--resource-graph-indent);
}
</style>
