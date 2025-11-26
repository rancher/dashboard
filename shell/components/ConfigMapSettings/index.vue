<script lang="ts">
import { PropType } from 'vue';
import jsyaml from 'js-yaml';
import { merge } from 'lodash';
import { set, get } from '@shell/utils/object';
import YAML from 'yaml';
import { CONFIG_MAP, MANAGEMENT } from '@shell/config/types';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { toSeconds } from '@shell/utils/duration';
import Loading from '@shell/components/Loading.vue';
import AsyncButton from '@shell/components/AsyncButton.vue';
import { Banner } from '@rc/Banner';
import Settings from '@shell/components/ConfigMapSettings/Settings.vue';

export type SettingType = 'string' | 'number' | 'boolean' | 'array' | 'object';

export type SettingHandler = 'Textarea' | 'KeyValue' | 'Taints' | 'UnitInput';

export interface Item {
  type: SettingType,
  value: string
}

export interface Group {
  name: string,
  children: string[],
  expanded?: boolean,
  weight: number,
}

export interface Setting {
  path: string,
  type: SettingType,
  handler?: SettingHandler,
  items?: Item[],
  default: object | string | boolean | number,
  tooltip?: boolean,
  info?: boolean,
  placeholder?: boolean,
  class?: string,
  weight: number,
  // validationRules,
}

interface DataType {
  noPermissions: boolean,
  configMap: object | null,
  values: object,
  errors: string[]
  valuesErrors: string[],
}

export default {

  name: 'ConfigMapSettings',

  emits: ['done', 'errors'],

  components: {
    Loading,
    AsyncButton,
    Banner,
    Settings,
  },

  props: {
    /**
     * A key-value object that defines a flat list of settings.
     * Each entry describe the setting name and the path where to get/set in the ConfigMap data field
     *
     * example:
     *
     *  {
     *    setting-name: {
     *      weight:  0,
     *      type:    'number',
     *      path:    'the.path.to.nested.value',
     *      default: '50',
     *      tooltip: false,
     *      info:    false,
     *    },
     *    ...
     *  }
     */
    settings: {
      type:     Object as PropType<Record<string, Setting>>,
      required: true
    },

    /**
     * Groups of Settings
     */
    groups: {
      type:    Array as PropType<Group[]>,
      default: () => [],
    },

    /**
     * ConfigMap name
     */
    name: {
      type:     String,
      required: true
    },

    /**
     * ConfigMap namespace
     */
    namespace: {
      type:     String,
      required: true
    },

    /**
     * The key in ConfigMap.data where to save the settings values
     */
    dataKey: {
      type:     String,
      required: true
    },

    inStore: {
      type:    String,
      default: 'cluster',
    },

    labelKeyPrefix: {
      type:    String,
      default: 'settings'
    },

    showDescription: {
      type:    Boolean,
      default: false
    },

    showInfo: {
      type:    Boolean,
      default: false
    },
  },

  async fetch() {
    if (this.$store.getters[`${ this.inStore }/schemaFor`](CONFIG_MAP)) {
      try {
        this.configMap = await this.$store.dispatch(`${ this.inStore }/find`, { type: CONFIG_MAP, id: `${ this.namespace }/${ this.name }` });
      } catch (err) {
      }

      this.initValues();
    } else {
      this.noPermissions = true;
    }
  },

  data(): DataType {
    return {
      noPermissions: false,
      configMap:     null,
      values:        {},
      errors:        [],
      valuesErrors:  []
    };
  },

  computed: {
    mode() {
      if (this.valuesErrors.length) {
        return _VIEW;
      }

      const settingsSchema = this.$store.getters[`${ this.inStore }/schemaFor`](MANAGEMENT.SETTING);
      const configMapsSchema = this.$store.getters[`${ this.inStore }/schemaFor`](CONFIG_MAP);

      if (settingsSchema?.resourceMethods?.includes('PUT') && configMapsSchema?.resourceMethods?.includes('PUT')) {
        return _EDIT;
      }

      return _VIEW;
    },

    canEdit() {
      return this.mode === _EDIT;
    },

    fetchState(): {pending: boolean} {
      return (this as any).$fetchState;
    },
  },

  methods: {
    async save(btnCB: (arg: boolean) => void) {
      const configMap = this.configMap || await this.$store.dispatch(`${ this.inStore }/create`, {
        type:     CONFIG_MAP,
        metadata: {
          namespace: this.namespace,
          name:      this.name
        }
      });

      if (!configMap.data) {
        configMap.data = {};
      }

      try {
        const configMapValues = YAML.parse(configMap.data[this.dataKey] || '');

        const currentValues = this.buildValues(this.values, this.encodeValue);

        const values = merge(configMapValues, currentValues);

        configMap.data[this.dataKey] = jsyaml.dump(values);

        await configMap.save();

        this.$emit('done', configMap);
        btnCB(true);
      } catch (err) {
        this.errors.push(err as string);
        this.$emit('errors', this.errors);
        btnCB(false);
      }
    },

    initValues() {
      try {
        const configMapValues = get(this.configMap || {}, `data.${ this.dataKey }`);
        const currentValues = YAML.parse(configMapValues || '');

        this.values = this.buildValues(currentValues, this.decodeValue);
      } catch (err) {
        const msg = this.t(`${ this.labelKeyPrefix }.parseError`, { id: `${ this.namespace }/${ this.name }`, path: `data.${ this.dataKey }` }, true);

        this.valuesErrors.push(msg);
      }
    },

    buildValues<T = object | string | boolean | number>(values: object, fn: (name: string, value: T) => T) {
      return Object.keys(this.settings).reduce((acc, name) => {
        const value = get(values, this.settings[name].path);

        set(acc, this.settings[name].path, fn(name, value));

        return acc;
      }, {});
    },

    decodeValue<T = object | string | boolean | number>(name: string, value: T): T {
      // use default value
      if (value === undefined) {
        value = this.settings[name].default as T;
      }

      // object types to json
      if (this.settings[name].type === 'object' && this.settings[name].handler === 'Textarea') {
        value = JSON.stringify(value || {}) as T;
      }

      // number in seconds
      if (this.settings[name].type === 'number' && this.settings[name].handler === 'UnitInput') {
        value = toSeconds(value) as T;
      }

      return value;
    },

    encodeValue<T = object | string | boolean | number>(name: string, value: T): T {
      // object types from json
      if (this.settings[name].type === 'object' && this.settings[name].handler === 'Textarea') {
        value = YAML.parse(value as string);
      }

      // number to string with unit of measure
      if (this.settings[name].type === 'number' && this.settings[name].handler === 'UnitInput') {
        value = `${ value || 0 }s` as T;
      }

      return value;
    }
  }
};
</script>

