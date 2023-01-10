<script>
// Added by Verrazzano
import WebLogicWorkloadHelper from '@pkg/mixins/weblogic-workload-helper';
import VerrazzanoWebLogic8Workload from './VerrazzanoWebLogic8Workload';
import VerrazzanoWebLogic9Workload from './VerrazzanoWebLogic9Workload';

export default {
  name:       'VerrazzanoWebLogicWorkload',
  components: {
    VerrazzanoWebLogic8Workload,
    VerrazzanoWebLogic9Workload
  },
  mixins: [WebLogicWorkloadHelper],
  props:  {
    value: {
      type:     Object,
      required: true
    },
    mode: {
      type:    String,
      default: 'create'
    },
  },
  data() {
    let domainApiVersion = this.get(this.value, 'spec.workload.spec.template.apiVersion');

    // No use of computed properties from within the data block...
    if (this.mode === 'create') {
      domainApiVersion = this.getVerrazzanoWebLogicDomainApiVersion();
    } else if (domainApiVersion === undefined) {
      domainApiVersion = this.getVerrazzanoWebLogicDomain8ApiVersion();
      this.$set(this.value, 'spec.workload.spec.template.apiVersion', domainApiVersion);
    }

    return {
      apiVersion:     domainApiVersion,
      configRoot:     this.value,
      namespace:      '',
    };
  },
  computed: {
    isV8Domain() {
      return this.apiVersion === this.getVerrazzanoWebLogicDomain8ApiVersion();
    }
  },
  methods:  {
    initSpec() {
      this.$set(this.configRoot, 'spec', {
        workload: {
          apiVersion: this.verrazzanoComponentApiVersion,
          kind:       'VerrazzanoWebLogicWorkload',
          spec:       {
            template: {
              apiVersion: this.apiVersion,
              kind:       'Domain',
              metadata:   { },
              spec:       { }
            }
          }
        }
      });
    },
  },
  created() {
    if (!this.configRoot.spec?.workload?.spec?.template) {
      this.initSpec();
    }
  },
};
</script>

<template>
  <div class="if-wrapper">
    <VerrazzanoWebLogic8Workload v-if="isV8Domain" :value="value" :mode="mode" />
    <VerrazzanoWebLogic9Workload v-else :value="value" :mode="mode" />
  </div>
</template>

<style lang='scss' scoped src="@pkg/assets/styles/verrazzano.scss">
</style>

<style scoped>
.if-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
}
</style>
