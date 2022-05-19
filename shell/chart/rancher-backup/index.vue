<script>
import Tab from '@shell/components/Tabbed/Tab';
import S3 from '@shell/chart/rancher-backup/S3';
import RadioGroup from '@shell/components/form/RadioGroup';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import LabeledInput from '@shell/components/form/LabeledInput';
import Banner from '@shell/components/Banner';
import { get } from '@shell/utils/object';
import { allHash } from '@shell/utils/promise';
import { STORAGE_CLASS, SECRET, PV } from '@shell/config/types';
import { mapGetters } from 'vuex';
import { STORAGE } from '@shell/config/labels-annotations';

export default {
  components: {
    Tab,
    RadioGroup,
    S3,
    LabeledInput,
    LabeledSelect,
    Banner
  },

  hasTabs: true,

  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    mode: {
      type:    String,
      default: 'create'
    }
  },

  async  fetch() {
    const hash = await allHash({
      storageClasses:    this.$store.dispatch('cluster/findAll', { type: STORAGE_CLASS }),
      persistentVolumes: this.$store.dispatch('cluster/findAll', { type: PV }),
      secrets:           this.$store.dispatch('cluster/findAll', { type: SECRET }),
    });

    this.secrets = hash.secrets;
    this.storageClasses = hash.storageClasses;
    this.persistentVolumes = hash.persistentVolumes;

    this.storageSource = this.getStorageSource(this.value) || 'none';
  },

  data() {
    return {
      secrets:           [],
      storageClasses:    [],
      persistentVolumes: [],
      storageSource:     null,
      storageClass:      '',
      persistentVolume:  '',
      reclaimWarning:    false
    };
  },

  computed: {
    defaultStorageClass() {
      return this.storageClasses.filter(sc => sc.metadata.annotations[STORAGE.DEFAULT_STORAGE_CLASS] && sc.metadata.annotations[STORAGE.DEFAULT_STORAGE_CLASS] !== 'false' )[0] || '';
    },

    availablePVs() {
      return this.persistentVolumes.filter(pv => pv.status.phase.toLowerCase() !== 'bound');
    },

    radioOptions() {
      const options = ['none', 's3', 'pickSC', 'pickPV'];
      const labels = [
        this.t('backupRestoreOperator.deployment.storage.options.none'),
        this.t('backupRestoreOperator.deployment.storage.options.s3'),
        this.t('backupRestoreOperator.deployment.storage.options.pickSC'),
        this.t('backupRestoreOperator.deployment.storage.options.pickPV'),
      ];

      return { options, labels };
    },

    ...mapGetters({ t: 'i18n/t' })

  },

  watch: {
    storageSource(neu) {
      switch (neu) {
      case 'pickSC':
        this.value.persistence.enabled = true;
        this.value.s3.enabled = false;
        if (this.defaultStorageClass && (!this.value.persistence.storageClass || this.value.persistence.storageClass === '-' )) {
          this.value.persistence.storageClass = this.defaultStorageClass.id;
          this.storageClass = this.defaultStorageClass;
        }
        if (this.storageClass?.reclaimPolicy === 'Delete') {
          this.reclaimWarning = true;
        }
        delete this.value.persistence.volumeName;
        break;
      case 'pickPV':
        this.value.persistence.enabled = true;
        this.value.s3.enabled = false;
        this.value.persistence.storageClass = '-';
        this.reclaimWarning = false;
        break;
      case 's3':
        this.value.persistence.enabled = false;
        this.value.s3.enabled = true;
        break;
      default:
        this.value.persistence.enabled = false;
        this.value.s3.enabled = false;
        break;
      }
    },

    storageClass(neu = {}) {
      this.value.persistence.storageClass = neu.id;
      if (neu.reclaimPolicy === 'Delete') {
        this.reclaimWarning = true;
      } else {
        this.reclaimWarning = false;
      }
    },

    persistentVolume(neu) {
      this.value.persistence.volumeName = neu.metadata.name;
      if (neu.spec?.persistentVolumeReclaimPolicy === 'Delete') {
        this.reclaimWarning = true;
      } else {
        this.reclaimWarning = false;
      }
    },
  },

  methods: {
    getStorageSource() {
      if (get(this.value, 's3.enabled')) {
        return 's3';
      } if (get(this.value, 'persistence.enabled')) {
        if (this.value.persistence.storageClass) {
          return 'pickSC';
        }
        if (this.value.persistence.volumeName) {
          return 'pickPV';
        }
      }

      return 'none';
    }
  },
  get
};
</script>

<template>
  <div>
    <Tab label="Chart Options" name="chartOptions">
      <Banner color="info" :label="t('backupRestoreOperator.deployment.storage.tip')" />
      <RadioGroup
        v-model="storageSource"
        name="storageSource"
        :label="t('backupRestoreOperator.deployment.storage.label')"
        class="mb-10"
        :options="radioOptions.options"
        :labels="radioOptions.labels"
      />
      <S3 v-if="storageSource==='s3'" :value="value.s3" :secrets="secrets" :mode="mode" />
      <template v-else>
        <div class="row">
          <template v-if="storageSource === 'pickSC'">
            <div class="col span-6">
              <LabeledSelect
                :key="storageSource"
                v-model="storageClass"
                :get-option-label="opt => opt.id || opt"
                :label="t('backupRestoreOperator.deployment.storage.storageClass.label')"
                :tooltip="reclaimWarning ? t('backupRestoreOperator.deployment.storage.warning', {type: 'Storage Class'}) : null"
                :mode="mode"
                :status="reclaimWarning ? 'warning' : null"
                :options="storageClasses"
                :hover-tooltip="true"
              />
            </div>
            <div class="col span-6">
              <LabeledInput v-model="value.persistence.size" :mode="mode" :label="t('backupRestoreOperator.deployment.size')" />
            </div>
          </template>
          <div v-else-if="storageSource === 'pickPV'" class="col span-6">
            <LabeledSelect
              :key="storageSource"
              v-model="persistentVolume"
              :get-option-label="opt => opt.id || opt"
              :label="t('backupRestoreOperator.deployment.storage.persistentVolume.label')"
              :tooltip="reclaimWarning ? t('backupRestoreOperator.deployment.storage.warning', {type: 'Persistent Volume'}) : null"
              :mode="mode"
              :status="reclaimWarning ? 'warning' : null"
              :options="availablePVs"
              :hover-tooltip="true"
            />
          </div>
        </div>
      </template>
    </Tab>
  </div>
</template>

<style lang='scss' scoped>
::v-deep .radio-group.label>SPAN {
  font-size: 1em;
}
</style>
