<script>
import ArrayList from '@shell/components/form/ArrayList';
import LabeledInput from '@shell/components/form/LabeledInput';
import Select from '@shell/components/form/Select';
import Checkbox from '@shell/components/form/Checkbox';
import InputWithSelect from '@shell/components/form/InputWithSelect';
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
    ArrayList, Checkbox, InputWithSelect, LabeledInput, Select
  },
  props:      {
    mode: {
      type:     String,
      required: true,
    },
    value: {
      type:     Object,
      required: true
    }
  },
  data() {
    this.$set(this.value, 'http_config', this.value.http_config || {});
    this.$set(this.value, 'send_resolved', typeof this.value.send_resolved === 'boolean' ? this.value.send_resolved : true);
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
      TYPES
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
      <div class="col span-12">
        <LabeledInput v-model="value.api_key" :mode="mode" label="API Key" />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-12">
        <LabeledInput v-model="value.http_config.proxy_url" :mode="mode" label="Proxy URL" placeholder="e.g. http://my-proxy/" />
      </div>
    </div>
    <div class="row mb-20">
      <Checkbox v-model="value.send_resolved" :mode="mode" label="Enable send resolved alerts" />
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
