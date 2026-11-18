<script>
import { MANAGEMENT, RBAC } from '@shell/config/types';
import CruResource from '@shell/components/CruResource';
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import Error from '@shell/components/form/Error';
import { RadioGroup } from '@components/Form/Radio';
import Select from '@shell/components/form/Select';
import ArrayList from '@shell/components/form/ArrayList';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import { ucFirst } from '@shell/utils/string';
import SortableTable from '@shell/components/SortableTable';
import { _CLONE, _DETAIL } from '@shell/config/query-params';
import { SCOPED_RESOURCES, SCOPED_RESOURCE_GROUPS } from '@shell/config/roles';
import GrantResources from '@shell/components/auth/GrantResources.vue';
import { grantResourceOptions, normaliseRuleApiGroups } from '@shell/utils/grant-resources';

import { SUBTYPE_MAPPING, VERBS } from '@shell/models/management.cattle.io.roletemplate';
import Loading from '@shell/components/Loading';
import Banner from '@components/Banner/Banner.vue';

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
  emits: ['set-subtype', 'input'],

  components: {
    ArrayList,
    CruResource,
    RadioGroup,
    Select,
    NameNsDescription,
    Tab,
    Tabbed,
    SortableTable,
    Loading,
    Error,
    Banner,
    GrantResources,
  },

  mixins: [CreateEditView, FormValidation],

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
    if (this.realMode === _CLONE) {
      this.value.displayName = '';
      this.value.builtin = false;
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
      templateOptions:      [],
      keyedTemplateOptions: {},
      resources:            this.value.resources,
      defaultValue:         false,
      selectFocused:        null,
      fvFormRuleSets:       [
        { path: 'displayName', rules: ['required'] }
      ],
    };
  },

  created() {
    this.value['rules'] = this.value.rules || [];
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
      this.value['roleTemplateNames'] = this.value.roleTemplateNames || [];
      this.value['locked'] = !!this.value.locked;
      break;
    }

    // On save hook request
    if (this.registerBeforeHook) {
      this.registerBeforeHook(() => {
        // Map default value back to its own key for given subtype
        this.value[SUBTYPE_MAPPING[this.value.subtype].defaultKey] = !!this.defaultValue;
      });
    }

    if (this.value?.metadata?.name && !this.value.displayName) {
      this.value['displayName'] = this.value.metadata.name;
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
      const scopes = Object.keys(SCOPED_RESOURCES).filter((scope) => {
        if (scope === SCOPED_RESOURCE_GROUPS.GLOBAL && this.value.type !== MANAGEMENT.GLOBAL_ROLE) {
          // If we are not in the global role creation form,
          // skip adding the global-scoped resources.
          return false;
        }
        if (scope === SCOPED_RESOURCE_GROUPS.CLUSTER && (this.value.type === RBAC.ROLE || this.value.subtype === NAMESPACE)) {
          // If we are in a project/namespace role creation form,
          // additionally skip adding the cluster-scoped resources.
          return false;
        }

        return true;
      });

      return grantResourceOptions((key) => this.t(key), scopes);
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
    // Detail View
    rules() {
      return this.createRules(this.value);
    },
    ruleHeaders() {
      const verbHeaders = VERBS.map((verb) => ({
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
    cancel() {
      this.done();
    },
    async actuallySave(url) {
      normaliseRuleApiGroups(this.value.rules);

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
          nonResourceURLs: rule.nonResourceURLs || [],
          verbs:           rule.verbs,
        };

        VERBS.forEach((verb) => {
          const key = this.verbKey(verb);

          tableRule[key] = rule.verbs[0] === '*' || rule.verbs.includes(verb);
          tableRule.hasCustomVerbs = rule.verbs.some((verb) => !VERBS.includes(verb));
        });

        return tableRule;
      });
    },
    createInheritedRules(parent, res = [], showParent = true) {
      if (!parent.roleTemplateNames) {
        return [];
      }

      parent.roleTemplateNames
        .map((rtn) => this.$store.getters[`management/byId`](MANAGEMENT.ROLE_TEMPLATE, rtn))
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

    showPsaWarning(grant) {
      return this.value.subtype === NAMESPACE &&
        grant.verbs?.includes('updatepsa') &&
        grant.resources?.includes('projects') &&
        grant.apiGroups?.includes('management.cattle.io');
    }
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
    :errors="fvUnreportedValidationErrors"
    :validation-passed="fvFormIsValid"
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
        :sub-rows="true"
      >
        <template #sub-row="{row, fullColspan, onRowMouseEnter, onRowMouseLeave}">
          <tr

            class="sub-row"
            @mouseenter="onRowMouseEnter"
            @mouseleave="onRowMouseLeave"
          >
            <td
              v-if="showPsaWarning(row)"
              :colspan="fullColspan"
            >
              <Banner
                style="margin: 0px"
                label-key="rbac.roletemplate.tabs.grantResources.psaWarning"
                color="warning"
              />
            </td>
          </tr>
        </template>
      </SortableTable>
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
        :value="value"
        :namespaced="isNamespaced"
        :mode="mode"
        name-key="displayName"
        description-key="description"
        label="Name"
        :rules="{ name: fvGetAndReportPathRules('displayName') }"
        @update:value="$emit('input', $event)"
      />
      <div
        v-if="isRancherType"
        class="row"
      >
        <div class="col span-6">
          <RadioGroup
            v-model:value="defaultValue"
            name="storageSource"
            :label="defaultLabel"
            class="mb-10"
            data-testid="roletemplate-creator-default-options"
            :options="newUserDefaultOptions"
            :mode="mode"
          />
        </div>
        <div
          v-if="isRancherRoleTemplate"
          class="col span-6"
        >
          <RadioGroup
            v-model:value="value.locked"
            name="storageSource"
            :label="t('rbac.roletemplate.locked.label')"
            class="mb-10"
            data-testid="roletemplate-locked-options"
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
          <Error
            :value="value.rules"
            :rules="fvGetAndReportPathRules('rules')"
            as-banner
          />
          <GrantResources
            v-model:value="value.rules"
            :mode="mode"
            :disabled="isBuiltin"
            :resource-options="resourceOptions"
            :default-rule="defaultRule"
            :show-non-resource-urls="!isNamespaced"
            :resource-required="isNamespaced"
          >
            <template #value-sub-row="{row}">
              <div
                v-if="showPsaWarning(row.value)"
                class="mr-20"
              >
                <Banner
                  label-key="rbac.roletemplate.tabs.grantResources.psaWarning"
                  color="warning"
                />
              </div>
            </template>
          </GrantResources>
        </Tab>
        <Tab
          v-if="isRancherRoleTemplate"
          name="inherit-from"
          label="Inherit From"
          :weight="0"
        >
          <ArrayList
            v-model:value="value.roleTemplateNames"
            :disabled="isBuiltin"
            :remove-allowed="!isBuiltin"
            :add-allowed="!isBuiltin"
            label="Resources"
            add-label="Add Resource"
            :mode="mode"
          >
            <template #columns="props">
              <div class="columns row mr-20">
                <div class="col span-12">
                  <Select
                    v-model:value="props.row.value"
                    class="lg"
                    :taggable="false"
                    :disabled="isBuiltin"
                    :searchable="true"
                    :options="selectFocused === props.i ? templateOptions : [keyedTemplateOptions[props.row.value]]"
                    option-key="value"
                    option-label="label"
                    :mode="mode"
                    :compact="true"
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
  :deep() {
    .column-headers {
      margin-bottom: 5px;
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
      .col > .unlabeled-select:not(.taggable) {
        // override the odd padding-top from shell/assets/styles/global/_select.scss
        padding: $unlabaled-select-padding
      }
    }
  }
</style>
