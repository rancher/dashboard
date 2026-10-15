<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStore } from 'vuex';

import { OPERATION } from '@shell/config/types';
import { RcModal } from '@components/RcModal';
import { RcButton } from '@components/RcButton';
import { Banner } from '@components/Banner';
import { RadioGroup } from '@components/Form/Radio';
import Select from '@shell/components/form/Select.vue';
import { useI18n } from '@shell/composables/useI18n';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { set } from '@shell/utils/object';
import { createOperationCR } from '@shell/utils/operation-cr';

// How many selected services are shown as tokens before the rest collapse
// into "+N more", keeping the field to a single line.
const MAX_VISIBLE_TOKENS = 3;

export interface Props {
  cluster?: any;

  /**
   * `show` and the `close` handler, from whoever owns this dialog's visibility
   */
  modal: { show: boolean; onClose: () => void };
}

interface ServiceOption {
  label: string;
  value: string;
}

// PromptModal (opened with `ownsModal`) also passes `resources`, which this dialog doesn't use,
// so keep stray attributes off RcModal's dialog element.
defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<Props>(), { cluster: () => ({}) });

const store = useStore();
const i18n = useI18n(store);

const rotateAllServices = ref(true);
const selectedServices = ref<string[]>([]);
const errors = ref<string[]>([]);
const rotating = ref(false);

const isImportedWithDayTwoOps = computed(() => !!props.cluster?.isImportedWithDayTwoOps);

const serviceNames = computed<string[]>(() => {
  const options = [
    'admin',
    'api-server',
    'controller-manager',
    'scheduler',
    'cloud-controller',
    'etcd',
    'auth-proxy',
    'kubelet',
    'kube-proxy'
  ];

  if (props.cluster.isK3s) {
    options.push('k3s-controller', 'k3s-server');
  } else {
    options.push('rke2-controller', 'rke2-server');
  }
  if (isImportedWithDayTwoOps.value) {
    options.push('supervisor');
  }

  return options.sort();
});

const serviceOptions = computed<ServiceOption[]>(() => serviceNames.value.map((name) => ({ label: name, value: name })));

const hiddenTokenCount = computed(() => Math.max(selectedServices.value.length - MAX_VISIBLE_TOKENS, 0));

const selectionSummary = computed(() => i18n.t('cluster.rotateCertificates.selectionSummary', {
  count: selectedServices.value.length,
  total: serviceNames.value.length
}));

const rotateDisabled = computed(() => rotating.value || (!rotateAllServices.value && !selectedServices.value.length));

// Only the services the user picked, or none at all when every service should rotate
const servicesToRotate = computed(() => (rotateAllServices.value ? [] : [...selectedServices.value]));

function tokenIndex(option: ServiceOption) {
  return selectedServices.value.indexOf(option.value);
}

function isSelected(option: ServiceOption) {
  return selectedServices.value.includes(option.value);
}

function resetServices() {
  selectedServices.value = [];
}

function close() {
  // Stay open while the request is in flight, so its outcome is never lost
  if (rotating.value) {
    return;
  }

  props.modal.onClose();
}

async function rotate() {
  if (rotateDisabled.value) {
    return;
  }

  const services = servicesToRotate.value;

  errors.value = [];
  rotating.value = true;

  try {
    if (isImportedWithDayTwoOps.value) {
      // Imported clusters with day 2 ops rotate through a certificate rotation operation CR.
      // An empty args.services rotates every supported service.
      const namespace = props.cluster.mgmt?.id;
      const spec: Record<string, any> = {
        clusterRef: {
          apiVersion: 'management.cattle.io/v3',
          kind:       'Cluster',
          name:       props.cluster.mgmt?.id,
        }
      };

      if (services.length) {
        spec.args = { services };
      }

      await createOperationCR(store.dispatch, OPERATION.CERTIFICATE_ROTATE, spec, namespace, namespace, { notifyGeneratedName: true });
    } else {
      // The Steve API doesn't support actions, so for RKE2 cluster cert rotation, we patch the cluster.
      const currentGeneration = props.cluster.spec?.rkeConfig?.rotateCertificates?.generation || 0;

      set(props.cluster, 'spec.rkeConfig.rotateCertificates', {
        generation: currentGeneration + 1,
        services
      });

      await props.cluster.save();
    }

    rotating.value = false;
    close();
  } catch (err) {
    errors.value = exceptionToErrorsArray(err);
    rotating.value = false;
  }
}

defineExpose({
  rotate,
  close,
  resetServices,
  rotateAllServices,
  selectedServices,
  serviceNames,
  hiddenTokenCount,
  selectionSummary,
  rotateDisabled,
  rotating,
  errors,
});
</script>