<template>
  <Loading v-if="fetchState.pending" />
  <div v-else-if="noPermissions">
    <slot name="no-permissions">
      <span>
        {{ t(`${ labelKeyPrefix }.noPermissions`) }}
      </span>
    </slot>
  </div>
  <div
    v-else
    data-testid="cm-settings"
  >
    <slot name="header">
      <div class="header">
        <h1>
          {{ t(`${ labelKeyPrefix }.title`) }}
        </h1>

        <label
          v-if="showDescription"
          class="text-label"
        >
          {{ t(`${ labelKeyPrefix }.description`, {}, true) }}
        </label>
      </div>
    </slot>

    <slot name="info">
      <Banner
        v-if="showInfo"
        color="info"
        :label="t(`${ labelKeyPrefix }.info`, {}, true)"
      />
    </slot>

    <slot name="errors">
      <template
        v-for="(err, j) in [ ...valuesErrors, ...errors ]"
        :key="j"
      >
        <Banner
          color="error"
          data-testid="cm-settings-error"
          :label="err"
        />
      </template>
    </slot>

    <Settings
      class="mt-10"
      :settings="settings"
      :groups="groups"
      :values="values"
      :mode="mode"
      :label-key-prefix="labelKeyPrefix"
      @update:value="values=$event"
    />

    <div v-if="canEdit">
      <AsyncButton
        class="pull-right mt-30"
        :action-label="t(`${ labelKeyPrefix }.apply`)"
        @click="save"
      />
    </div>
  </div>
</template>

<style scoped lang='scss'>
</style>
