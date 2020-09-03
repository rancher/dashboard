<script>
import jsyaml from 'js-yaml';
import GatekeeperConstraint from '@/edit/gatekeeper-constraint';
import { AS_YAML, _FLAGGED } from '@/config/query-params';
import { findAllConstraintTypes } from '@/utils/gatekeeper/util';
import { DESCRIPTION } from '@/config/labels-annotations';

const CONSTRAINT_PREFIX = 'constraints.gatekeeper.sh.';

export default {
  components: { GatekeeperConstraint },
  data() {
    const constraintTypes = findAllConstraintTypes(this.$store);
    const templateOptions = constraintTypes.map((type) => {
      return {
        label: type.replace(CONSTRAINT_PREFIX, ''),
        value: type
      };
    });

    return {
      templateOptions,
      mode:            'create',
      yaml:       '',
      obj:        null,
      value:     {
        type:  templateOptions[0].value,
        spec: {
          parameters: {},
          match:      {
            kinds:              [],
            namespaces:         [],
            excludedNamespaces: [],
            labelSelector:      { matchExpressions: [] },
            namespaceSelector:  { matchExpressions: [] }
          }
        },
        metadata: { name: '', annotations: { [DESCRIPTION]: '' } }
      },
    };
  },
  computed: {
    editAsYaml() {
      return this.$route.query[AS_YAML] === _FLAGGED;
    },
  },
  watch: {
    localValue: {
      handler(value) {
        this.yamlUpdater(value);
      },
      deep: true
    }
  },

  methods: {
    async yamlUpdater(value) {
      this.obj = await this.$store.dispatch('cluster/create', this.localValue);
      this.yaml = jsyaml.safeDump(this.localValue);
    }
  }
};
</script>

<template>
  <GatekeeperConstraint v-if="value" :value="value" :mode="mode" @input="value = $event" />
</template>
