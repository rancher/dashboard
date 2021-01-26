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

    const parsed = {
      limitsCpu:      limitsCpu ? parseSi(limitsCpu) : null,
      limitsMemory:   limitsMemory ? parseSi(limitsMemory) : null,
      requestsCpu:    requestsCpu ? parseSi(requestsCpu) : null,
      requestsMemory: requestsMemory ? parseSi(requestsMemory) : null,
    };

    const formatted = {
      limitsCpu:      formatSi(parsed.limitsCpu, {
        minExponent: 1, maxExponent: 1, addSuffix: false, increment: 1 / 1000
      }),
      limitsMemory:   formatSi(parsed.limitsMemory, {
        minExponent: 2, maxExponent: 2, addSuffix: false, increment: 1024,
      }),
      requestsCpu:    formatSi(parsed.requestsCpu, {
        minExponent: 1, maxExponent: 1, addSuffix: false, increment: 1 / 1000,
      }),
      requestsMemory: formatSi(parsed.requestsMemory, {
        minExponent: 2, maxExponent: 2, addSuffix: false, increment: 1024,
      }),
      viewMode: _VIEW,
    };

    return { ...formatted };
    // return { ...formatted };

    // return {
    //   limitsCpu, limitsMemory, requestsCpu, requestsMemory
    // };
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
      const out = {
        limitsCpu:      limitsCpu ? `${ limitsCpu }m` : null,
        limitsMemory:   limitsMemory ? `${ limitsMemory }Mi` : null,
        requestsCpu:    requestsCpu ? `${ requestsCpu }m` : null,
        requestsMemory: requestsMemory ? `${ requestsMemory }Mi` : null,
      };

      this.$emit('input', cleanUp(out));
    },

    updateBeforeSave(value) {
      const {
        limitsCpu,
        limitsMemory,
        requestsCpu,
        requestsMemory,
      } = this;
      const namespace = this.namespace; // no deep copy in destructure proxy yet
      const out = {
        limitsCpu:      `${ limitsCpu }m`,
        limitsMemory:   `${ limitsMemory }Mi`,
        requestsCpu:    `${ requestsCpu }m`,
        requestsMemory: `${ requestsMemory }Mi`,
      };

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
          :mode="mode"
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
          :mode="mode"
          @input="updateLimits"
        />
      </span>
    </div>
  </div>
</template>
