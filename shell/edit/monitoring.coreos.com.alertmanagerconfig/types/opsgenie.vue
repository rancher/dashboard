<script>
import ArrayList from '@shell/components/form/ArrayList';
import { LabeledInput } from '@components/Form/LabeledInput';
import Select from '@shell/components/form/Select';
import { Checkbox } from '@components/Form/Checkbox';
import InputWithSelect from '@shell/components/form/InputWithSelect';
import SimpleSecretSelector from '@shell/components/form/SimpleSecretSelector';
import { _VIEW } from '@shell/config/query-params';

export const TARGETS = [
  {
    label: 'Id',
    value: 'id'
  },
  {
    label: 'Name',
    value: 'name'
  },
  {
    label: 'Username',
    value: 'username'
  }
];

export const TYPES = [
  {
    label: 'Team',
    value: 'team'
  },
  {
    label: 'User',
    value: 'user'
  },
  {
    label: 'Escalation',
    value: 'escalation'
  },
  {
    label: 'Schedule',
    value: 'schedule'
  }
];

export default {
  components: {
    ArrayList, Checkbox, InputWithSelect, LabeledInput, Select, SimpleSecretSelector
  },
  props:      {
    mode: {
      type:     String,
      required: true,
    },
    value: {
      type:     Object,
      required: true
    },
    namespace: {
      type:     String,
      default:  ''
    }
  },
  data() {
    this.$set(this.value, 'httpConfig', this.value.httpConfig || {});
    this.$set(this.value, 'sendResolved', typeof this.value.sendResolved === 'boolean' ? this.value.send_resolved : true);
    this.$set(this.value, 'responders', this.value.responders || []);

    const responders = this.value.responders.map((responder) => {
      const target = TARGETS.find(target => responder[target.value]);

      return {
        type:   responder.type,
        target: target.value,
        value:  responder[target.value]
      };
    });

    return {
      defaultResponder: {
        type:   TYPES[0].value,
        target: TARGETS[0].value,
        value:  ''
      },
      responders,
      TARGETS,
      TYPES,
      view:                          _VIEW,
      initialApiKeySecretName:  this.value?.apiKey?.name ? this.value.apiKey.name : '',
      initialApiKeySecretKey:  this.value?.apiKey?.key ? this.value.apiKey.key : '',
      none:                    '__[[NONE]]__',
    };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    }
  },

  watch: {
    responders: {
      deep: true,
      handler() {
        const responders = this.responders.map((responder) => {
          return {
            type:               responder.type,
            [responder.target]: responder.value
          };
        });

        this.$set(this.value, 'responders', responders);
      }
    }
  },

  methods: {
    updateResponder({ selected, text }, row) {
      row.target = selected;
      row.value = text;
    },
    typeLabel(type) {
      return TYPES.find(t => t.value === type).label;
    },
    targetLabel(target) {
      return TARGETS.find(t => t.value === target).label;
    },
    updateApiKeySecretName(name) {
      const existingKey = this.value.apiKey?.key || '';

      if (this.value.apiKey) {
        if (name === this.none) {
          delete this.value.apiKey;
        } else {
          this.value.apiKey = {
            key: existingKey,
            name,
          };
        }
      } else {
        this.value['apiKey'] = {
          key: '',
          name
        };
      }
    },
    updateApiKeySecretKey(key) {
      const existingName = this.value.apiKey?.name || '';

      if (this.value.apiKey) {
        this.value.apiKey = {
          name: existingName,
          key
        };
      } else {
        this.value['apiKey'] = {
          name: '',
          key
        };
      }
    }
  }
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-12">
        <h3>Target</h3>
      </div>
    </div>
    <div class="row mb-20">
      <SimpleSecretSelector
        v-if="namespace"
        :initial-key="initialApiKeySecretKey"
        :mode="mode"
        :initial-name="initialApiKeySecretName"
        :namespace="namespace"
        :disabled="mode === view"
        :secret-name-label="t('monitoring.alertmanagerConfig.opsgenie.apiKey')"
        @updateSecretName="updateApiKeySecretName"
        @updateSecretKey="updateApiKeySecretKey"
      />
      <Banner v-else color="error">
        {{ t('alertmanagerConfigReceiver.namespaceWarning') }}
      </Banner>
    </div>
    <div class="row mb-20">
      <div class="col span-12">
        <LabeledInput v-model="value.httpConfig.proxyUrl" :mode="mode" label="Proxy URL" placeholder="e.g. http://my-proxy/" />
      </div>
    </div>
    <div class="row mb-20">
      <Checkbox v-model="value.sendResolved" :mode="mode" label="Enable send resolved alerts" />
    </div>
    <div class="row">
      <div class="col span-12">
        <h3>Responders</h3>
        <ArrayList v-model="responders" :mode="mode" :default-add-value="defaultResponder" :show-header="true">
          <template v-slot:column-headers>
            <div class="responders-heading">
              <div class="row" :class="{'mb-15': isView, 'mb-10': !isView}">
                <div class="col span-6">
                  <span class="text-label">Type</span>
                </div>
                <div class="col span-6 send-to">
                  <span class="text-label">Send To</span>
                </div>
              </div>
            </div>
          </template>
          <template v-slot:columns="scope">
            <div class="row responder">
              <div class="col span-6">
                <span v-if="isView">{{ typeLabel(scope.row.value.type) }}</span>
                <Select v-else v-model="scope.row.value.type" :mode="mode" :options="TYPES" />
              </div>
              <div class="col-span-6 target-container">
                <span v-if="isView">{{ targetLabel(scope.row.value.target) }}: {{ scope.row.value.value }}</span>
                <InputWithSelect
                  v-else
                  class="target"
                  :mode="mode"
                  :options="TARGETS"
                  :select-value="scope.row.value.target"
                  :text-value="scope.row.value.value"
                  @input="updateResponder($event, scope.row.value)"
                />
              </div>
            </div>
          </template>
        </ArrayList>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .responders-heading {
    display: grid;
    grid-template-columns: auto $array-list-remove-margin;
  }

  .responder {
    &, .target-container {
      width: 100%;
    }

    .target-container ::v-deep .unlabeled-select {
      min-width: 35%;
      height: 100%;
    }

    .target {
      height: 100%;
    }
  }
</style>
