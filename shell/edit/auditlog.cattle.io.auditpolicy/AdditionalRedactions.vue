<script setup lang="ts">
import { computed, ref } from 'vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Tabbed from '@shell/components/Tabbed/index.vue';
import ArrayList from '@shell/components/form/ArrayList.vue';
import { AuditPolicy } from '@shell/edit/auditlog.cattle.io.auditpolicy/types';

// Component Props & Emits
const props = defineProps({
  value: {
    type:    Object,
    default: () => ({})
  },
  mode: {
    type:    String,
    default: 'create'
  },
});

const emit = defineEmits<{
  'update:value': [value: AuditPolicy];
}>();

// Default Values & Reactive Spec
const defaults: AuditPolicy = { additionalRedactions: [] };
const spec = ref<AuditPolicy>({ ...defaults, ...props.value });

// Methods
function addRedaction() {
  const valueToEmit = { ...props.value, ...spec.value };

  valueToEmit.additionalRedactions?.push({
    headers: [],
    paths:   [],
  });
  emit('update:value', valueToEmit);
}

function removeRedaction(tab: number) {
  const valueToEmit = { ...props.value, ...spec.value };

  valueToEmit.additionalRedactions?.splice(tab, 1);
  emit('update:value', valueToEmit);
}

const redactionLabel = computed(() => {
  return (i: number) => `Rule ${ i + 1 }`;
});
</script>

<template>
  <div>
    <div class="row mb-40">
      <div class="col span-12">
        <Tabbed
          :side-tabs="true"
          :show-tabs-add-remove="mode !== 'view'"
          :use-hash="true"
          @addTab="addRedaction"
          @removeTab="removeRedaction"
        >
          <Tab
            v-for="(redaction, idx) in spec.additionalRedactions"
            :key="idx"
            :name="`rule-${idx}`"
            :label="redactionLabel(idx)"
            :show-header="false"
            class="container-group"
          >
            <fieldset>
              <h2>{{ t("auditPolicy.additionalRedactions.headers.title") }}</h2>
              <div class="row">
                <div class="col span-12">
                  <ArrayList
                    key="headers"
                    v-model:value="redaction.headers"
                    :value-placeholder="t('auditPolicy.additionalRedactions.headers.placeholder')"
                    :add-label="t('auditPolicy.additionalRedactions.headers.add')"
                    :mode="mode"
                    :protip="false"
                  />
                </div>
              </div>
            </fieldset>
            <div class="spacer" />
            <fieldset>
              <h2>
                {{ t("auditPolicy.additionalRedactions.paths.title") }}                  <i
                  v-clean-tooltip="{content: t('auditPolicy.additionalRedactions.paths.tooltip'), triggers: ['hover', 'touch', 'focus'] }"
                  v-stripped-aria-label="t('auditPolicy.additionalRedactions.paths.tooltip')"
                  class="icon icon-info"
                  tabindex="0"
                  role="tooltip"
                />
              </h2>
              <div class="row">
                <div class="col span-12">
                  <ArrayList
                    key="paths"
                    v-model:value="redaction.paths"
                    :value-placeholder="t('auditPolicy.additionalRedactions.paths.placeholder')"
                    :add-label="t('auditPolicy.additionalRedactions.paths.add')"
                    :mode="mode"
                    :protip="false"
                  />
                </div>
              </div>
            </fieldset>
          </Tab>
        </Tabbed>
      </div>
    </div>
  </div>
</template>
