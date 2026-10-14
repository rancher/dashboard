<script setup lang="ts">
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { RcStatusBadge } from '@components/Pill';
import { RcButton } from '@components/RcButton';
import { ResourceGraphGroup } from '@shell/components/ResourceYaml/types';

withDefaults(defineProps<{
  groups: ResourceGraphGroup[],

  selected?: string | null,

  depth?: number,

  saving?: boolean,
}>(), {
  selected: null,
  depth:    0,
  saving:   false,
});

const emit = defineEmits<{
  // show a different resource in the editor
  select: [id: string],

  // save an individual resource
  save: [id: string],
}>();

const store = useStore();
const i18n = useI18n(store);
</script>

<template>
  <div
    class="resource-graph-groups"
    :style="{ '--depth': depth }"
  >
    <div
      v-for="group in groups"
      :key="group.label"
      class="resource-graph-group"
    >
      <h5
        v-if="group.label"
        class="resource-graph-group-label text-muted"
      >
        {{ group.label }}
      </h5>
      <div class="resource-graph-nodes">
        <div
          v-for="node in group.nodes"
          :key="node.id"
        >
          <div
            class="resource-graph-node"
            :class="{
              'resource-graph-node--selected': node.id === selected,
              'resource-graph-node--modified': node.modified,
              'resource-graph-node--read-only': node.readOnly,
            }"
          >
            <button
              type="button"
              class="btn role-link resource-graph-node-select"
              :aria-current="node.id === selected ? 'true' : undefined"
              :data-testid="`resource-graph-node-${node.id}`"
              @click="emit('select', node.id)"
            >
              <span
                v-clean-tooltip="node.label"
                class="resource-graph-node-label"
              >{{ node.label }}</span>
            </button>
            <RcStatusBadge
              v-if="node.modified"
              v-clean-tooltip="i18n.t('resourceYaml.resourceGraph.modifiedTooltip')"
              status="warning"
              class="resource-graph-node-modified"
              :data-testid="`resource-graph-modified-${node.id}`"
              @click="emit('select', node.id)"
            >
              {{ i18n.t('resourceYaml.resourceGraph.modified') }}
            </RcStatusBadge>
            <RcButton
              v-if="node.modified && !node.readOnly"
              variant="tertiary"
              size="small"
              class="resource-graph-node-save"
              :disabled="saving"
              :aria-label="i18n.t('resourceYaml.resourceGraph.saveResource', { name: node.label })"
              :data-testid="`resource-graph-save-${node.id}`"
              @click="emit('save', node.id)"
            >
              {{ i18n.t('generic.save') }}
            </RcButton>
          </div>

          <ResourceGraphGroups
            v-if="node.groups.length"
            class="resource-graph-groups--nested"
            :groups="node.groups"
            :selected="selected"
            :depth="depth + 1"
            :saving="saving"
            @select="emit('select', $event)"
            @save="emit('save', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// containers stay full width so the selected marker reaches the left edge of the graph
// indentation is applied as padding on the label and node instead
// --resource-graph-indent is set by ResourceGraph
// --resource-graph-groups-indent by ResourceGraphSection, to line its groups up with its title
.resource-graph-groups {
  --indent: calc(var(--resource-graph-groups-indent, var(--resource-graph-indent)) + var(--depth) * 12px);
}

.resource-graph-group-label {
  margin-top: 12px;
  margin-bottom: 4px;
  padding-left: var(--indent);
  font-size: 12px;
}

.resource-graph-node {
  position: relative;
  padding: 0 12px 0 var(--indent);
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.5s;

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

  &--selected {
    background: var(--category-active);

    &::before {
      opacity: 1;
    }
  }
}

.resource-graph-node-select {
  min-width: 0;
  padding: 0;
  text-align: left;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
  }
}

.resource-graph-node-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

// positioned so the badge and the save button are clickable above the select button/row
.resource-graph-node .resource-graph-node-modified {
  position: relative;
  flex-shrink: 0;
}

.resource-graph-node-save {
  position: relative;
  flex-shrink: 0;
  margin-left: auto;
}
</style>
