<script lang="ts">
import { PropType } from 'vue';
import jsyaml from 'js-yaml';
import { merge } from 'lodash';
import { set, get } from '@shell/utils/object';
import YAML from 'yaml';
import { CONFIG_MAP, MANAGEMENT } from '@shell/config/types';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import Loading from '@shell/components/Loading.vue';
import AsyncButton from '@shell/components/AsyncButton.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { Banner } from '@components/Banner';

type SettingType = 'string' | 'number' | 'boolean' | 'array'; // add here new types

interface Item {
  type: SettingType,
  value: string
}

export interface Setting {
  weight: number,
  path: string,
  type: SettingType,
  items?: Item[],
  default: any,
  tooltip: boolean,
  info: boolean,
  placeholder: boolean,
  // validationRules,
}

export type SettingDisplay = Setting & {
  name: string,
  options?: { label: string, value: string }[]
  label: string,
  description: string,
  tooltipLabel?: string,
  infoLabel?: string,
  placeholderLabel?: string,
}

interface DataType {
  noPermissions: boolean,
  configMap: any,
  values: object,
  errors: string[]
}

export default {

  name: 'ConfigMapSettings',

  emits: ['done', 'errors'],

  components: {
    LabeledInput,
    LabeledSelect,
    Checkbox,
    Loading,
    AsyncButton,
    Banner,
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
      } catch (err: any) {
      }

      const configMapValues = get(this.configMap || {}, `data.${ this.dataKey }`);
      const currentValues = YAML.parse(configMapValues || '');

      const defaultValues = Object.keys(this.settings).reduce((acc, name) => {
        set(acc, this.settings[name].path, this.settings[name].default);

        return acc;
      }, {});

      this.values = merge(defaultValues, currentValues);
    } else {
      this.noPermissions = true;
    }
  },

  data(): DataType {
    return {
      noPermissions: false,
      configMap:     null,
      values:        {},
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
          options:          this.settings[name].items?.map(({ value }) => ({ value, label: this.display(`${ name }.options.${ value }`, 'label') })),
          label:            this.display(name, 'label'),
          description:      this.display(name, 'description'),
          tooltipLabel:     this.settings[name].tooltip ? this.display(name, 'tooltip') : '',
          infoLabel:        this.settings[name].info ? this.display(name, 'info') : '',
          placeholderLabel: this.settings[name].placeholder ? this.display(name, 'placeholder') : '',
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
      return this.mode === _EDIT;
    },

    fetchState(): {pending: boolean} {
      return (this as any).$fetchState;
    },
  },

  methods: {
    get(item: SettingDisplay) {
      return get(this.values, item.path);
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
        }
      });

      if (!configMap.data) {
        configMap.data = {};
      }

      try {
        configMap.data[this.dataKey] = jsyaml.dump(this.values);

        await configMap.save();

        this.$emit('done', configMap);
        btnCB(true);
      } catch (err: any) {
        this.errors.push(err);
        this.$emit('errors', this.errors);
        btnCB(false);
      }
    },

    display(name: string, key: 'label' | 'description' | 'tooltip' | 'info' | 'placeholder') {
      return this.t(`${ this.labelKeyPrefix }.${ name }.${ key }`);
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
  <div v-else>
    <slot name="header">
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
    </slot>

    <slot name="errors">
      <template
        v-for="(err, j) in errors"
        :key="j"
      >
        <Banner
          color="error"
          :label="err"
        />
      </template>
    </slot>

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
        <template v-if="item.items?.length">
          <LabeledSelect
            :value="get(item)"
            :label="item.label"
            :placeholder="item.placeholderLabel"
            :mode="mode"
            :multiple="item.type === 'array'"
            :options="item.options"
            :option-key="'value'"
            :reduce="(opt: any)=>opt.value"
            @update:value="set(item, $event)"
          />
        </template>

        <template v-else-if="item.type === 'string'">
          <LabeledInput
            :value="get(item)"
            :mode="mode"
            :label="item.label"
            :placeholder="item.placeholderLabel"
            @update:value="set(item, $event)"
          />
        </template>

        <template v-else-if="item.type === 'number'">
          <LabeledInput
            :value="get(item)"
            :mode="mode"
            :label="item.label"
            :placeholder="item.placeholderLabel"
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
