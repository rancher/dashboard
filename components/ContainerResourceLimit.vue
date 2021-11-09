<script>
import isEmpty from 'lodash/isEmpty';
import UnitInput from '@/components/form/UnitInput';
import { CONTAINER_DEFAULT_RESOURCE_LIMIT } from '@/config/labels-annotations';
import { _VIEW } from '@/config/query-params';
import { parseSi, formatSi } from '@/utils/units';
import { cleanUp } from '@/utils/object';

export default {
  components: { UnitInput },

  props:      {
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
      limitsCpu, limitsMemory, requestsCpu, requestsMemory
    } = this.value;

    // // Convert string inputs w/ increment modifiers to integers eg "1m" CPUS -> .001 CPUS
    // const parsed = {
    //   limitsCpu:      limitsCpu ? parseSi(limitsCpu) : null,
    //   limitsMemory:   limitsMemory ? parseSi(limitsMemory) : null,
    //   requestsCpu:    requestsCpu ? parseSi(requestsCpu) : null,
    //   requestsMemory: requestsMemory ? parseSi(requestsMemory) : null,
    // };

    // // debugger;
    // // format cpu integers to milliCPU and Bytes integers to MiB
    // const formatted = {
    //   limitsCpu:  parsed.limitsCpu ? formatSi(parsed.limitsCpu, {
    //     minExponent: 1, maxExponent: 1, addSuffix: true, increment: 1 / 1000
    //   }) : null,
    //   limitsMemory: parsed.limitsMemory ? formatSi(parsed.limitsMemory, {
    //     minExponent: 2, maxExponent: 2, addSuffix: true, increment: 1024,
    //   }) : null,
    //   requestsCpu:  parsed.requestsCpu ? formatSi(parsed.requestsCpu, {
    //     minExponent: 1, maxExponent: 1, addSuffix: true, increment: 1 / 1000,
    //   }) : null,
    //   requestsMemory: parsed.requestsMemory ? formatSi(parsed.requestsMemory, {
    //     minExponent: 2, maxExponent: 2, addSuffix: true, increment: 1024,
    //   }) : null,
    //   viewMode: _VIEW,
    // };

    return {
      ...{
        limitsCpu, limitsMemory, requestsCpu, requestsMemory
      }
    };
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
      } = this;

      this.$emit('input', cleanUp({
        limitsCpu,
        limitsMemory,
        requestsCpu,
        requestsMemory
      }));
    },

    updateBeforeSave(value) {
      const {
        limitsCpu,
        limitsMemory,
        requestsCpu,
        requestsMemory,
      } = this;
      const namespace = this.namespace; // no deep copy in destructure proxy yet

      const out = cleanUp({
        limitsCpu,
        limitsMemory,
        requestsCpu,
        requestsMemory
      });

      if (namespace) {
        namespace.setAnnotation(CONTAINER_DEFAULT_RESOURCE_LIMIT, JSON.stringify(out));
      }
    },

    initLimits() {
      const namespace = this.namespace;
      const defaults = namespace?.metadata?.annotations[CONTAINER_DEFAULT_RESOURCE_LIMIT];

      if (!isEmpty(defaults)) {
        const {
          limitsCpu,
          limitsMemory,
          requestsCpu,
          requestsMemory,
        } = JSON.parse(defaults);

        this.limitsCpu = limitsCpu;
        this.limitsMemory = limitsMemory;
        this.requestsCpu = requestsCpu;
        this.requestsMemory = requestsMemory;
      }
    },
  }

};
</script>

<template>
  <div>
    <div class="row">
      <div v-if="showTip" class="col span-12">
        <p class="helper-text mb-10">
          <t v-if="mode === viewMode" k="containerResourceLimit.helpTextDetail" />
          <t v-else k="containerResourceLimit.helpText" />
        </p>
      </div>
    </div>

    <div class="row mb-20">
      <span class="col span-6">
        <UnitInput
          v-model="requestsCpu"
          :suffix="t('suffix.cpus')"
          :placeholder="t('containerResourceLimit.cpuPlaceholder')"
          :label="t('containerResourceLimit.requestsCpu')"
          :input-exponent="-1"
          :mode="mode"
          :output-modifier="true"
          @input="updateLimits"
        />
      </span>
      <span class="col span-6">
        <UnitInput
          v-model="requestsMemory"
          :suffix="t('suffix.ib')"
          :placeholder="t('containerResourceLimit.memPlaceholder')"
          :label="t('containerResourceLimit.requestsMemory')"
          :input-exponent="2"
          :increment="1024"
          :mode="mode"
          :output-modifier="true"
          @input="updateLimits"
        />
      </span>
    </div>

    <div class="row">
      <span class="col span-6">
        <UnitInput
          v-model="limitsCpu"
          :suffix="t('suffix.cpus')"
          :placeholder="t('containerResourceLimit.cpuPlaceholder')"
          :label="t('containerResourceLimit.limitsCpu')"
          :input-exponent="-1"
          :mode="mode"
          :output-modifier="true"
          @input="updateLimits"
        />
      </span>
      <span class="col span-6">
        <UnitInput
          v-model="limitsMemory"
          :suffix="t('suffix.ib')"
          :placeholder="t('containerResourceLimit.memPlaceholder')"
          :label="t('containerResourceLimit.limitsMemory')"
          :input-exponent="2"
          :increment="1024"
          :mode="mode"
          :output-modifier="true"
          @input="updateLimits"
        />
      </span>
    </div>
  </div>
</template>
