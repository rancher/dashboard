<script>
import { MANAGEMENT } from '@/config/types';
import CruResource from '@/components/CruResource';
import CreateEditView from '@/mixins/create-edit-view';
import RadioGroup from '@/components/form/RadioGroup';
import Select from '@/components/form/Select';
import LabeledInput from '@/components/form/LabeledInput';
import ArrayList from '@/components/form/ArrayList';
import NameNsDescription from '@/components/form/NameNsDescription';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';
import { ucFirst } from '@/utils/string';
import SortableTable from '@/components/SortableTable';
import { _DETAIL } from '@/config/query-params';
import { SUBTYPE_MAPPING, VERBS } from '@/models/management.cattle.io.roletemplate';

const GLOBAL = SUBTYPE_MAPPING.GLOBAL.key;

/**
 * Handles the View, Create and Edit of
 * - management.cattle.io.globalrole
 * - management.cattle.io.roletemplate
 *
 * management.cattle.io.roletemplate are further split into two types
 * - Cluster
 * - Project/Namespace
 *
 * The Global role, plus two roletemplates's Cluster and Project/Namespace make the three subtypes references throughout
 */
export default {
  components: {
    ArrayList,
    CruResource,
    LabeledInput,
    RadioGroup,
    Select,
    NameNsDescription,
    Tab,
    Tabbed,
    SortableTable
  },

  mixins: [CreateEditView],

  async fetch() {
    if (this.value.subtype !== GLOBAL) {
      this.templateOptions = (await this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.ROLE_TEMPLATE }))
        .map(option => ({
          label: option.nameDisplay,
          value: option.id
        }));
    }
  },

  data() {
    this.$set(this.value, 'rules', this.value.rules || []);
    this.$set(this.value, 'roleTemplateIds', this.value.roleTemplateIds || []);
    this.$set(this.value, 'newUserDefault', !!this.value.newUserDefault);
    this.$set(this.value, 'locked', !!this.value.locked);

    this.value.rules.forEach((rule) => {
      if (rule.verbs[0] === '*') {
        this.$set(rule, 'verbs', [...VERBS]);
      }
    });

    const query = { ...this.$route.query };
    const { roleContext } = query;

    if (roleContext) {
      this.value.updateSubtype(roleContext);
    }

    this.$nextTick(() => {
      this.$emit('set-subtype', this.label);
    });

    return {
      defaultRule: {
        apiGroups:       [],
        nonResourceURLs: [],
        resourceNames:   [],
        resources:       [],
        verbs:           []
      },
      verbOptions:     VERBS,
      templateOptions: []
    };
  },

  computed: {
    label() {
      return this.t(`rbac.roletemplate.subtypes.${ this.value.subtype }.label`);
    },
    defaultLabel() {
      return this.t(`rbac.roletemplate.subtypes.${ this.value.subtype }.defaultLabel`);
    },
    lockedOptions() {
      return [
        {
          value: true,
          label: this.t('rbac.roletemplate.locked.yes')
        },
        {
          value: false,
          label: this.t('rbac.roletemplate.locked.no')
        }
      ];
    },
    resourceOptions() {
      return this.value.resources.map(resource => ({
        value: resource.toLowerCase(),
        label: resource
      }));
    },
    newUserDefaultOptions() {
      return [
        {
          value: true,
          label: this.t(`rbac.roletemplate.subtypes.${ this.value.subtype }.yes`)
        },
        {
          value: false,
          label: this.t('rbac.roletemplate.newUserDefault.no')
        }
      ];
    },
    isRancherSubtype() {
      return this.value.subtype !== GLOBAL;
    },
    isDetail() {
      return this.as === _DETAIL;
    },
    doneLocationOverride() {
      return {
        name:   'c-cluster-auth-roles',
        hash:   `#${ this.value.subtype }`
      };
    },
    // Detail View
    rules() {
      return this.value.rules.map((rule, i) => {
        const tableRule = {
          index:           i,
          apiGroups:       rule.apiGroups || [],
          resources:       rule.resources || [],
          nonResourceURLs: rule.nonResourceURLs || []
        };

        VERBS.forEach((verb) => {
          const key = this.verbKey(verb);

          tableRule[key] = rule.verbs[0] === '*' || rule.verbs.includes(verb);
          tableRule.hasCustomVerbs = rule.verbs.some(verb => !VERBS.includes(verb));
        });

        return tableRule;
      });
    },
    ruleHeaders() {
      const verbHeaders = VERBS.map(verb => ({
        name:      verb,
        key:       ucFirst(verb),
        value:     this.verbKey(verb),
        formatter: 'Checked',
        align:     'center'
      }));

      return [
        ...verbHeaders,
        {
          name:      'custom',
          labelKey:  'tableHeaders.customVerbs',
          key:       ucFirst('custom'),
          value:     'hasCustomVerbs',
          formatter: 'Checked',
          align:     'center'
        },
        {
          name:      'resources',
          labelKey:  'tableHeaders.resources',
          value:     'resources',
          formatter: 'list',
        },
        {
          name:      'url',
          labelKey:  'tableHeaders.url',
          value:     'nonResourceURLs',
          formatter: 'list',
        },
        {
          name:      'apiGroups',
          labelKey:  'tableHeaders.apiGroup',
          value:     'apiGroups',
          formatter: 'list',
        }
      ];
    }
  },

  methods: {

    getVerb(verb, rule) {
      const verbs = rule.verbs || [];

      return verbs.includes(verb);
    },

    setVerb(verb, value, rule) {
      this.$set(rule.verbs, rule.verbs || []);

      if (value) {
        const index = rule.verbs.indexOf(verb);

        if (index === -1) {
          rule.verbs.push(verb);
        }
      } else {
        const index = rule.verbs.indexOf(verb);

        if (index !== -1) {
          rule.verbs.splice(index, 1);
        }
      }
    },
    setRule(key, rule, event) {
      const value = event.label ? event.label : event;

      this.$set(rule, key, [value]);
    },
    getRule(key, rule) {
      return rule[key]?.[0] || null;
    },
    updateSelectValue(row, key, event) {
      const value = event.label ? event.value : event;

      this.$set(row, key, value);
    },
    cancel() {
      this.$router.replace(this.doneLocationOverride);
    },
    // Detail View
    verbKey(verb) {
      return `has${ ucFirst(verb) }`;
    }
  }
};
</script>

