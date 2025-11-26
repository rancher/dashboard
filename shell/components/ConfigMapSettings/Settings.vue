<script lang="ts">
import { PropType } from 'vue';
import { set, get } from '@shell/utils/object';
import { _EDIT } from '@shell/config/query-params';
import { LabeledInput } from '@rc/Form/LabeledInput';
import { Checkbox } from '@rc/Form/Checkbox';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import { TextAreaAutoGrow } from '@rc/Form/TextArea';
import Taints from '@shell/components/form/Taints.vue';
import UnitInput from '@shell/components/form/UnitInput.vue';
import { Banner } from '@rc/Banner';
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

interface DataType {
  isGroupExpanded: Record<string, boolean>;
}

export default {

  name: 'Settings',

  emits: ['update:value'],

  components: {
    LabeledInput,
    LabeledSelect,
    KeyValue,
    Checkbox,
    Banner,
    Taints,
    TextAreaAutoGrow,
    UnitInput,
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

  data(): DataType {
    return { isGroupExpanded: this.groups.reduce((acc, { name, expanded }) => ({ ...acc, [name]: !!expanded }), {}) };
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
            class:            this.settings[name].class || 'span-4'
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

    display(name: string, key: 'label' | 'description' | 'tooltip' | 'info' | 'placeholder' | 'add') {
      return this.t(`${ this.labelKeyPrefix }.${ name }.${ key }`, {}, true);
    },

    toggleGroup(item: SettingDisplay) {
      if (item.children) {
        this.isGroupExpanded[item.name] = !this.isGroupExpanded[item.name];
      }
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
      :class="{ box: item.children }"
      :data-testid="`cm-settings-row-${ item.name }`"
    >
      <div class="header">
        <div
          class="title"
          :class="{ clickable: item.children }"
          :tabindex="item.children ? 0 : undefined"
          :role="item.children ? 'button' : undefined"
          @click="toggleGroup(item)"
          @keydown.space.enter.stop.prevent="toggleGroup(item)"
        >
          <i
            v-if="item.children"
            :class="{
              ['icon icon-chevron-right']: !isGroupExpanded[item.name],
              ['icon icon-chevron-down']: isGroupExpanded[item.name],
            }"
          />
          <component
            :is="item.children ? 'h2' : 'h3'"
            v-if="item.label"
            class="label"
          >
            {{ item.label }}
            <i
              v-if="item.tooltip"
              v-clean-tooltip="item.tooltipLabel"
              class="icon icon-info"
            />
          </component>
        </div>

        <div
          v-if="item.description && item.type !== 'boolean'"
          class="description mt-10"
        >
          <label
            class="text-label"
            :aria-describedby="item.description"
          >
            {{ item.description }}
          </label>
        </div>

        <Banner
          v-if="item.info"
          color="warning"
          :label="item.infoLabel"
        />
      </div>

      <div
        v-if="!item.children || isGroupExpanded[item.name]"
        class="body mt-10"
      >
        <div
          v-if="item.children"
          class="group mt-10"
          :data-testid="`cm-settings-group-body-${ item.name }`"
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
          class="row simple"
        >
          <div
            class="col"
            :class="item.class"
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
                v-if="item.handler === 'Textarea'"
                :data-testid="`cm-settings-field-${ item.type }-${ item.handler }-${ item.name }`"
                :aria-label="t(`${ labelKeyPrefix }.fields.ariaLabel`, { name: item.label })"
                :value="get(item) || ''"
                :min-height="10"
                :mode="mode"
                @update:value="set(item, $event)"
              />
              <KeyValue
                v-else-if="item.handler === 'KeyValue'"
                :data-testid="`cm-settings-field-${ item.type }-${ item.handler }-${ item.name }`"
                :aria-label="t(`${ labelKeyPrefix }.fields.ariaLabel`, { name: item.label })"
                :value="get(item)"
                :mode="mode"
                :read-allowed="false"
                :add-icon="'icon-plus'"
                :add-label="display(item.name, 'add')"
                :add-class="'btn-sm'"
                @update:value="set(item, $event)"
              />
              <Taints
                v-else-if="item.handler === 'Taints'"
                :data-testid="`cm-settings-field-${ item.type }-${ item.handler }-${ item.name }`"
                :aria-label="t(`${ labelKeyPrefix }.fields.ariaLabel`, { name: item.label })"
                :value="get(item)"
                :mode="mode"
                :title="' '"
                :add-icon="'icon-plus'"
                :add-class="'btn-sm'"
                @update:value="set(item, $event)"
              />
            </template>

            <template v-else-if="item.type === 'string'">
              <LabeledInput
                :data-testid="`cm-settings-field-${ item.type }-${ item.name }`"
                :aria-label="t(`${ labelKeyPrefix }.fields.ariaLabel`, { name: item.label })"
                :value="get(item)"
                :mode="mode"
                :label="item.label"
                :placeholder="item.placeholderLabel"
                @update:value="set(item, $event)"
              />
            </template>

            <template v-else-if="item.type === 'number'">
              <UnitInput
                v-if="item.handler === 'UnitInput'"
                :data-testid="`cm-settings-field-${ item.type }-${ item.handler }-${ item.name }`"
                :aria-label="t(`${ labelKeyPrefix }.fields.ariaLabel`, { name: item.label })"
                :value="get(item)"
                :mode="mode"
                :suffix="t('suffix.sec')"
                :label="item.label"
                :placeholder="item.placeholderLabel"
                min="0"
                @update:value="set(item, $event)"
              />
              <LabeledInput
                v-else
                :data-testid="`cm-settings-field-${ item.type }-${ item.name }`"
                :aria-label="t(`${ labelKeyPrefix }.fields.ariaLabel`, { name: item.label })"
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
                :aria-label="t(`${ labelKeyPrefix }.fields.ariaLabel`, { name: item.label })"
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
  </div>
</template>

<style scoped lang='scss'>
  .settings-container {
    display: flex;
    flex-direction: column;
    gap: 24px;

    .setting-row {
      display: flex;
      flex-direction: column;

      .header {
        .title {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 10px;
          width: fit-content;

          &:focus-visible {
            @include focus-outline;
          }

          .label {
            margin: 0 !important;
          }
        }
      }
    }
  }

  .box {
    border-radius: var(--border-radius);
    border: 1px solid var(--border);
    padding: 15px;
  }

  .clickable {
    cursor: pointer;
  }
</style>
