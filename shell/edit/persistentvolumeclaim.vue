<script>
import { Checkbox } from '@components/Form/Checkbox';
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Tab from '@shell/components/Tabbed/Tab';
import { RadioGroup } from '@components/Form/Radio';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import UnitInput from '@shell/components/form/UnitInput';
import uniq from 'lodash/uniq';
import { _CREATE, _EDIT, FOCUS, _VIEW } from '@shell/config/query-params';
import { STORAGE_CLASS, PV } from '@shell/config/types';
import StatusTable from '@shell/components/StatusTable';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import Labels from '@shell/components/form/Labels';
import { Banner } from '@components/Banner';

const DEFAULT_STORAGE = '10Gi';

export default {
  name: 'PersistentVolumeClaim',

  components: {
    Banner,
    Checkbox,
    CruResource,
    LabeledInput,
    LabeledSelect,
    Labels,
    NameNsDescription,
    RadioGroup,
    ResourceTabs,
    StatusTable,
    Tab,
    UnitInput,
  },

  mixins: [CreateEditView],
  async fetch() {
    const storageClasses = await this.$store.dispatch('cluster/findAll', { type: STORAGE_CLASS });

    if (this.$store.getters['management/canList'](PV)) {
      this.persistentVolumes = await this.$store.dispatch('cluster/findAll', { type: PV });
    }

    this.storageClassOptions = storageClasses.map(s => s.name).sort();
    this.storageClassOptions.unshift(this.t('persistentVolumeClaim.useDefault'));
    this.persistentVolumeOptions = this.persistentVolumes
      .map((s) => {
        const status = s.status.phase === 'Available' ? '' : ` (${ s.status.phase })`;

        return {
          label:  `${ s.name }${ status }`,
          value: s.name
        };
      })
      .sort((l, r) => l.label.localeCompare(r.label));
    this.$set(this.value.spec, 'storageClassName', this.value.spec.storageClassName || this.storageClassOptions[0]);
  },
  data() {
    const canListPersistentVolumes = this.$store.getters['management/canList'](PV);
    const canListStorageClasses = this.$store.getters['management/canList'](STORAGE_CLASS);
    const sourceOptions = [
      {
        label: this.t('persistentVolumeClaim.source.options.new'),
        value: 'new'
      },
      {
        label: this.t('persistentVolumeClaim.source.options.existing'),
        value: 'existing'
      }
    ];

    const defaultAccessModes = ['ReadWriteOnce'];

    this.$set(this.value, 'spec', this.value.spec || {});
    this.$set(this.value.spec, 'resources', this.value.spec.resources || {});
    this.$set(this.value.spec.resources, 'requests', this.value.spec.resources.requests || {});
    this.$set(this.value.spec.resources.requests, 'storage', this.value.spec.resources.requests.storage || DEFAULT_STORAGE);
    if (this.realMode === _CREATE) {
      this.$set(this.value.spec, 'accessModes', defaultAccessModes);
    }

    const defaultTab = this.$route.query[FOCUS] || null;

    return {
      sourceOptions,
      source:                  this.value.spec.volumeName ? sourceOptions[1].value : sourceOptions[0].value,
      immutableMode:           this.realMode === _CREATE ? _CREATE : _VIEW,
      persistentVolumeOptions: [],
      persistentVolumes:       [],
      storageClassOptions:     [],
      defaultTab,
      canListPersistentVolumes,
      canListStorageClasses,
    };
  },
  computed: {
    readWriteOnce: {
      get() {
        return this.value.spec.accessModes.includes('ReadWriteOnce');
      },
      set(value) {
        this.checkboxSetter('ReadWriteOnce', value);
      }
    },
    readOnlyMany: {
      get() {
        return this.value.spec.accessModes.includes('ReadOnlyMany');
      },
      set(value) {
        this.checkboxSetter('ReadOnlyMany', value);
      }
    },
    readWriteMany: {
      get() {
        return this.value.spec.accessModes.includes('ReadWriteMany');
      },
      set(value) {
        this.checkboxSetter('ReadWriteMany', value);
      }
    },
    persistentVolume: {
      get() {
        return this.value.spec.volumeName;
      },
      set(value) {
        const persistentVolume = this.persistentVolumes.find(pv => pv.name === value);

        if (persistentVolume) {
          this.$set(this.value.spec.resources.requests, 'storage', persistentVolume.spec.capacity?.storage);
        }

        this.$set(this.value.spec, 'volumeName', value);
        this.$set(this.value.spec, 'storageClassName', '');
      }
    },
    storageAmountMode() {
      if (this.isCreate) {
        return _CREATE;
      } else if (this.isEdit && this.value.expandable && this.value.bound) {
        return _EDIT;
      }

      return _VIEW;
    }
  },
  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
  },
  mounted() {
    const focus = this.$refs.volumeSize?.focus;

    if (this.defaultTab === 'volumeclaim' && focus) {
      setTimeout(() => focus());
    }
  },
  methods: {
    checkboxSetter(key, value) {
      if (value) {
        this.value.spec.accessModes.push(key);
        this.$set(this.value, 'accessModes', uniq(this.value.spec.accessModes));
      } else {
        const indexOf = this.value.spec.accessModes.indexOf(key);

        if (indexOf >= 0) {
          this.value.spec.accessModes.splice(indexOf, 1);
        }
      }
    },
    isPersistentVolumeSelectable(option) {
      const persistentVolume = this.persistentVolumes.find(pv => pv.name === option.value);

      return persistentVolume.status.phase === 'Available';
    },
    updateDefaults(source) {
      if (source === 'new') {
        this.$set(this.value.spec.resources.requests, 'storage', DEFAULT_STORAGE);
      }

      this.$set(this, 'persistentVolume', null);
    },
    willSave() {
      if (this.value.spec.storageClassName === this.t('persistentVolumeClaim.useDefault')) {
        this.$delete(this.value.spec, 'storageClassName');
      }
    }
  }
};
</script>

