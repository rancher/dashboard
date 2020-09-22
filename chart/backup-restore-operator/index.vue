<script>
import Tab from '@/components/Tabbed/Tab';
import S3 from '@/chart/backup-restore-operator/S3';
import RadioGroup from '@/components/form/RadioGroup';
import LabeledSelect from '@/components/form/LabeledSelect';
import LabeledInput from '@/components/form/LabeledInput';
import Banner from '@/components/Banner';
import { get } from '@/utils/object';
import { allHash } from '@/utils/promise';
import { STORAGE_CLASS, SECRET, PV } from '@/config/types';
import { mapGetters } from 'vuex';
import { STORAGE } from '@/config/labels-annotations';

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
  },

  data() {
    let storageSource;

    if (this.mode === 'create') {
      storageSource = 's3';
      this.value.s3.enabled = true;
    } else {
      this.getStorageSource(this.value);
    }

    return {
      storageSource, secrets: [], storageClasses: [], persistentVolumes: []
    };
  },

  computed: {
    defaultStorageClass() {
      return this.storageClasses.filter(sc => sc.metadata.annotations[STORAGE.DEFAULT_STORAGE_CLASS])[0];
    },

    storageClassNames() {
      return this.storageClasses.reduce((total, each) => {
        total.push(each.id);

        return total;
      }, []);
    },

    unboundPVs() {
      return this.persistentVolumes.reduce((total, each) => {
        if (each?.status?.phase !== 'bound') {
          total.push(each.id);
        }

        return total;
      }, []);
    },

    radioOptions() {
      const options = ['s3', 'pickSC', 'pickPV'];
      const labels = [
        this.t('backupRestoreOperator.deployment.storage.options.s3'),
        this.t('backupRestoreOperator.deployment.storage.options.pickSC'),
        this.t('backupRestoreOperator.deployment.storage.options.pickPV'),
      ];

      if (this.defaultStorageClass) {
        options.splice(1, 0, 'defaultSC');
        labels.splice(1, 0, this.t('backupRestoreOperator.deployment.storage.options.defaultStorageClass', { name: this.defaultStorageClass.name }));
      }

      return { options, labels };
    },

    ...mapGetters({ t: 'i18n/t' })

  },

  watch: {
    storageSource(neu) {
      switch (neu) {
      case 'defaultSC':
        this.value.persistence.enabled = true;
        this.value.s3.enabled = false;
        this.value.persistence.storageClass = this.defaultStorageClass.id;
        break;
      case 'pickSC':
        this.value.persistence.enabled = true;
        delete this.value.persistence.volumeName;
        this.value.s3.enabled = false;
        break;
      case 'pickPV':
        this.value.persistence.enabled = true;
        this.value.persistence.storageClass = '-';
        this.value.s3.enabled = false;
        break;
      case 's3':
        this.value.persistence.enabled = false;
        this.value.s3.enabled = true;
        break;
      default:
        break;
      }
    }
  },

  methods: {
    getStorageSource() {
      if (get(this.value, 's3.enabled')) {
        return 's3';
      } if (get(this.value, 'persistence.enabled')) {
        if (this.value.persistence.storageClass) {
          if (this.value.persistence.storageClass === this.defaultSC.metadata.name) {
            return 'defaultSC';
          }

          return 'pickSC';
        }
        if (this.value.persistence.volumeName) {
          return 'pickPV';
        }
      }
    }
  },

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
          <div v-if="storageSource === 'pickSC'" class="col span-6">
            <LabeledSelect
              :key="storageSource"
              v-model="value.persistence.storageClass"
              :label="t('backupRestoreOperator.deployment.storage.storageClass')"
              :mode="mode"
              :options="storageClassNames"
            />
          </div>
          <div v-else-if="storageSource === 'pickPV'" class="col span-6">
            <LabeledSelect
              :key="storageSource"
              :value="value.persistence.volumeName"
              :label="t('backupRestoreOperator.deployment.storage.persistentVolume')"
              :mode="mode"
              :options="unboundPVs"
            />
          </div>
          <div class="col span-6">
            <LabeledInput v-model="value.persistence.size" :mode="mode" :label="t('backupRestoreOperator.deployment.size')" />
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
