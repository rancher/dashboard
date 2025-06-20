<script lang="ts">
import { PropType } from 'vue';
import jsyaml from 'js-yaml';
import { merge } from 'lodash';
import { set, get } from '@shell/utils/object';
import YAML from 'yaml';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import Loading from '@shell/components/Loading.vue';
import AsyncButton from '@shell/components/AsyncButton.vue';
import { Banner } from '@components/Banner';
import { CONFIG_MAP, MANAGEMENT } from '@shell/config/types';
import { _EDIT, _VIEW } from '@shell/config/query-params';

export interface Setting {
  weight: number,
  type: 'string' | 'number' | 'boolean',
  path: string,
  default: any,
  tooltip: boolean,
  info: boolean,
}

export type SettingDisplay = Setting & {
  name: string,
  label: string,
  description: string,
  tooltipLabel?: string,
  infoLabel?: string
}

interface DataType {
  noPermissions: boolean,
  configMap: any,
  values: object,
  valuesErrors: string[],
  errors: string[]
}

export default {

  name: 'ConfigMapSettings',

  emits: ['done', 'errors'],

  components: {
    LabeledInput,
    Checkbox,
    Loading,
    AsyncButton,
    Banner,
  },

  props: {
    settings: {
      type:     Object as PropType<Record<string, Setting>>,
      required: true
    },

    path: {
      type:     String,
      required: true
    },

    name: {
      type:     String,
      required: true
    },

    namespace: {
      type:     String,
      required: true
    },

    inStore: {
      type:    String,
      default: 'cluster',
    },

    title: {
      type:    String,
      default: ''
    },

    description: {
      type:    String,
      default: ''
    }
  },

  async fetch() {
    if (this.$store.getters[`${ this.inStore }/schemaFor`](CONFIG_MAP)) {
      try {
        this.configMap = await this.$store.dispatch(`${ this.inStore }/find`, { type: CONFIG_MAP, id: `${ this.namespace }/${ this.name }` });

        const val = get(this.configMap || {}, `data.${ this.path }`) || '';

        this.values = YAML.parse(val);
      } catch (err: any) {
        if (!(err.status === 404 || err._status === 404)) {
          this.valuesErrors.push(err);
        }
      }
    } else {
      this.noPermissions = true;
    }
  },

  data(): DataType {
    return {
      noPermissions: false,
      configMap:     null,
      values:        {},
      valuesErrors:  [],
      errors:        []
    };
  },

  computed: {
    settingsDisplay(): SettingDisplay[] {
      const list = Object.keys(this.settings).reduce((acc, name) => [
        ...acc,
        {
          ...this.settings[name],
          name,
          label:        this.display(name, 'label'),
          description:  this.display(name, 'description'),
          tooltipLabel: this.settings[name].tooltip ? this.display(name, 'tooltip') : '',
          infoLabel:    this.settings[name].info ? this.display(name, 'info') : '',
        },
      ], [] as SettingDisplay[]);

      return list.sort((a, b) => `${ this.settings[a.name].weight }-${ a.label }`.localeCompare(`${ this.settings[b.name].weight }-${ b.label }`));
    },

    mode() {
      const settingsSchema = this.$store.getters[`${ this.inStore }/schemaFor`](MANAGEMENT.SETTING);
      const configMapsSchema = this.$store.getters[`${ this.inStore }/schemaFor`](CONFIG_MAP);

      if (settingsSchema?.resourceMethods?.includes('PUT') && configMapsSchema?.resourceMethods?.includes('PUT')) {
        return _EDIT;
      }

      return _VIEW;
    },

    canEdit() {
      return this.mode === _EDIT && !this.valuesErrors.length;
    },

    fetchState(): {pending: boolean} {
      return (this as any).$fetchState;
    },
  },

  methods: {
    get(item: SettingDisplay) {
      const out = get(this.values, item.path);

      if (out === undefined) {
        return this.settings[item.name].default;
      }

      return out;
    },

    set(item: SettingDisplay, value: any) {
      set(this.values, item.path, value);
    },

    async save(btnCB: (arg: boolean) => void) {
      const configMap = this.configMap || await this.$store.dispatch(`${ this.inStore }/create`, {
        type:     CONFIG_MAP,
        metadata: {
          namespace: this.namespace,
          name:      this.name
        },
        data: {}
      });

      try {
        // Create default values object
        const defaultValues = Object.keys(this.settings).reduce((acc, name) => {
          set(acc, this.settings[name].path, this.settings[name].default);

          return acc;
        }, {} as object);

        // Merge default values with form values
        const values = merge(defaultValues, this.values);

        // Merge data with current values from this.path
        configMap.data = merge(configMap.data, { [this.path]: jsyaml.dump(merge(configMap[this.path] || {}, values)) });

        await configMap.save();

        this.$emit('done', configMap);
        btnCB(true);
      } catch (err: any) {
        this.errors.push(err);
        this.$emit('errors', this.errors);
        btnCB(false);
      }
    },

    display(name: string, key: 'label' | 'description' | 'tooltip' | 'info') {
      return this.t(`${ this.path }.settings.${ name }.${ key }`);
    }
  }
};
</script>

<template>
  <Loading v-if="fetchState.pending" />
  <div v-else-if="noPermissions">
    <span>
      {{ t(`${ path }.settings.noPermissions`) }}
    </span>
  </div>
  <div v-else>
    <div class="header mb-20">
      <h1>
        {{ title || 'Settings' }}
      </h1>

      <span
        class="text-muted"
      >
        {{ description || '' }}
      </span>
    </div>

    <template
      v-for="(err, j) in errors"
      :key="j"
    >
      <Banner
        color="error"
        :label="err"
      />
    </template>

    <div
      v-for="item in settingsDisplay"
      :key="item.name"
      class="settings-container mt-30"
    >
      <div class="header">
        <h3
          class="label"
        >
          {{ item.label }}
          <i
            v-if="item.tooltip"
            v-clean-tooltip="item.tooltipLabel"
            class="icon icon-info"
          />
        </h3>
        <span
          class="description text-muted"
        >
          {{ item.description }}
        </span>

        <Banner
          v-if="item.info"
          color="warning"
          :label="item.infoLabel"
        />
      </div>

      <div class="value mt-10">
        <template v-if="item.type === 'string'">
          <LabeledInput
            :value="get(item)"
            :mode="mode"
            :label="item.label"
            :placeholder="''"
            @input="set(item, ($event?.target as any)?.value)"
          />
        </template>

        <template v-else-if="item.type === 'number'">
          <LabeledInput
            :value="get(item)"
            :mode="mode"
            :label="item.label"
            class="input"
            type="number"
            @update:value="set(item, $event)"
          />
        </template>

        <template v-else-if="item.type === 'boolean'">
          <Checkbox
            :value="get(item)"
            :mode="mode"
            :label="item.label"
            @update:value="set(item, $event)"
          />
        </template>
      </div>
    </div>

    <div v-if="canEdit">
      <AsyncButton
        class="pull-right mt-20"
        mode="apply"
        @click="save"
      />
    </div>
  </div>
</template>

<style scoped lang='scss'>
  .settings-container {
    display: flex;
    flex-direction: column;
  }
</style>