<template>
  <CruResource
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :validation-passed="true"
    :errors="errors"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription
      :value="value"
      :mode="mode"
      :register-before-hook="registerBeforeHook"
      :namespaced="true"
    />

    <ResourceTabs v-model="value" :mode="mode" :side-tabs="true" :default-tab="defaultTab">
      <Tab name="volumeclaim" :label="t('persistentVolumeClaim.volumeClaim.label')" :weight="4">
        <div class="row">
          <div class="col span-6">
            <RadioGroup
              v-model="source"
              name="source"
              :mode="immutableMode"
              :label="t('persistentVolumeClaim.source.label')"
              :options="sourceOptions"
              @input="updateDefaults"
            />
          </div>
          <div class="col span-6">
            <div class="row">
              <div v-if="source === 'new'" class="col span-12">
                <LabeledSelect
                  v-if="canListStorageClasses"
                  v-model="value.spec.storageClassName"
                  :options="storageClassOptions"
                  :label="t('persistentVolumeClaim.volumeClaim.storageClass')"
                  :mode="immutableMode"
                />
                <LabeledInput
                  v-else
                  v-model="value.spec.storageClassName"
                  :label="t('persistentVolumeClaim.volumeClaim.storageClass')"
                  :mode="immutableMode"
                  :tooltip="t('persistentVolumeClaim.volumeClaim.tooltips.noStorageClass')"
                />
              </div>
              <div v-else class="col span-12">
                <LabeledSelect
                  v-if="canListPersistentVolumes"
                  v-model="persistentVolume"
                  :options="persistentVolumeOptions"
                  :label="t('persistentVolumeClaim.volumeClaim.persistentVolume')"
                  :selectable="isPersistentVolumeSelectable"
                  :mode="immutableMode"
                />
                <LabeledInput
                  v-else
                  v-model="persistentVolume"
                  :label="t('persistentVolumeClaim.volumeClaim.persistentVolume')"
                  :mode="immutableMode"
                  :tooltip="t('persistentVolumeClaim.volumeClaim.tooltips.noPersistentVolume')"
                />
              </div>
            </div>
            <div class="row">
              <div class="col span-12 mt-10">
                <UnitInput
                  ref="volumeSize"
                  v-model="value.spec.resources.requests.storage"
                  :label="t('persistentVolumeClaim.volumeClaim.requestStorage')"
                  :mode="storageAmountMode"
                  :input-exponent="3"
                  :output-modifier="true"
                  :increment="1024"
                  :min="1"
                  :required="true"
                />
                <Banner v-if="isEdit && !value.expandable" color="info" class="mt-10">
                  {{ t('persistentVolumeClaim.expand.notSupported') }}
                </Banner>
                <Banner v-else-if="isEdit && !value.bound" color="info" class="mt-10">
                  {{ t('persistentVolumeClaim.expand.notBound') }}
                </Banner>
              </div>
            </div>
          </div>
        </div>
      </Tab>
      <Tab name="customize" :label="t('persistentVolumeClaim.customize.label')" :weight="3">
        <div class="access">
          <h3>{{ t('persistentVolumeClaim.accessModes') }}</h3>
          <span class="text-error">*</span>
        </div>
        <div><Checkbox v-model="readWriteOnce" :label="t('persistentVolumeClaim.customize.accessModes.readWriteOnce')" :mode="immutableMode" /></div>
        <div><Checkbox v-model="readOnlyMany" :label="t('persistentVolumeClaim.customize.accessModes.readOnlyMany')" :mode="immutableMode" /></div>
        <div><Checkbox v-model="readWriteMany" :label="t('persistentVolumeClaim.customize.accessModes.readWriteMany')" :mode="immutableMode" /></div>
      </Tab>
      <Tab v-if="isView" name="status" :label="t('persistentVolumeClaim.status.label')" :weight="2">
        <StatusTable :resource="value" />
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
    </ResourceTabs>
  </CruResource>
</template>

<style lang='scss' scoped>
.access {
  display: flex;
  flex-direction: row;
}
</style>