<template>
  <CruResource
    class="receiver"
    :can-yaml="!isCreate"
    :mode="mode"
    :resource="value"
    :errors="errors"
    :cancel-event="true"
    @error="e=>errors = e"
    @finish="save"
    @cancel="cancel"
  >
    <template v-if="isDetail">
      <SortableTable
        key-field="index"
        :rows="rules"
        :headers="ruleHeaders"
        :table-actions="false"
        :row-actions="false"
        :search="false"
      />
    </template>
    <template v-else>
      <NameNsDescription
        v-model="value"
        :namespaced="false"
        :mode="mode"
        label="Name"
      />
      <div class="row">
        <div class="col span-6">
          <RadioGroup
            :value="value.default"
            name="storageSource"
            :label="defaultLabel"
            class="mb-10"
            :options="newUserDefaultOptions"
            :mode="mode"
            @input="value.updateDefault"
          />
        </div>
        <div v-if="isRancherSubtype" class="col span-6">
          <RadioGroup
            v-model="value.locked"
            name="storageSource"
            :label="t('rbac.roletemplate.locked.label')"
            class="mb-10"
            :options="lockedOptions"
            :mode="mode"
          />
        </div>
      </div>
      <div class="spacer"></div>
      <Tabbed :side-tabs="true">
        <Tab
          name="grant-resources"
          :label="t('rbac.roletemplate.tabs.grantResources.label')"
          :weight="1"
        >
          <ArrayList
            v-model="value.rules"
            label="Resources"
            :default-add-value="defaultRule"
            :initial-empty-row="true"
            :show-header="true"
            add-label="Add Resource"
            :mode="mode"
          >
            <template #column-headers>
              <div class="column-headers row">
                <div class="col span-3">
                  <label class="text-label">
                    {{ t('rbac.roletemplate.tabs.grantResources.tableHeaders.verbs') }}
                    <span class="required">*</span>
                  </label>
                </div>
                <div class="col span-3">
                  <label class="text-label">{{ t('rbac.roletemplate.tabs.grantResources.tableHeaders.resources') }}</label>
                </div>
                <div class="col span-3">
                  <label class="text-label">{{ t('rbac.roletemplate.tabs.grantResources.tableHeaders.nonResourceUrls') }}</label>
                </div>
                <div class="col span-3">
                  <label class="text-label">{{ t('rbac.roletemplate.tabs.grantResources.tableHeaders.apiGroups') }}</label>
                </div>
              </div>
            </template>
            <template #columns="props">
              <div class="columns row">
                <div class="col span-3">
                  <Select
                    :value="props.row.value.verbs"
                    class="lg"
                    :taggable="true"
                    :searchable="true"
                    :options="verbOptions"
                    :multiple="true"
                    :mode="mode"
                    @input="updateSelectValue(props.row.value, 'verbs', $event)"
                  />
                </div>
                <div class="col span-3">
                  <Select
                    :value="getRule('resources', props.row.value)"
                    :options="resourceOptions"
                    :searchable="true"
                    :taggable="true"
                    :mode="mode"
                    @input="setRule('resources', props.row.value, $event)"
                  />
                </div>
                <div class="col span-3">
                  <LabeledInput
                    :value="getRule('nonResourceURLs', props.row.value)"
                    :mode="mode"
                    @input="setRule('nonResourceURLs', props.row.value, $event)"
                  />
                </div>
                <div class="col span-3">
                  <LabeledInput
                    :value="getRule('apiGroups', props.row.value)"
                    :mode="mode"
                    @input="setRule('apiGroups', props.row.value, $event)"
                  />
                </div>
              </div>
            </template>
          </ArrayList>
        </Tab>
        <Tab
          v-if="isRancherSubtype"
          name="inherit-from"
          label="Inherit From"
          :weight="0"
        >
          <ArrayList
            v-model="value.roleTemplateIds"
            label="Resources"
            add-label="Add Resource"
            :mode="mode"
          >
            <template #columns="props">
              <div class="columns row">
                <div class="col span-12">
                  <Select
                    v-model="props.row.value"
                    class="lg"
                    :taggable="false"
                    :searchable="true"
                    :options="templateOptions"
                    option-key="value"
                    option-label="label"
                    :mode="mode"
                  />
                </div>
              </div>
            </template>
          </ArrayList>
        </Tab>
      </Tabbed>
    </template>
  </CruResource>
</template>

<style lang="scss" scoped>
  .required {
    color: var(--error);
  }

  ::v-deep {
    .column-headers {
      margin-right: 75px;
    }

    .box {
      align-items: initial;

      .remove {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-end;
      }
    }

    .columns {
      & > .col {
        &:not(:first-of-type) {
          height: $input-height;
        }

        &:first-of-type {
          min-height: $input-height;
        }

        & > * {
          height: 100%;
        }
      }
    }
  }
</style>
