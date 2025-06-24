<script lang="ts">
import { PropType } from 'vue';
import { set, get } from '@shell/utils/object';
import { _EDIT } from '@shell/config/query-params';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { TextAreaAutoGrow } from '@components/Form/TextArea';
import { Banner } from '@components/Banner';
import { Group, Setting } from '@shell/components/ConfigMapSettings/index.vue';

interface Option {
  label: string,
  value: string,
}

type SettingDisplay = Partial<Setting> & {
  children?: Record<string, Setting>,
  name: string,
  options?: Option[]
  label: string,
  description: string,
  tooltipLabel?: string,
  infoLabel?: string,
  placeholderLabel?: string,
}

export default {

  name: 'Settings',

  emits: ['update:value'],

  components: {
    LabeledInput,
    LabeledSelect,
    Checkbox,
    Banner,
    TextAreaAutoGrow,
  },

  props: {
    settings: {
      type:     Object as PropType<Record<string, Setting>>,
      required: true
    },

    groups: {
      type:    Array as PropType<Group[]>,
      default: () => [],
    },

    values: {
      type:     Object,
      required: true,
    },

    labelKeyPrefix: {
      type:    String,
      default: 'settings'
    },

    mode: {
      type:    String,
      default: _EDIT
    },
  },

  computed: {
    settingsDisplay(): SettingDisplay[] {
      // Init settingsDisplay with flat settings
      const out = Object.keys(this.settings)
        .filter((name) => !this.groups.find((g) => g.children.includes(name)))
        .reduce((acc, name) => [
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
          }
        ], [] as SettingDisplay[]);

      // Add grouped settings
      this.groups.forEach((group) => {
        out.push({
          ...group,
          label:       this.display(group.name, 'label'),
          description: this.display(group.name, 'description'),
          children:    group.children.reduce((acc, name) => ({
            ...acc,
            [name]: this.settings[name]
          }), {})
        });
      });

      return out.sort((a, b) => (a.weight || 0) - (b.weight || 0) || (a.label || '').localeCompare(b.label || ''));
    },
  },

  methods: {
    get(item: SettingDisplay) {
      return get(this.values, item.path);
    },

    set(item: SettingDisplay, value: any) {
      set(this.values, item.path, value);

      this.update();
    },

    update() {
      this.$emit('update:value', this.values);
    },

    display(name: string, key: 'label' | 'description' | 'tooltip' | 'info' | 'placeholder') {
      return this.t(`${ this.labelKeyPrefix }.${ name }.${ key }`, {}, true);
    }
  }
};
</script>

<template>
  <div class="settings-container">
    <div
      v-for="item in settingsDisplay"
      :key="item.name"
      class="setting-row"
      data-testid="cm-settings-row"
    >
      <div class="header mb-10">
        <h2
          v-if="item.label"
          class="label"
          :style="!item.children ? { fontSize: '18px' } : { marginBottom: '10px' }"
        >
          {{ item.label }}
          <i
            v-if="item.tooltip"
            v-clean-tooltip="item.tooltipLabel"
            class="icon icon-info"
          />
        </h2>
        <p
          v-if="item.description && item.type !== 'boolean'"
          class="description text-muted mt-10"
        >
          {{ item.description }}
        </p>

        <Banner
          v-if="item.info"
          color="warning"
          :label="item.infoLabel"
        />
      </div>

      <div class="body">
        <div
          v-if="item.children"
          class="group box"
          :data-testid="`cm-settings-group-${ item.name }`"
        >
          <Settings
            :settings="item.children"
            :values="values"
            :mode="mode"
            :label-key-prefix="labelKeyPrefix"
            @update:value="update"
          />
        </div>

        <div
          v-else
          class="simple"
        >
          <template v-if="item.items?.length">
            <LabeledSelect
              :data-testid="`cm-settings-field-${ item.type === 'array' ? 'array' : item.type }-${ item.name }`"
              :value="get(item)"
              :label="item.label"
              :placeholder="item.placeholderLabel"
              :mode="mode"
              :multiple="item.type === 'array'"
              :options="item.options"
              :option-key="'value'"
              :reduce="(opt: Option)=>opt.value"
              @update:value="set(item, $event)"
            />
          </template>

          <template v-else-if="item.type === 'object'">
            <TextAreaAutoGrow
              :data-testid="`cm-settings-field-${ item.type }-${ item.name }`"
              :value="get(item) || ''"
              :min-height="10"
              :mode="mode"
              @update:value="set(item, $event)"
            />
          </template>

          <template v-else-if="item.type === 'string'">
            <LabeledInput
              :data-testid="`cm-settings-field-${ item.type }-${ item.name }`"
              :value="get(item)"
              :mode="mode"
              :label="item.label"
              :placeholder="item.placeholderLabel"
              @update:value="set(item, $event)"
            />
          </template>

          <template v-else-if="item.type === 'number'">
            <LabeledInput
              :data-testid="`cm-settings-field-${ item.type }-${ item.name }`"
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
              :data-testid="`cm-settings-field-${ item.type }-${ item.name }`"
              :value="get(item)"
              :mode="mode"
              :label="item.description"
              @update:value="set(item, $event)"
            />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang='scss'>
  .settings-container {
    display: flex;
    flex-direction: column;
    gap: 30px;

    .setting-row {
      display: flex;
      flex-direction: column;

      .header {
        .label {
          margin: 0;
        }
      }
    }
  }

  .box {
    border-radius: var(--border-radius);
    border: 1px solid var(--border);
    padding: 15px;
  }
</style>
