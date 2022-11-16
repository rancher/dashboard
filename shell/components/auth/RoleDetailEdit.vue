<script>
import { MANAGEMENT, RBAC } from '@shell/config/types';
import CruResource from '@shell/components/CruResource';
import CreateEditView from '@shell/mixins/create-edit-view';
import { RadioGroup } from '@components/Form/Radio';
import Select from '@shell/components/form/Select';
import { LabeledInput } from '@components/Form/LabeledInput';
import ArrayList from '@shell/components/form/ArrayList';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import { ucFirst } from '@shell/utils/string';
import SortableTable from '@shell/components/SortableTable';
import { _DETAIL } from '@shell/config/query-params';
import { SCOPED_RESOURCES } from '@shell/config/roles';

import { SUBTYPE_MAPPING, VERBS } from '@shell/models/management.cattle.io.roletemplate';
import Loading from '@shell/components/Loading';

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
 * This component is used in these five forms:
 *
 * 1. Cluster Explorer > More Resources > RBAC > ClusterRoles
 *   - Should show list of cluster scoped resources and namespaced resources
 * 2. Cluster Explorer > More Resources > RBAC > Roles
 *   - Should show list of namespaced resources
 * 3. Users & Authentication > Roles > Global
 *   - Should show global, cluster and namespace scoped resources
 * 4. Users & Authentication > Roles > Cluster
 *   - Should show cluster and namespace scoped resources
 * 5. Users & Authentication > Roles > Projects & Namespaces
 *   - Should show only namespace scoped resources
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
    // We don't want to get all schemas from the cluster because there are
    // two problems with that:
    // - In the local cluster, that yields over 500-1,000 schemas, most of which aren't meant to
    //   be edited by humans.
    // - Populating the list directly from the schemas wouldn't include resources that may
    //   be in downstream clusters but not the local cluster. For example, if the logging
    //   application isn't installed in the local cluster, you wouldn't see logging resources
    //   such as Flows in the resource list, which you might want in order to
    //   create a role that is intended to be used by someone with access to a cluster where
    //   logging is installed.
    // Therefore we use a hardcoded list that is essentially intended
    // to be in-app documentation for convenience only, while allowing
    // users to freely type in resources that are not shown in the list.

    if (this.value.subtype === CLUSTER || this.value.subtype === NAMESPACE) {
      (await this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.ROLE_TEMPLATE })).forEach((template) => {
        // Ensure we have quick access to a specific template. This allows unselected drop downs to show the correct value
        this.keyedTemplateOptions[template.id] = {
          label: template.nameDisplay,
          value: template.id
        };
      });
      this.templateOptions = Object.values(this.keyedTemplateOptions);
    }
  },

  data() {
    return {
      defaultRule: {
        apiGroups:       [''],
        nonResourceURLs: [],
        resourceNames:   [],
        resources:       [],
        verbs:           []
      },
      verbOptions:          VERBS,
      templateOptions:      [],
      keyedTemplateOptions: {},
      resources:            this.value.resources,
      scopedResources:      SCOPED_RESOURCES,
      defaultValue:         false,
      selectFocused:        null,
    };
  },

  created() {
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

    // Set the default value for the mapped subtype
    this.defaultValue = !!this.value[SUBTYPE_MAPPING[this.value.subtype].defaultKey];

    switch (this.value.subtype) {
    case CLUSTER:
    case NAMESPACE:
      this.$set(this.value, 'roleTemplateNames', this.value.roleTemplateNames || []);
      this.$set(this.value, 'locked', !!this.value.locked);
      break;
    }

    // On save hook request
    if (this.registerBeforeHook) {
      this.registerBeforeHook(() => {
        // Map default value back to its own key for given subtype
        this.value[SUBTYPE_MAPPING[this.value.subtype].defaultKey] = !!this.defaultValue;
      });
    }

    this.$nextTick(() => {
      this.$emit('set-subtype', this.label);
    });
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
      const options = [];

      const scopes = Object.keys(this.scopedResources);

      scopes.forEach((scope) => {
        if (scope === 'globalScopedApiGroups' && this.value.type !== MANAGEMENT.GLOBAL_ROLE) {
          // If we are not in the global role creation form,
          // skip adding the global-scoped resources.
          return;
        }
        if (scope === 'clusterScopedApiGroups' && (this.value.type === RBAC.ROLE || this.value.subtype === NAMESPACE)) {
          // If we are in a project/namespace role creation form,
          // additionally skip adding the cluster-scoped resources.
          return;
        }
        const apiGroupsInScope = this.scopedResources[scope];

        const apiGroupNames = Object.keys(apiGroupsInScope);

        // Put each API group as a header and put its resources under it.
        apiGroupNames.forEach((apiGroup) => {
          // Add API group as the header for a group of related resources.
          let apiGroupLabel = apiGroup;
          let apiGroupValue = apiGroup;

          if (apiGroup === 'coreKubernetesApi') {
            // If a resource belongs to the core Kubernetes API,
            // the API group is technically an empty string but
            // we will label it "Core K8s API, Cluster Scoped."

            // Some core Kubernetes resources are namespaced,
            // in which case they go under a different heading
            // "Core K8s API, Namespaced." This lets us
            // separate them by scope.
            const labelForNoApiGroup = this.t('rbac.roletemplate.tabs.grantResources.noApiGroupClusterScope');
            const labelForNamespacedResourcesWithNoApiGroup = this.t('rbac.roletemplate.tabs.grantResources.noApiGroupNamespaceScope');

            apiGroupLabel = scope.includes('cluster') ? labelForNoApiGroup : labelForNamespacedResourcesWithNoApiGroup;
            apiGroupValue = '';
          }
          options.push({
            kind:      'group',
            optionKey: apiGroupLabel,
            label:     apiGroupLabel,
            value:     apiGroupValue,
            disabled:  true,
          });

          const resourcesInApiGroup = this.scopedResources[scope][apiGroup].resources;

          // Add non-deprecated resources to the resource options list
          resourcesInApiGroup.forEach((resourceName) => {
            options.push({
              label:     resourceName,
              // Use unique key for resource list in the Select dropdown
              optionKey: apiGroupValue.concat(resourceName),
              value:     {
                resourceName: resourceName.toLowerCase(),
                apiGroupValue
              }
            });
          });

          // If the API group has any deprecated options,
          // list them as "Resource Name (deprecated)"
          if (this.scopedResources[scope][apiGroup].deprecatedResources) {
            const deprecatedResourcesInApiGroup = this.scopedResources[scope][apiGroup].deprecatedResources;
            const deprecatedLabel = this.t('rbac.roletemplate.tabs.grantResources.deprecatedLabel');

            deprecatedResourcesInApiGroup.forEach((resourceName) => {
              options.push({
                label:     `${ resourceName } ${ deprecatedLabel }`,
                optionKey: apiGroupValue.concat(resourceName),
                value:     {
                  resourceName: resourceName.toLowerCase(),
                  apiGroupValue
                }
              });
            });
          }
        });
      });

      options.push({
        // This hidden option is to work around a bug in the Select
        // component where an option marked as disabled
        // is still selected by default if is value is an empty string.

        // In the Role or Project Role form, an API group will be the
        // default choice for the namespace value because there's only
        // one option with the value as an empty string and that's the default
        // value for the namespace. It's not good to have an API
        // group as the default value for a resource.
        // Adding this option means there are least two values with an
        // empty string in the options, preventing the Select from
        // selecting a disabled header group as the resource by default.

        // This bug is such an edge case that I can't imagine anyone
        // else hitting it, so I figured the workaround is better
        // than fixing the select.
        kind:      'group',
        optionKey: 'hiddenOption',
        label:     '_',
        value:     '',
        disabled:  true,
      });

      return options;
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
    isBuiltin() {
      return this.value.builtin;
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
      // The key is the aspect of a permissions rule
      // that is being set, for example, "verbs," "resources",
      // "apiGroups" or "nonResourceUrls."

      // The event/value contains name of a resource,
      // for example, "Apps."

      // The 'rule' contains the the contents of each row of the
      // role creation form under Grant Resources. Each
      // rule contains these fields:
      // - apiGroups
      // - nonResourceURLs
      // - resourceNames
      // - resources
      // - verbs
      const value = event.label ? event.label : event;

      switch (key) {
      case 'apiGroups':

        if (value || (value === '')) {
          this.$set(rule, 'apiGroups', [value]);
        }

        break;

      case 'verbs':

        if (value) {
          this.$set(rule, 'verbs', [value]);
        } else {
          this.$set(rule, 'verbs', []);
        }
        break;

      case 'resources':
        if (event.resourceName) {
          // If we are updating the resources defined in a rule,
          // the event will be an object with the
          // properties apiGroupValue and resourceName.
          this.$set(rule, 'resources', [event.resourceName]);
          // Automatically fill in the API group of the
          // selected resource.
          this.$set(rule, 'apiGroups', [event.apiGroupValue]);
        } else if (event.label) {
          // When the user creates a new resource name in the resource
          // field instead of selecting an existing one,
          // we have to treat that differently because the incoming event
          // is shaped like {"label":"something"} instead of
          // the same format as the other options:
          // { resourceName: "something", apiGroupValue: "" }
          this.$set(rule, 'resources', [event.label]);
        } else {
          this.$set(rule, 'resources', []);
          this.$set(rule, 'apiGroups', []);
        }
        break;

      case 'nonResourceURLs':
        if (value) {
          this.$set(rule, 'nonResourceURLs', [value]);
        } else {
          this.$set(rule, 'nonResourceURLs', []);
        }
        break;

      default:
        break;
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
      <div
        v-for="(inherited, index) of inheritedRules"
        :key="index"
      >
        <div class="spacer" />
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
      <div
        v-if="isRancherType"
        class="row"
      >
        <div class="col span-6">
          <RadioGroup
            v-model="defaultValue"
            name="storageSource"
            :label="defaultLabel"
            class="mb-10"
            :options="newUserDefaultOptions"
            :mode="mode"
          />
        </div>
        <div
          v-if="isRancherRoleTemplate"
          class="col span-6"
        >
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
      <div class="spacer" />
      <Tabbed :side-tabs="true">
        <Tab
          name="grant-resources"
          :label="t('rbac.roletemplate.tabs.grantResources.label')"
          :weight="1"
        >
          <ArrayList
            v-model="value.rules"
            label="Resources"
            :disabled="isBuiltin"
            :remove-allowed="!isBuiltin"
            :add-allowed="!isBuiltin"
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
                  <label class="text-label">
                    {{ t('rbac.roletemplate.tabs.grantResources.tableHeaders.resources') }}
                    <i
                      v-tooltip="t('rbac.roletemplate.tabs.grantResources.resourceOptionInfo')"
                      class="icon icon-info"
                    />
                    <span
                      v-if="isNamespaced"
                      class="required"
                    >*</span>
                  </label>
                </div>
                <div :class="ruleClass">
                  <label class="text-label">{{ t('rbac.roletemplate.tabs.grantResources.tableHeaders.apiGroups') }}
                    <span
                      v-if="isNamespaced"
                      class="required"
                    >*</span>
                  </label>
                </div>
                <div
                  v-if="!isNamespaced"
                  :class="ruleClass"
                >
                  <label class="text-label">{{ t('rbac.roletemplate.tabs.grantResources.tableHeaders.nonResourceUrls') }}</label>
                </div>
              </div>
            </template>
            <template #columns="props">
              <div class="columns row">
                <div :class="ruleClass">
                  <Select
                    :value="props.row.value.verbs"
                    class="lg"
                    :disabled="isBuiltin"
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
                    :disabled="isBuiltin"
                    :options="resourceOptions"
                    :searchable="true"
                    :taggable="true"
                    :mode="mode"
                    @input="setRule('resources', props.row.value, $event)"
                    @createdListItem="setRule('resources', props.row.value, $event)"
                  />
                </div>
                <div :class="ruleClass">
                  <LabeledInput
                    :value="getRule('apiGroups', props.row.value)"
                    :disabled="isBuiltin"
                    :mode="mode"
                    @input="setRule('apiGroups', props.row.value, $event)"
                  />
                </div>
                <div
                  v-if="!isNamespaced"
                  :class="ruleClass"
                >
                  <LabeledInput
                    :value="getRule('nonResourceURLs', props.row.value)"
                    :disabled="isBuiltin"
                    :mode="mode"
                    @input="setRule('nonResourceURLs', props.row.value, $event)"
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
            :disabled="isBuiltin"
            :remove-allowed="!isBuiltin"
            :add-allowed="!isBuiltin"
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
                    :disabled="isBuiltin"
                    :searchable="true"
                    :options="selectFocused === props.i ? templateOptions : [keyedTemplateOptions[props.row.value]]"
                    option-key="value"
                    option-label="label"
                    :mode="mode"
                    @on-focus="selectFocused = props.i"
                    @on-blur="selectFocused = null"
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
