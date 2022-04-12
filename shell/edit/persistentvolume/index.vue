<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import ArrayList from '@shell/components/form/ArrayList';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import MatchExpressions from '@shell/components/form/MatchExpressions';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import NodeAffinity from '@shell/components/form/NodeAffinity';
import Checkbox from '@shell/components/form/Checkbox';
import uniq from 'lodash/uniq';
import UnitInput from '@shell/components/form/UnitInput';
import { NODE, PVC, STORAGE_CLASS } from '@shell/config/types';
import Loading from '@shell/components/Loading';
import { LONGHORN_PLUGIN, VOLUME_PLUGINS } from '@shell/models/persistentvolume';
import { _CREATE, _VIEW } from '@shell/config/query-params';
import { clone } from '@shell/utils/object';
import InfoBox from '@shell/components/InfoBox';
import { mapFeature, UNSUPPORTED_STORAGE_DRIVERS } from '@shell/store/features';

export default {
  name: 'PersistentVolume',

  components: {
    ArrayList,
    ArrayListGrouped,
    Checkbox,
    CruResource,
    InfoBox,
    LabeledSelect,
    Loading,
    MatchExpressions,
    NameNsDescription,
    NodeAffinity,
    Tab,
    Tabbed,
    UnitInput
  },

  mixins: [CreateEditView],

  async fetch() {
    const storageClasses = await this.$store.dispatch('cluster/findAll', { type: STORAGE_CLASS });

    await this.$store.dispatch('cluster/findAll', { type: PVC });

    this.storageClassOptions = storageClasses.map(s => ({
      label: s.name,
      value: s.name
    }));
    this.storageClassOptions.unshift(this.NONE_OPTION);
  },

  data() {
    const NONE_OPTION = {
      label: this.t('generic.none'),
      value: ''
    };
    const defaultAccessModes = ['ReadWriteOnce'];

    this.$set(this.value, 'spec', this.value.spec || {});
    this.$set(this.value.spec, 'accessModes', this.value.spec.accessModes || defaultAccessModes);
    this.$set(this.value.spec, 'capacity', this.value.spec.capacity || {});
    this.$set(this.value.spec.capacity, 'storage', this.value.spec.capacity.storage || '10Gi');
    this.$set(this.value.spec, 'storageClassName', this.value.spec.storageClassName || NONE_OPTION.value);

    const foundPlugin = this.value.isLonghorn ? LONGHORN_PLUGIN : VOLUME_PLUGINS.find(plugin => this.value.spec[plugin.value]);
    const plugin = (foundPlugin || VOLUME_PLUGINS[0]).value;

    return {
      storageClassOptions: [],
      plugin,
      NONE_OPTION,
      NODE,
      initialNodeAffinity: clone(this.value.spec.nodeAffinity),
    };
  },

  computed: {
    showUnsupportedStorage: mapFeature(UNSUPPORTED_STORAGE_DRIVERS),

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
    modeOverride() {
      return this.isCreate ? _CREATE : _VIEW;
    },
    nodeSelectorTerms: {
      get() {
        return this.value.spec.nodeAffinity?.required?.nodeSelectorTerms || [];
      },
      set(value) {
        if (value.length > 0) {
          const defaultValue = { required: { nodeSelectorTerms: [] } };

          if (!this.value.spec.nodeAffinity?.required?.nodeSelectorTerms) {
            this.$set(this.value.spec, 'nodeAffinity', this.value.spec.nodeAffinity || defaultValue);
            this.$set(this.value.spec.nodeAffinity, 'required', this.value.spec.nodeAffinity.required || defaultValue.required);
            this.$set(this.value.spec.nodeAffinity.required, 'nodeSelectorTerms', this.value.spec.nodeAffinity.required.nodeSelectorTerms || defaultValue.required.nodeSelectorTerms);
          }

          this.$set(this.value.spec.nodeAffinity.required, 'nodeSelectorTerms', value);
        } else {
          this.$set(this.value.spec.nodeAffinity, 'nodeAffinity', undefined);
        }
      }
    },
    areNodeSelectorsRequired() {
      return this.plugin === 'local';
    },
    plugins() {
      return VOLUME_PLUGINS.filter(plugin => this.showUnsupportedStorage || plugin.supported);
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
    getComponent(name) {
      return require(`./plugins/${ name }`).default;
    },
    willSave() {
      if (this.value.spec.storageClassName === this.NONE_OPTION.value) {
        this.$set(this.value.spec, 'storageClassName', null);
      }

      if (!this.isCreate) {
        this.$set(this.value.spec, 'nodeAffinity', this.initialNodeAffinity);
      }
    },
    updatePlugin(value) {
      const plugin = this.plugin === LONGHORN_PLUGIN.value ? 'csi' : this.plugin;

      delete this.value.spec[plugin];
      this.$set(this, 'plugin', value);
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
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
      :namespaced="false"
    />

    <InfoBox v-if="value.claim">
      <div class="row">
        <div class="col span-6 text-center">
          <label class="text-muted">Persistent Volume Claim:</label>&nbsp;
          <n-link :to="value.claim.detailLocation">
            {{ value.claim.namespacedName }}
          </n-link>
        </div>
        <div class="col span-6 text-center">
          <label class="text-muted">Age:</label>&nbsp;
          <LiveDate class="live-date" :value="value.metadata.creationTimestamp" />
        </div>
      </div>
    </InfoBox>

    <div class="row mb-20 top-level">
      <div class="col span-6">
        <LabeledSelect
          :value="plugin"
          :label="t('persistentVolume.plugin.label')"
          :localized-label="true"
          option-label="labelKey"
          :options="plugins"
          :mode="modeOverride"
          :required="true"
          @input="updatePlugin($event)"
        />
      </div>
      <div class="col span-6">
        <UnitInput
          v-model="value.spec.capacity.storage"
          :required="true"
          :label="t('persistentVolume.capacity.label')"
          :increment="1024"
          :input-exponent="3"
          :output-modifier="true"
          :mode="mode"
        />
      </div>
    </div>
    <Tabbed :side-tabs="true">
      <Tab name="plugin-configuration" :label="t('persistentVolume.pluginConfiguration.label')" :weight="1">
        <component :is="getComponent(plugin)" :key="plugin" :value="value" :mode="modeOverride" />
      </Tab>
      <Tab
        name="customize"
        :label="t('persistentVolume.customize.label')"
        :weight="0"
      >
        <div class="row mb-20">
          <div class="col span-6">
            <h3>{{ t('persistentVolume.customize.accessModes.label') }}</h3>
            <div><Checkbox v-model="readWriteOnce" :label="t('persistentVolume.customize.accessModes.readWriteOnce')" :mode="mode" /></div>
            <div><Checkbox v-model="readOnlyMany" :label="t('persistentVolume.customize.accessModes.readOnlyMany')" :mode="mode" /></div>
            <div><Checkbox v-model="readWriteMany" :label="t('persistentVolume.customize.accessModes.readWriteMany')" :mode="mode" /></div>
          </div>
          <div class="col span-6">
            <ArrayList
              v-model="value.spec.mountOptions"
              :mode="mode"
              :title="t('persistentVolume.customize.mountOptions.label')"
              :add-label="t('persistentVolume.customize.mountOptions.addLabel')"
            />
          </div>
        </div>
        <div class="row mb-20">
          <div class="col span-6">
            <LabeledSelect
              v-model="value.spec.storageClassName"
              :label="t('persistentVolume.customize.assignToStorageClass.label')"
              :options="storageClassOptions"
            />
          </div>
        </div>
        <div class="row">
          <div class="col span-12">
            <h3>{{ t('persistentVolume.customize.affinity.label') }} <span v-if="areNodeSelectorsRequired" class="required text-small">*</span></h3>
            <ArrayListGrouped v-model="nodeSelectorTerms" :mode="modeOverride" :default-add-value="{matchExpressions:[]}" :add-label="t('workload.scheduling.affinity.addNodeSelector')">
              <template #default="props">
                <MatchExpressions
                  v-model="props.row.value.matchExpressions"
                  :mode="modeOverride"
                  class="col span-12"
                  :type="NODE"
                  :show-remove="false"
                />
              </template>
            </ArrayListGrouped>
          </div>
        </div>
      </Tab>
    </Tabbed>
  </CruResource>
</template>
<style lang="scss" scoped>
.top-level .col > .labeled-select:not(.taggable) {
  max-height: 100%;
  height: 100%;
}
</style>
