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
  <div class="resource-graph__groups">
    <div
      v-for="group in props.groups"
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

          <!-- The resources found below this one, shown as groups nested within its own group -->
          <ResourceGraphGroups
            v-if="node.groups.length"
            class="resource-graph__groups--nested"
            :groups="node.groups"
            :selected="props.selected"
            @select="emit('select', $event)"
          />
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>

</style>
