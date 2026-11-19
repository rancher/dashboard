<script lang="ts">
import { defineComponent } from 'vue';
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import CruResource from '@shell/components/CruResource.vue';
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';
import ArrayList from '@shell/components/form/ArrayList.vue';
import Error from '@shell/components/form/Error.vue';
import GrantResources from '@shell/components/auth/GrantResources.vue';
import Principal from '@shell/components/auth/Principal.vue';
import SelectPrincipal from '@shell/components/auth/SelectPrincipal.vue';
import Loading from '@shell/components/Loading.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { SCOPED_RESOURCES, SCOPED_RESOURCE_GROUPS } from '@shell/config/roles';
import { MANAGEMENT } from '@shell/config/types';
import { grantResourceOptions, normaliseRuleApiGroups } from '@shell/utils/grant-resources';
import { PolicyRule } from '@shell/types/resources/rbac';

export default defineComponent({
  name: 'EditPersona',

  emits: ['input', 'update:value'],

  inheritAttrs: false,

  components: {
    CruResource,
    NameNsDescription,
    ArrayList,
    Error,
    GrantResources,
    Principal,
    SelectPrincipal,
    Loading,
    LabeledInput,
  },

  mixins: [
    CreateEditView,
    FormValidation
  ],

  data() {
    return {
      fvFormRuleSets: [
        {
          path: 'metadata.name', rules: ['subDomain'], translationKey: 'nameNsDescription.name.label'
        },
        {
          path: 'spec.displayName', rules: ['required'], translationKey: 'persona.displayName.label'
        },
        {
          path: 'spec.priority', rules: ['requiredInt', 'isInteger'], translationKey: 'persona.priority.label'
        },
      ],
      defaultRule: {
        apiGroups: [''], resources: [], verbs: []
      } as PolicyRule,
      // null until the persona's assignments are loaded, so a failed load never saves an empty list over them
      principalIds: null as string[] | null,
    };
  },

  async fetch() {
    if (!this.isCreate) {
      this.principalIds = await this.value.assignedPrincipalIds();
    }
  },

  created() {
    this.registerBeforeHook(() => normaliseRuleApiGroups(this.value.spec.rules));

    if (this.isCreate) {
      this.principalIds = [];
    }

    if (!this.isView) {
      this.registerAfterHook(this.saveAssignments, 'saveAssignments');
    }
  },

  methods: {
    addPrincipal(id: string) {
      if (this.principalIds && !this.principalIds.includes(id)) {
        this.principalIds = [...this.principalIds, id];
      }
    },

    async saveAssignments() {
      if (!this.principalIds) {
        return;
      }

      try {
        await this.value.assignPrincipals(this.principalIds);
      } catch (err) {
        if (this.isCreate) {
          await this.rollBackCreate();
        }

        throw err;
      }
    },

    /**
     * The persona was created but its assignments failed. Copies the user create page (management.cattle.io.user.vue):
     * remove what was created so the form stays a create form and saving again starts clean
     */
    async rollBackCreate() {
      try {
        // The global role's owner reference to the persona removes the role and any bindings already made with it
        await this.value.remove();
      } catch (cleanupErr) {
        console.error('Failed to remove the persona after assigning it failed:', cleanupErr); // eslint-disable-line no-console

        this.$store.dispatch('growl/error', {
          title:   this.t('persona.assignments.orphaned.title'),
          message: this.t('persona.assignments.orphaned.message', { name: this.value.metadata.name }, true),
        });

        return;
      }

      // The removed global role is still cached, and saving again would take it as there and not create it
      await this.$store.dispatch('management/forgetType', MANAGEMENT.GLOBAL_ROLE);

      // Carry on with a new, unsaved persona holding what was entered, so the next save creates it again. The saved one is
      // still in the store, where watch events for its removal keep updating it
      const { type, metadata, spec } = JSON.parse(JSON.stringify(this.value));
      const persona = await this.value.$dispatch('create', {
        type,
        metadata: {
          name: metadata.name, annotations: metadata.annotations, labels: metadata.labels
        },
        spec,
      });

      this.$emit('update:value', persona);
    },
  },

  computed: {
    resourceOptions() {
      return grantResourceOptions((key: string) => this.t(key), Object.keys(SCOPED_RESOURCES) as SCOPED_RESOURCE_GROUPS[]);
    },

    rules: {
      get(): PolicyRule[] {
        return this.value.spec.rules || [];
      },

      set(rules: PolicyRule[]) {
        this.value.spec.rules = rules;
      }
    },

    priority: {
      get(): number | string {
        return this.value.spec.priority;
      },

      set(val: string) {
        // Keep '' rather than null: form validation skips null values, so requiredInt would never fail
        this.value.spec.priority = val === '' ? val : Number(val);
      }
    },
  },
});
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    :mode="mode"
    :resource="value"
    :done-route="doneRoute"
    :errors="errors"
    :validation-passed="fvFormIsValid"
    @finish="save"
    @error="e=>errors=e"
  >
    <div class="row mt-20">
      <div class="col span-12">
        <NameNsDescription
          :value="value"
          :mode="mode"
          :namespaced="false"
          description-placeholder="persona.description.placeholder"
          :rules="{ name: fvGetAndReportPathRules('metadata.name'), description: [] }"
          @update:value="$emit('input', $event)"
        />
      </div>
    </div>
    <div class="row mt-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.displayName"
          :mode="mode"
          :label="t('persona.displayName.label')"
          :placeholder="t('persona.displayName.placeholder')"
          :required="true"
          :rules="fvGetAndReportPathRules('spec.displayName')"
          data-testid="persona-display-name"
        />
      </div>
      <div class="col span-3">
        <LabeledInput
          v-model:value="priority"
          type="number"
          :mode="mode"
          :label="t('persona.priority.label')"
          :tooltip="t('persona.priority.tooltip')"
          :required="true"
          :rules="fvGetAndReportPathRules('spec.priority')"
          data-testid="persona-priority"
        />
      </div>
    </div>
    <div class="row mt-40">
      <div class="col span-12">
        <h3>{{ t('persona.resourcePermissions.label') }}</h3>
        <p class="mb-10">
          {{ t('persona.resourcePermissions.description') }}
        </p>
        <Error
          :value="rules"
          :rules="fvGetAndReportPathRules('spec.rules')"
          as-banner
        />
        <GrantResources
          v-model:value="rules"
          :mode="mode"
          :resource-options="resourceOptions"
          :default-rule="defaultRule"
          :show-non-resource-urls="false"
          :initial-empty-row="false"
          data-testid="persona-resource-permissions"
        />
      </div>
    </div>
    <div class="row mt-40">
      <div class="col span-6">
        <h3>{{ t('persona.assignments.label', {}, true) }}</h3>
        <p class="mb-10">
          {{ t('persona.assignments.description', {}, true) }}
        </p>
        <ArrayList
          v-if="principalIds"
          v-model:value="principalIds"
          :mode="mode"
          :protip="false"
          data-testid="persona-assignments"
        >
          <template #value="{row}">
            <Principal :value="row.value" />
          </template>
          <template #add>
            <SelectPrincipal
              :mode="mode"
              :select-label="t('persona.assignments.add.label')"
              :select-placeholder="t('persona.assignments.add.placeholder')"
              @add="addPrincipal"
            />
          </template>
        </ArrayList>
      </div>
    </div>
    <div class="row mt-40">
      <div class="col span-6">
        <ArrayList
          v-model:value="value.spec.tags"
          :mode="mode"
          :title="t('persona.tags.label')"
          :a11y-label="t('persona.tags.label')"
          :add-label="t('persona.tags.addLabel')"
          :protip="false"
          :show-header="true"
          :value-label="''"
          data-testid="persona-tags"
        />
      </div>
    </div>
  </CruResource>
</template>
