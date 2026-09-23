<script setup lang="ts">
import { PropType } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
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
});

const emit = defineEmits<{
  /** The user picked a resource to show in the editor */
  select: [id: string],
}>();

const store = useStore();
const i18n = useI18n(store);
</script>

<template>
  <div class="resource-graph-groups">
    <div
      v-for="group in props.groups"
      :key="group.label"
      class="resource-graph-group"
    >
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
            <span
              v-if="node.modified"
              class="resource-graph-node-modified"
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
}

.resource-graph-groups {
  padding: 8px;
}


.resource-graph-group {
  margin-left: 12px;
}

.resource-graph-node {
  padding: 0px;
}
// TODO nb margins/padding need fixing so this is all the way left
.resource-graph-node--selected {
  border-left: 5px solid var(--link);
}

</style>