<template>
  <!-- Not v-bind="modal": closing goes through close(), which refuses while a rotation is in flight -->
  <RcModal
    :show="modal.show"
    :title="i18n.t('cluster.rotateCertificates.modalTitle')"
    :click-to-close="!rotating"
    class="rotate-certificates"
    data-testid="rotate-certificates-dialog"
    @close="close"
    @primary-action="rotate"
  >
    <p>
      <!-- raw: `{{ }}` already escapes, so the escaped form would show the quotes as &#39; -->
      {{ i18n.t('cluster.rotateCertificates.description', {}, true) }}
    </p>

    <div>
      <RadioGroup
        v-model:value="rotateAllServices"
        name="service-mode"
        :options="[
          {
            value: true,
            label: i18n.t('cluster.rotateCertificates.allServices')
          },
          {
            value: false,
            label: i18n.t('cluster.rotateCertificates.selectedServices')
          }
        ]"
      />

      <div
        v-if="!rotateAllServices"
        class="services"
        data-testid="rotate-certificates-services"
      >
        <div class="services__header">
          <label id="rotate-certificates-services-label">
            {{ i18n.t('cluster.rotateCertificates.services') }}
            <span
              class="text-error"
              aria-hidden="true"
            >*</span>
          </label>
          <a
            v-if="selectedServices.length"
            href="#"
            role="button"
            data-testid="rotate-certificates-reset"
            @click.prevent="resetServices"
          >
            {{ i18n.t('cluster.rotateCertificates.reset') }}
          </a>
        </div>

        <Select
          v-model:value="selectedServices"
          class="services__select"
          :options="serviceOptions"
          :placeholder="i18n.t('cluster.rotateCertificates.placeholder')"
          :multiple="true"
          :close-on-select="false"
          :deselect-from-dropdown="true"
          :clearable="true"
          aria-labelledby="rotate-certificates-services-label"
          :aria-describedby="selectedServices.length ? 'rotate-certificates-services-summary' : undefined"
          :aria-required="true"
        >
          <template #option="option">
            <div class="service-option">
              <span>{{ option.label }}</span>
              <i
                v-if="isSelected(option)"
                class="icon icon-checkmark"
              />
            </div>
          </template>

          <template #selected-option-container="{ option, deselect }">
            <span
              v-if="tokenIndex(option) < MAX_VISIBLE_TOKENS"
              class="vs__selected"
            >
              {{ option.label }}
              <!-- The close icon comes from the global .vs__deselect:after style -->
              <button
                type="button"
                class="vs__deselect"
                :aria-label="i18n.t('cluster.rotateCertificates.deselect', { service: option.label })"
                @mousedown.stop.prevent
                @click.stop="deselect(option)"
              />
            </span>
            <span
              v-else-if="tokenIndex(option) === MAX_VISIBLE_TOKENS"
              class="services__more"
              data-testid="rotate-certificates-more"
            >
              {{ i18n.t('cluster.rotateCertificates.more', { count: hiddenTokenCount }) }}
            </span>
            <!-- Rendering nothing here would make vue-select fall back to its default token -->
            <span
              v-else
              hidden
            />
          </template>
        </Select>

        <p
          v-if="selectedServices.length"
          id="rotate-certificates-services-summary"
          class="services__summary text-muted"
          data-testid="rotate-certificates-summary"
        >
          {{ selectionSummary }}
        </p>
      </div>
    </div>

    <Banner
      v-for="(error, i) in errors"
      :key="i"
      class="m-0"
      color="error"
      :label="error"
    />

    <template #primary-action="{ primaryAction }">
      <RcButton
        variant="primary"
        size="large"
        :disabled="rotateDisabled"
        :aria-busy="rotating"
        data-testid="rotate-certificates-rotate"
        @click="primaryAction"
      >
        {{ i18n.t('cluster.rotateCertificates.rotate') }}
      </RcButton>
    </template>
  </RcModal>
</template>

<style lang='scss' scoped>
  .services {
    // Lines the field up with the radio labels: the 14px radio plus RadioButton's own label spacing
    margin: 10px 0 0 19px;

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 5px;

      label {
        color: var(--input-label);
      }
    }

    &__select {
      width: 100%;

      // The clear-all button duplicates the Reset link above the field
      :deep() .vs__clear {
        display: none;
      }
    }

    &__more {
      display: flex;
      align-items: center;
      padding: 0 5px;
      color: var(--link);
      white-space: nowrap;
    }

    &__summary {
      margin-top: 5px;
      font-size: 12px;
    }
  }

  .service-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
</style>
