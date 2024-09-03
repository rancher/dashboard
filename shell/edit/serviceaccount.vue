<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Labels from '@shell/components/form/Labels';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import { Checkbox } from '@components/Form/Checkbox';
import { SECRET } from '@shell/config/types';
import { TYPES as SECRET_TYPES } from '@shell/models/secret';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { FilterArgs, PaginationParamFilter } from '@shell/types/store/pagination.types';

export default {
  name:         'ServiceAccount',
  inheritAttrs: false,
  components:   {
    CruResource,
    NameNsDescription,
    Checkbox,
    Labels,
    Tab,
    Tabbed,
    LabeledSelect
  },

  props: {
    value: {
      type:     Object,
      required: true
    },

    mode: {
      type:    String,
      default: 'create'
    }
  },

  async fetch() {
    this.filterByApi = this.$store.getters[`cluster/paginationEnabled`](SECRET);

    if (this.filterByApi) {
      this.filteredSecrets = await this.filterSecretsByApi();
    } else {
      this.allSecrets = await this.$store.dispatch('cluster/findAll', { type: SECRET });
    }
  },

  mixins: [CreateEditView],

  data() {
    this.value['automountServiceAccountToken'] = this.value.automountServiceAccountToken || false;

    return {
      allSecrets:      [],
      filteredSecrets: null,
      secretTypes:     [SECRET_TYPES.DOCKER, SECRET_TYPES.DOCKER_JSON]
    };
  },

  watch: {
    async 'value.metadata.namespace'() {
      if (this.filterByApi) {
        this.filteredSecrets = await this.filterSecretsByApi();
      }
    }
  },

  methods: {
    filterSecretsByApi() {
      const findPageArgs = { // Of type ActionFindPageArgs
        namespaced: this.value.metadata.namespace,
        pagination: new FilterArgs({
          filters: PaginationParamFilter.createMultipleFields(this.secretTypes.map((t) => ({
            field:  'metadata.fields.1',
            value:  t,
            equals: true
          })))
        }),
      };

      return this.$store.dispatch(`cluster/findPage`, { type: SECRET, opt: findPageArgs });
    },
  },

  computed: {
    namespacedSecrets() {
      if (this.filterByApi) {
        return this.filteredSecrets;
      }

      const namespace = this.value?.metadata?.namespace;

      return this.allSecrets.filter((secret) => secret.metadata.namespace === namespace && this.secretTypes.includes(secret._type));
    },

    imagePullSecrets: {
      get() {
        if (!this.value.imagePullSecrets) {
          this.value['imagePullSecrets'] = [];
        }
        const { imagePullSecrets } = this.value;

        return imagePullSecrets.map((each) => each.name);
      },
      set(neu) {
        if (this.value.imagePullSecrets.length < 1) {
          this.value.imagePullSecrets = neu.map((secret) => {
            return { name: secret };
          });
        }
        this.value.imagePullSecrets = neu.map((secret) => {
          for (const x in secret) {
            if (x === 'metadata') {
              return { name: secret[x].name };
            }
          }

          return { name: secret };
        });
      }
    },
  },

};
</script>

<template>
  <CruResource
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :validation-passed="!!value.metadata.name"
    :errors="errors"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription
      :value="value"
      :mode="mode"
    />

    <Tabbed :side-tabs="true">
      <Tab
        name="data"
        :label="t('serviceAccount.tabs.serviceAccount.label')"
        :weight="2"
      >
        <div class="row">
          <div class="col mt-20">
            <Checkbox
              v-model:value="value.automountServiceAccountToken"
              :label="t('serviceAccount.automount')"
              type="checkbox"
              :mode="mode"
            />
          </div>
        </div>
        <div class="row">
          <div class="col span-6 mt-20">
            <h3>{{ t('serviceAccount.imagePullSecrets') }}</h3>

            <LabeledSelect
              v-model:value="imagePullSecrets"
              label-key="workload.container.imagePullSecrets.label"
              :tooltip="t('workload.container.imagePullSecrets.tooltip')"
              :multiple="true"
              :options="namespacedSecrets"
              :mode="mode"
              option-label="metadata.name"
            />
          </div>
        </div>

        <div class="row mb-20" />
      </Tab>
      <Tab
        name="labels-and-annotations"
        label-key="generic.labelsAndAnnotations"
        :weight="-1"
      >
        <Labels
          default-container-class="labels-and-annotations-container"
          :value="value"
          :mode="mode"
          :display-side-by-side="false"
        />
      </Tab>
    </Tabbed>
  </CruResource>
</template>
