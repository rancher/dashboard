<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import { AuditPolicy } from '@shell/edit/auditlog.cattle.io.auditpolicy/types';
import Banner from '@components/Banner/Banner.vue';

// Component Props & Emits
const props = defineProps({
  value: {
    type:    Object,
    default: () => ({})
  },
  mode: {
    type:    String,
    default: 'create'
  }
});

const emit = defineEmits<{
  'update:value': [value: AuditPolicy];
}>();

// Options
const levelOptions = [0, 1, 2, 3];

// Store & i18n
const store = useStore();
const { t } = useI18n(store);

// Default Values & Reactive Spec
const defaults: AuditPolicy = {
  enabled:   false,
  verbosity: {
    level:   0, // The default level is 0, even if you set null, it will save as 0
    request: {
      headers: false,
      body:    false,
    },
    response: {
      headers: false,
      body:    false,
    }
  }
};

const spec = ref<AuditPolicy>({
  ...defaults,
  ...props.value,
  verbosity: {
    ...defaults.verbosity,
    ...props.value?.verbosity,
    request: {
      ...defaults.verbosity?.request,
      ...props.value?.verbosity?.request,
    },
    response: {
      ...defaults.verbosity?.response,
      ...props.value?.verbosity?.response,
    }
  },
});

// Emit update immediately after initializing spec
emit('update:value', { ...props.value, ...spec.value });

// Watch for changes and emit updates
watch(spec, (newSpec) => {
  const valueToEmit = { ...props.value, ...newSpec };

  emit('update:value', valueToEmit);
}, { deep: true });

// Computed Properties
const levelOptionsMap = computed(() => levelOptions.map((value) => {
  return { value, label: `${ t(`auditPolicy.general.verbosity.level.${ value }`) }` };
}));
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-6">
        <fieldset>
          <h3>{{ t("auditPolicy.general.enabled.title") }}</h3>
          <Checkbox
            v-model:value="spec.enabled"
            :mode="mode"
            label-key="auditPolicy.general.enabled.checkbox"
            data-testid="auditPolicy-enabled"
          />
        </fieldset>
      </div>
    </div>
    <div class="spacer" />
    <div class="row">
      <div class="col span-6">
        <fieldset>
          <h3>{{ t("auditPolicy.general.verbosity.title") }}</h3>
          <Banner
            class="mt-0"
            color="info"
            label-key="auditPolicy.general.verbosity.banner"
          />

          <h4>
            {{ t("auditPolicy.general.verbosity.level.title") }}
            <i
              v-clean-tooltip="t('auditPolicy.general.verbosity.level.tooltip')"
              class="icon icon-info"
            />
          </h4>
          <div class="row">
            <div class="col span-12">
              <LabeledSelect
                v-model:value="spec.verbosity!.level"
                :label="t('auditPolicy.general.verbosity.level.label')"
                :options="levelOptionsMap"
                :mode="mode"
              />
            </div>
          </div>
          <div class="spacer-small" />
          <div
            class="row"
          >
            <div class="col span-6">
              <h4>
                {{ t("auditPolicy.general.verbosity.request.title") }}
                <i
                  v-clean-tooltip="t('auditPolicy.general.verbosity.requestResponse.tooltip')"
                  class="icon icon-info"
                />
              </h4>
              <div class="row">
                <Checkbox
                  v-model:value="spec.verbosity!.request!.headers"
                  :label="t('auditPolicy.general.verbosity.request.requestHeaders')"
                  :mode="mode"
                />
              </div>
              <div class="row">
                <Checkbox
                  v-model:value="spec.verbosity!.request!.body"
                  :label="t('auditPolicy.general.verbosity.request.requestBody')"
                  :mode="mode"
                />
              </div>
            </div>
            <div class="col span-6">
              <h4>
                {{ t("auditPolicy.general.verbosity.response.title") }}
                <i
                  v-clean-tooltip="t('auditPolicy.general.verbosity.requestResponse.tooltip')"
                  class="icon icon-info"
                />
              </h4>
              <div class="row">
                <Checkbox
                  v-model:value="spec.verbosity!.response!.headers"
                  :label="t('auditPolicy.general.verbosity.response.responseHeaders')"
                  :mode="mode"
                />
              </div>
              <div class="row">
                <Checkbox
                  v-model:value="spec.verbosity!.response!.body"
                  :label="t('auditPolicy.general.verbosity.response.responseBody')"
                  :mode="mode"
                />
              </div>
            </div>
          </div>
        </fieldset>
      </div>
    </div>
  </div>
</template>
