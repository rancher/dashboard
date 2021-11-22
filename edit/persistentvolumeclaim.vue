<script>
import Checkbox from '@/components/form/Checkbox';
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import NameNsDescription from '@/components/form/NameNsDescription';
import Tab from '@/components/Tabbed/Tab';
import RadioGroup from '@/components/form/RadioGroup';
import LabeledSelect from '@/components/form/LabeledSelect';
import UnitInput from '@/components/form/UnitInput';
import uniq from 'lodash/uniq';
import { _CREATE } from '@/config/query-params';
import { STORAGE_CLASS, PV } from '@/config/types';
import StatusTable from '@/components/StatusTable';
import ResourceTabs from '@/components/form/ResourceTabs';

const DEFAULT_STORAGE = '10Gi';

export default {
  name: 'PersistentVolumClaim',

  components: {
    Checkbox,
    CruResource,
    LabeledSelect,
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

    this.persistentVolumes = await this.$store.dispatch('cluster/findAll', { type: PV });

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

    return {
      sourceOptions,
      source:                  this.value.spec.volumeName ? sourceOptions[1].value : sourceOptions[0].value,
      persistentVolumeOptions: [],
      persistentVolumes:       [],
      storageClassOptions:     [],
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
    }
  },
  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
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

    <ResourceTabs v-model="value" :mode="mode" :side-tabs="true">
      <Tab name="volumeclaim" :label="t('persistentVolumeClaim.volumeClaim.label')" :weight="4">
        <div class="row">
          <div class="col span-6">
            <RadioGroup
              v-model="source"
              name="source"
              :mode="mode"
              :label="t('persistentVolumeClaim.source.label')"
              :options="sourceOptions"
              @input="updateDefaults"
            />
          </div>
          <div v-if="source === 'new'" class="col span-6">
            <div class="row">
              <div class="col span-12">
                <LabeledSelect v-model="value.spec.storageClassName" :options="storageClassOptions" :label="t('persistentVolumeClaim.volumeClaim.storageClass')" :mode="mode" />
              </div>
            </div>
            <div class="row">
              <div class="col span-12 mt-10">
                <UnitInput
                  v-model="value.spec.resources.requests.storage"
                  :label="t('persistentVolumeClaim.volumeClaim.requestStorage')"
                  :mode="mode"
                  :input-exponent="3"
                  :output-modifier="true"
                  :increment="1024"
                  :min="1"
                />
              </div>
            </div>
          </div>
          <div v-else class="col span-6">
            <div class="row">
              <div class="col span-12">
                <LabeledSelect
                  v-model="persistentVolume"
                  :options="persistentVolumeOptions"
                  :label="t('persistentVolumeClaim.volumeClaim.persistentVolume')"
                  :selectable="isPersistentVolumeSelectable"
                  :mode="mode"
                />
              </div>
            </div>
          </div>
        </div>
      </Tab>
      <Tab name="customize" :label="t('persistentVolumeClaim.customize.label')" :weight="3">
        <h3>Access Modes</h3>
        <div><Checkbox v-model="readWriteOnce" :label="t('persistentVolumeClaim.customize.accessModes.readWriteOnce')" :mode="mode" /></div>
        <div><Checkbox v-model="readOnlyMany" :label="t('persistentVolumeClaim.customize.accessModes.readOnlyMany')" :mode="mode" /></div>
        <div><Checkbox v-model="readWriteMany" :label="t('persistentVolumeClaim.customize.accessModes.readWriteMany')" :mode="mode" /></div>
      </Tab>
      <Tab v-if="isView" name="status" :label="t('persistentVolumeClaim.status.label')" :weight="2">
        <StatusTable :resource="value" />
      </Tab>
    </ResourceTabs>
  </CruResource>
</template>
