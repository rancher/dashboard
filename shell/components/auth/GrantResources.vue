<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import ArrayList from '@shell/components/form/ArrayList';
import Select from '@shell/components/form/Select';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import { useI18n } from '@shell/composables/useI18n';
import { VERBS } from '@shell/models/management.cattle.io.roletemplate';
import type { GrantResourceOption, GrantResourceRule } from '@shell/utils/grant-resources';

const props = withDefaults(defineProps<{
  value: GrantResourceRule[];
  mode: string;
  resourceOptions: GrantResourceOption[];
  defaultRule: GrantResourceRule;
  disabled?: boolean;
  showNonResourceUrls?: boolean;
  resourceRequired?: boolean;
  initialEmptyRow?: boolean;
}>(), {
  disabled:            false,
  showNonResourceUrls: true,
  resourceRequired:    false,
  initialEmptyRow:     true,
});

const emit = defineEmits<{(e: 'update:value', value: GrantResourceRule[]): void}>();

const { t } = useI18n(useStore());

const ruleClass = computed(() => `col ${ props.showNonResourceUrls ? 'span-3' : 'span-4' }`);

function setRule(key: string, rule: GrantResourceRule, event: any) {
  switch (key) {
  case 'apiGroups':
    if (event || (event === '')) {
      rule.apiGroups = [event];
    }
    break;

  case 'resources':
    if (event?.resourceName) {
      // A listed resource: the event is { resourceName, apiGroupValue }, so fill in its API group too
      rule.resources = [event.resourceName];
      rule.apiGroups = [event.apiGroupValue];
    } else if (event?.label) {
      // A resource the user typed in: the event is { label }
      rule.resources = [event.label];
    } else {
      rule.resources = [];
      rule.apiGroups = [];
    }
    break;

  case 'nonResourceURLs':
    rule.nonResourceURLs = event ? [event] : [];
    break;

  default:
    break;
  }
}

function getRule(key: keyof GrantResourceRule, rule: GrantResourceRule) {
  return rule[key]?.[0] || undefined;
}

function updateSelectValue(rule: GrantResourceRule, key: 'verbs', event: any) {
  rule[key] = event.label ? event.value : event;
}
</script>

<template>
  <ArrayList
    :value="value"
    label="Resources"
    :disabled="disabled"
    :remove-allowed="!disabled"
    :add-allowed="!disabled"
    :default-add-value="defaultRule"
    :initial-empty-row="initialEmptyRow"
    :show-header="true"
    add-label="Add Resource"
    :mode="mode"
    @update:value="emit('update:value', $event)"
  >
    <template #column-headers>
      <div class="column-headers row">
        <div :class="ruleClass">
          <span class="text-label">{{ t('rbac.roletemplate.tabs.grantResources.tableHeaders.verbs') }}
            <span class="required">*</span>
          </span>
        </div>
        <div :class="ruleClass">
          <span class="text-label">
            {{ t('rbac.roletemplate.tabs.grantResources.tableHeaders.resources') }}
            <i
              v-clean-tooltip="t('rbac.roletemplate.tabs.grantResources.resourceOptionInfo')"
              class="icon icon-info"
            />
            <span
              v-if="resourceRequired"
              class="required"
            >*</span>
          </span>
        </div>
        <div :class="ruleClass">
          <span class="text-label">{{ t('rbac.roletemplate.tabs.grantResources.tableHeaders.apiGroups') }}</span>
        </div>
        <div
          v-if="showNonResourceUrls"
          :class="ruleClass"
        >
          <span class="text-label">{{ t('rbac.roletemplate.tabs.grantResources.tableHeaders.nonResourceUrls') }}</span>
        </div>
      </div>
    </template>
    <template #columns="scope">
      <div class="columns row">
        <div :class="ruleClass">
          <!-- Select verbs -->
          <Select
            :value="scope.row.value.verbs"
            class="lg"
            :disabled="disabled"
            :taggable="true"
            :searchable="true"
            :options="VERBS"
            :multiple="true"
            :mode="mode"
            :compact="true"
            :data-testid="`grant-resources-verbs${scope.i}`"
            @update:value="updateSelectValue(scope.row.value, 'verbs', $event)"
          />
        </div>
        <div :class="ruleClass">
          <Select
            :value="getRule('resources', scope.row.value)"
            :disabled="disabled"
            :options="resourceOptions"
            option-key="optionKey"
            :searchable="true"
            :taggable="true"
            :mode="mode"
            :compact="true"
            :data-testid="`grant-resources-resources${scope.i}`"
            @update:value="setRule('resources', scope.row.value, $event)"
            @createdListItem="setRule('resources', scope.row.value, $event)"
          />
        </div>
        <div :class="ruleClass">
          <LabeledInput
            :value="getRule('apiGroups', scope.row.value)"
            :disabled="disabled"
            :mode="mode"
            :data-testid="`grant-resources-api-groups${scope.i}`"
            @input="setRule('apiGroups', scope.row.value, $event.target.value)"
          />
        </div>
        <div
          v-if="showNonResourceUrls"
          :class="ruleClass"
        >
          <LabeledInput
            :value="getRule('nonResourceURLs', scope.row.value)"
            :disabled="disabled"
            :mode="mode"
            :data-testid="`grant-resources-non-resource-urls${scope.i}`"
            @input="setRule('nonResourceURLs', scope.row.value, $event.target.value)"
          />
        </div>
      </div>
    </template>
    <template #value-sub-row="slotProps">
      <slot
        name="value-sub-row"
        v-bind="slotProps"
      />
    </template>
  </ArrayList>
</template>

<style lang="scss" scoped>
  .required {
    color: var(--error);
  }

  .column-headers {
    margin-bottom: 5px;
  }

  .columns {
    .col > .unlabeled-select:not(.taggable) {
      // override the odd padding-top from shell/assets/styles/global/_select.scss
      padding: $unlabaled-select-padding
    }
  }
</style>
