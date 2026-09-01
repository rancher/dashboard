<script>
import isEmpty from 'lodash/isEmpty';
import UnitInput from '@shell/components/form/UnitInput';
import { CONTAINER_DEFAULT_RESOURCE_LIMIT } from '@shell/config/labels-annotations';
import { cleanUp } from '@shell/utils/object';
import { _VIEW } from '@shell/config/query-params';

export default {
  emits: ['update:value'],

  components: { UnitInput },

  props: {
    mode: {
      type:    String,
      default: 'create'
    },

    namespace: {
      type:    Object,
      default: null
    },

    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    handleGpuLimit: {
      type:    Boolean,
      default: true
    },

    registerBeforeHook: {
      type:    Function,
      default: null
    },

    showTip: {
      type:    Boolean,
      default: true
    }
  },

  data() {
    const {
      limitsCpu, limitsMemory, requestsCpu, requestsMemory, limitsGpu
    } = this.value;

    return {
      limitsCpu, limitsMemory, requestsCpu, requestsMemory, limitsGpu, viewMode: _VIEW
    };
  },

  watch: {
    value() {
      const {
        limitsCpu, limitsMemory, requestsCpu, requestsMemory, limitsGpu
      } = this.value;

      this.limitsCpu = limitsCpu;
      this.limitsMemory = limitsMemory;
      this.requestsCpu = requestsCpu;
      this.requestsMemory = requestsMemory;
      this.limitsGpu = limitsGpu;
    }
  },

  computed: {
    detailTopColumns() {
      return [
        {
          title: this.$store.getters['i18n/t']('generic.created'),
          name:  'created'
        },
      ];
    },
  },

  created() {
    if (this?.namespace?.id) {
      this.initLimits();
    }

    if (this.registerBeforeHook) {
      this.registerBeforeHook(this.updateBeforeSave);
    }
  },

  methods: {
    updateLimits() {
      const {
        limitsCpu,
        limitsMemory,
        requestsCpu,
        requestsMemory,
        limitsGpu
      } = this;

      this.$emit('update:value', cleanUp({
        limitsCpu,
        limitsMemory,
        requestsCpu,
        limitsGpu,
        requestsMemory
      }));
    },

    updateBeforeSave(value) {
      const {
        limitsCpu,
        limitsMemory,
        requestsCpu,
        requestsMemory,
        limitsGpu
      } = this;
      const namespace = this.namespace; // no deep copy in destructure proxy yet

      const out = cleanUp({
        limitsCpu,
        limitsMemory,
        requestsCpu,
        limitsGpu,
        requestsMemory
      });

      if (namespace) {
        namespace.setAnnotation(CONTAINER_DEFAULT_RESOURCE_LIMIT, JSON.stringify(out));
      }
    },

    initLimits() {
      const namespace = this.namespace;
      const defaults = namespace?.metadata?.annotations[CONTAINER_DEFAULT_RESOURCE_LIMIT];

      // Ember UI can set the defaults to the string literal 'null'
      if (!isEmpty(defaults) && defaults !== 'null') {
        const {
          limitsCpu,
          limitsMemory,
          requestsCpu,
          requestsMemory,
          limitsGpu
        } = JSON.parse(defaults);

        this.limitsCpu = limitsCpu;
        this.limitsMemory = limitsMemory;
        this.requestsCpu = requestsCpu;
        this.requestsMemory = requestsMemory;
        this.limitsGpu = limitsGpu;
      }
    },
  }

};
</script>

<template>
  <div>
    <div class="row">
      <div
        v-if="showTip"
        class="col span-12"
      >
        <p class="helper-text mb-10">
          <t
            v-if="mode === viewMode"
            k="containerResourceLimit.helpTextDetail"
          />
          <t
            v-else
            k="containerResourceLimit.helpText"
          />
        </p>
      </div>
    </div>

    <div class="row mb-20">
      <span class="col span-6">
        <UnitInput
          v-model:value="requestsCpu"
          :placeholder="t('containerResourceLimit.cpuPlaceholder')"
          :label="t('containerResourceLimit.requestsCpu')"
          :mode="mode"
          :input-exponent="-1"
          :output-modifier="true"
          :base-unit="t('suffix.cpus')"
          data-testid="cpu-reservation"
          @update:value="updateLimits"
        />
      </span>
      <span class="col span-6">
        <UnitInput
          v-model:value="requestsMemory"
          :placeholder="t('containerResourceLimit.memPlaceholder')"
          :label="t('containerResourceLimit.requestsMemory')"
          :mode="mode"
          :input-exponent="2"
          :increment="1024"
          :output-modifier="true"
          data-testid="memory-reservation"
          @update:value="updateLimits"
        />
      </span>
    </div>

    <div class="row mb-20">
      <span class="col span-6">
        <UnitInput
          v-model:value="limitsCpu"
          :placeholder="t('containerResourceLimit.cpuPlaceholder')"
          :label="t('containerResourceLimit.limitsCpu')"
          :mode="mode"
          :input-exponent="-1"
          :output-modifier="true"
          :base-unit="t('suffix.cpus')"
          data-testid="cpu-limit"
          @update:value="updateLimits"
        />
      </span>
      <span class="col span-6">
        <UnitInput
          v-model:value="limitsMemory"
          :placeholder="t('containerResourceLimit.memPlaceholder')"
          :label="t('containerResourceLimit.limitsMemory')"
          :mode="mode"
          :input-exponent="2"
          :increment="1024"
          :output-modifier="true"
          data-testid="memory-limit"
          @update:value="updateLimits"
        />
      </span>
    </div>
    <div
      v-if="handleGpuLimit"
      class="row"
    >
      <span class="col span-6">
        <UnitInput
          v-model:value="limitsGpu"
          :placeholder="t('containerResourceLimit.gpuPlaceholder')"
          :label="t('containerResourceLimit.limitsGpu')"
          :mode="mode"
          :base-unit="t('suffix.gpus')"
          data-testid="gpu-limit"
          @update:value="updateLimits"
        />
      </span>
    </div>
  </div>
</template>
