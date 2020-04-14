<script>
import GatekeeperConstraint from '@/shared/gatekeeper-constraint';
import { AS_YAML, _FLAGGED } from '@/config/query-params';
import ResourceYaml from '@/components/ResourceYaml';

import NameNsDescription from '@/components/form/NameNsDescription';
import LabeledSelect from '@/components/form/LabeledSelect';
import { findAllConstraintTypes } from '@/utils/gatekeeper/util';
import { DESCRIPTION } from '@/config/labels-annotations';

const CONSTRAINT_PREFIX = 'constraints.gatekeeper.sh.';

async function yamlUpdater(value) {
  this.obj = await this.$store.dispatch('cluster/create', this.localValue);
  this.yaml = window.jsyaml.safeDump(this.localValue);
}

export default {
  components: {
    GatekeeperConstraint, LabeledSelect, NameNsDescription, ResourceYaml
  },

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
      localValue: {
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
        metadata: { name: null, annotations: { [DESCRIPTION]: null } }
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
        yamlUpdater.call(this, value);
      },
      deep: true
    }
  },

  created() {
    yamlUpdater.call(this, this.localValue);
  },
  methods: {
    navigateToEditAsYaml() {
      this.$router.push({ query: { ...this.$route.query, [AS_YAML]: _FLAGGED } });
    },
    navigateToEditAsForm() {
      this.$router.applyQuery({ [AS_YAML]: undefined });
    },
    done() {
      this.$router.replace({
        name:   'c-cluster-gatekeeper-constraints',
        params: this.$route.params
      });
    }
  }
};
</script>

<template>
  <div>
    <header>
      <h1>Constraint</h1>
      <div class="actions">
        <button v-if="editAsYaml" class="btn bg-primary" @click="navigateToEditAsForm">
          Edit as form
        </button>
        <button v-else class="btn bg-primary" @click="navigateToEditAsYaml">
          Edit as YAML
        </button>
      </div>
    </header>
    <div
      v-if="editAsYaml"
    >
      <NameNsDescription :value="localValue" :mode="mode" :namespaced="false" :extra-columns="['template']" @input="$set(localValue, 'type', $event)">
        <template v-slot:template>
          <LabeledSelect
            :mode="mode"
            :value="localValue.type"
            :options="templateOptions"
            label="Template"
            @input="$set(localValue, 'type', $event)"
          />
        </template>
      </NameNsDescription>
      <ResourceYaml
        v-if="obj"
        :key="yaml"
        :obj="obj"
        :value="yaml"
        :for-create="true"
        :done-override="done"
      />
    </div>
    <GatekeeperConstraint v-else :value="localValue" :mode="mode" @input="localValue = $event" />
  </div>
</template>
