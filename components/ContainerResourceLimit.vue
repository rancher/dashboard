<script>
import { isEmpty } from 'lodash';
import UnitInput from '@/components/form/UnitInput';
import { CONTAINER_DEFAULT_RESOURCE_LIMIT } from '@/config/labels-annotations';
import { _VIEW } from '@/config/query-params';

export default {
  components: { UnitInput },

  props:      {
    mode: {
      type:    String,
      default: 'create'
    },

    namespace: {
      type:    Object,
      default: () => ({})
    },

    registerBeforeHook: {
      type:    Function,
      default: null
    },
  },

  data() {
    return {
      limitsCpu:      null,
      limitsMemory:   null,
      requestsCpu:    null,
      requestsMemory: null,
      viewMode:       _VIEW,
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
      this.registerBeforeHook(this.updateLimits);
    }
  },

  methods: {
    updateLimits(value) {
      const {
        limitsCpu,
        limitsMemory,
        requestsCpu,
        requestsMemory,
      } = this;
      const namespace = this.namespace; // no deep copy in destructure proxy yet
      const out = {
        limitsCpu,
        limitsMemory,
        requestsCpu,
        requestsMemory,
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
    <div class="row mb-5 pl-10">
      <div class="col span-12">
        <p class="helper-text mb-10">
          <t v-if="mode === viewMode" k="containerResourceLimit.helpTextDetail" />
          <t v-else k="containerResourceLimit.helpText" />
        </p>
      </div>
    </div>
    <div class="row">
      <div class="col span-12">
        <div class="row">
          <span class="col span-6">
            <UnitInput
              v-model="requestsCpu"
              :suffix="t('suffix.cpus')"
              :placeholder="t('containerResourceLimit.cpuPlaceholder')"
              :label="t('containerResourceLimit.requestsCpu')"
              :input-exponent="-1"
              :mode="mode"
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
            />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
