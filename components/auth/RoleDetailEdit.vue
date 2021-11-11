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
import Loading from '@/components/Loading';
import capitalize from 'lodash/capitalize';

const GLOBAL = SUBTYPE_MAPPING.GLOBAL.key;
const CLUSTER = SUBTYPE_MAPPING.CLUSTER.key;
const NAMESPACE = SUBTYPE_MAPPING.NAMESPACE.key;
const RBAC_ROLE = SUBTYPE_MAPPING.RBAC_ROLE.key;

/**
 * Handles the View, Create and Edit of
 * - management.cattle.io.globalrole
 * - management.cattle.io.roletemplate
 * - rbac.authorization.k8s.io.role
 * - rbac.authorization.k8s.io.clusterrole
 *
 * management.cattle.io.roletemplate is further split into two types
 * - Cluster
 * - Project/Namespace
 *
 * The above means there are 4 types ==> 5 subtypes handled by this component
 *
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
    SortableTable,
    Loading,
  },

  mixins: [CreateEditView],

  async fetch() {
    if (this.value.subtype === CLUSTER || this.value.subtype === NAMESPACE) {
      this.templateOptions = (await this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.ROLE_TEMPLATE }))
        .map(option => ({
          label: option.nameDisplay,
          value: option.id
        }));
    }
  },

  data() {
    this.$set(this.value, 'rules', this.value.rules || []);

    this.value.rules.forEach((rule) => {
      if (rule.verbs[0] === '*') {
        this.$set(rule, 'verbs', [...VERBS]);
      }
    });

    const query = { ...this.$route.query };
    const { roleContext } = query;

    if (roleContext && this.value.updateSubtype) {
      this.value.updateSubtype(roleContext);
    }

    switch (this.value.subtype) {
    case GLOBAL:
      this.$set(this.value, 'newUserDefault', !!this.value.newUserDefault);
      break;
    case CLUSTER:
    case NAMESPACE:
      this.$set(this.value, 'roleTemplateNames', this.value.roleTemplateNames || []);
      this.$set(this.value, 'locked', !!this.value.locked);
      break;
    }

    this.$nextTick(() => {
      this.$emit('set-subtype', this.label);
    });

    return {
      defaultRule: {
        apiGroups:       [''],
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
        label: capitalize(resource)
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
    isRancherRoleTemplate() {
      return this.value.subtype === CLUSTER || this.value.subtype === NAMESPACE;
    },
    isNamespaced() {
      return this.value.subtype === RBAC_ROLE;
    },
    isRancherType() {
      return this.value.subtype === GLOBAL || this.value.subtype === CLUSTER || this.value.subtype === NAMESPACE;
    },
    isDetail() {
      return this.as === _DETAIL;
    },
    doneLocationOverride() {
      return this.value.listLocation;
    },
    ruleClass() {
      return `col ${ this.isNamespaced ? 'span-4' : 'span-3' }`;
    },
    // Detail View
    rules() {
      return this.createRules(this.value);
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
    },
    inheritedRules() {
      return this.createInheritedRules(this.value, [], false);
    }
  },

  methods: {
    setRule(key, rule, event) {
      const value = event.label ? event.label : event;

      if (value || (key === 'apiGroups' && value === '')) {
        this.$set(rule, key, [value]);
      } else {
        this.$set(rule, key, []);
      }
    },
    getRule(key, rule) {
      return rule[key]?.[0] || null;
    },
    updateSelectValue(row, key, event) {
      const value = event.label ? event.value : event;

      this.$set(row, key, value);
    },
    cancel() {
      this.done();
    },
    async actuallySave(url) {
      if ( this.isCreate ) {
        url = url || this.schema.linkFor('collection');
        await this.value.save({ url, redirectUnauthorized: false });
      } else {
        await this.value.save({ redirectUnauthorized: false });
      }
    },
    // Detail View
    verbKey(verb) {
      return `has${ ucFirst(verb) }`;
    },
    createRules(role) {
      return (role.rules || []).map((rule, i) => {
        const tableRule = {
          index:           i,
          apiGroups:       rule.apiGroups || [''],
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
    createInheritedRules(parent, res = [], showParent = true) {
      if (!parent.roleTemplateNames) {
        return [];
      }

      parent.roleTemplateNames
        .map(rtn => this.$store.getters[`management/byId`](MANAGEMENT.ROLE_TEMPLATE, rtn))
        .forEach((rt) => {
          // Add Self
          res.push({
            showParent,
            parent,
            template: rt,
            rules:    this.createRules(rt)
          });
          // Add inherited
          this.createInheritedRules(rt, res);
        });

      return res;
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
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
      <div v-for="(inherited, index) of inheritedRules" :key="index">
        <div class="spacer"></div>
        <h3>
          Inherited from {{ inherited.template.nameDisplay }}
          <template v-if="inherited.showParent">
            {{ inherited.parent ? '(' + inherited.parent.nameDisplay + ')' : '' }}
          </template>
        </h3>
        <SortableTable
          key-field="index"
          :rows="inherited.rules"
          :headers="ruleHeaders"
          :table-actions="false"
          :row-actions="false"
          :search="false"
        />
      </div>
    </template>
    <template v-else>
      <NameNsDescription
        v-model="value"
        :namespaced="isNamespaced"
        :mode="mode"
        name-key="displayName"
        description-key="description"
        label="Name"
      />
      <div v-if="isRancherType" class="row">
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
        <div v-if="isRancherRoleTemplate" class="col span-6">
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
                <div :class="ruleClass">
                  <label class="text-label">{{ t('rbac.roletemplate.tabs.grantResources.tableHeaders.verbs') }}
                    <span class="required">*</span>
                  </label>
                </div>
                <div :class="ruleClass">
                  <label class="text-label">{{ t('rbac.roletemplate.tabs.grantResources.tableHeaders.resources') }}
                    <span v-if="isNamespaced" class="required">*</span>
                  </label>
                </div>
                <div v-if="!isNamespaced" :class="ruleClass">
                  <label class="text-label">{{ t('rbac.roletemplate.tabs.grantResources.tableHeaders.nonResourceUrls') }}</label>
                </div>
                <div :class="ruleClass">
                  <label class="text-label">{{ t('rbac.roletemplate.tabs.grantResources.tableHeaders.apiGroups') }}
                    <span v-if="isNamespaced" class="required">*</span>
                  </label>
                </div>
              </div>
            </template>
            <template #columns="props">
              <div class="columns row">
                <div :class="ruleClass">
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
                <div :class="ruleClass">
                  <Select
                    :value="getRule('resources', props.row.value)"
                    :options="resourceOptions"
                    :searchable="true"
                    :taggable="true"
                    :mode="mode"
                    @input="setRule('resources', props.row.value, $event)"
                  />
                </div>
                <div v-if="!isNamespaced" :class="ruleClass">
                  <LabeledInput
                    :value="getRule('nonResourceURLs', props.row.value)"
                    :mode="mode"
                    @input="setRule('nonResourceURLs', props.row.value, $event)"
                  />
                </div>
                <div :class="ruleClass">
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
          v-if="isRancherRoleTemplate"
          name="inherit-from"
          label="Inherit From"
          :weight="0"
        >
          <ArrayList
            v-model="value.roleTemplateNames"
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
