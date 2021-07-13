<script>
import Footer from '@/components/form/Footer';
import RadioGroup from '@/components/form/RadioGroup';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import CreateEditView from '@/mixins/create-edit-view';
import { allHash } from '@/utils/promise';
import { exceptionToErrorsArray } from '@/utils/error';
import { HCI } from '@/config/types';

const createObject = {
  apiVersion: 'harvesterhci.io/v1beta1',
  kind:       'VirtualMachineRestore',
  metadata:   { name: '', namespace: 'default' },
  type:       HCI.RESTORE,
  spec:       {
    target: {
      apiGroup: 'kubevirt.io',
      kind:     'VirtualMachine',
      name:     ''
    },
    virtualMachineBackupName: '',
    newVM:                    true,
    deletionPolicy:           'delete'
  }
};

export default {
  name:       'CreateRestore',
  components: {
    Footer,
    RadioGroup,
    LabeledInput,
    LabeledSelect
  },

  mixins: [CreateEditView],

  async fetch() {
    await allHash({
      backups:         this.$store.dispatch('cluster/findAll', { type: HCI.BACKUP }),
      vms:             this.$store.dispatch('cluster/findAll', { type: HCI.VM }),
    });
  },

  data() {
    const restoreMode = this.$route.query?.restoreMode;
    const backupName = this.$route.query?.backupName;

    const restoreResource = createObject;

    const restoreNewVm = restoreMode === 'new' || restoreMode === undefined;

    return {
      backupName,
      restoreNewVm,
      restoreResource,
      name:           '',
      description:    '',
      deletionPolicy: 'delete',
    };
  },

  computed: {
    backupOption() {
      const choices = this.$store.getters['cluster/all'](HCI.BACKUP);

      return choices.filter( (T) => {
        const hasVM = this.restoreNewVm || T.attachVmExisting;

        return hasVM && T?.status?.readyToUse;
      }).map( (T) => {
        return {
          label: T.metadata.name,
          value: T.metadata.name
        };
      });
    },

    deletionPolicyOption() {
      return [{
        value: 'delete',
        label: 'Delete'
      }, {
        value: 'retain',
        label: 'Retain'
      }];
    },

    currentBackupResource() {
      const name = this.backupName;

      const backupList = this.$store.getters['cluster/all'](HCI.BACKUP);

      return backupList.find( O => O.name === name);
    },

    disableExisting() {
      return !this.currentBackupResource?.attachVmExisting;
    }
  },

  watch: {
    backupName: {
      handler(neu) {
        if (this.currentBackupResource) {
          if (!this.restoreNewVm) {
            this.name = this?.currentBackupResource?.attachVM;
          }
        }

        this.restoreResource.spec.virtualMachineBackupName = neu;
      },
      immediate: true
    },

    restoreNewVm(neu) {
      if (neu) {
        this.name = '';
      } else {
        this.name = this?.currentBackupResource?.attachVM;
      }
    },
  },

  methods: {
    async saveRestore(buttonCb) {
      this.update();

      const proxyResource = await this.$store.dispatch('cluster/create', this.restoreResource);

      try {
        await proxyResource.save();
        buttonCb(true);

        this.$router.push({
          name:   this.doneRoute,
          params: { resource: HCI.VM }
        });
      } catch (err) {
        this.errors = exceptionToErrorsArray(err) || err;
        buttonCb(false);
      }
    },

    update() {
      this.restoreResource.metadata.generateName = `restore-${ this.backupName }-`;
      if (this.name) {
        this.restoreResource.spec.target.name = this.name;
      }

      if (this.restoreNewVm) {
        delete this.restoreResource.spec.deletionPolicy;
        this.restoreResource.spec.newVM = true;
      } else {
        this.restoreResource.spec.deletionPolicy = this.deletionPolicy;
        delete this.restoreResource.spec.newVM;
      }
    }
  },

  componentTitle() {
    return 'restoreVM';
  }
};
</script>

<template>
  <div id="restore">
    <div class="mb-20">
      <RadioGroup
        v-model="restoreNewVm"
        name="model"
        :options="[true,false]"
        :labels="[t('harvester.backup.restore.createNew'), t('harvester.backup.restore.replaceExisting')]"
        :disabled="disableExisting"
        :mode="mode"
      />
    </div>

    <LabeledInput
      v-model="name"
      :disabled="!restoreNewVm"
      :label="t('harvester.backup.restore.virtualMachineName')"
      :placeholder="t('nameNsDescription.name.placeholder')"
      class="mb-20"
    />

    <LabeledSelect v-model="backupName" class="mb-20" :label="t('harvester.backup.restore.backup')" :options="backupOption" />

    <LabeledSelect v-if="!restoreNewVm" v-model="deletionPolicy" :label="t('harvester.backup.restore.deletePreviousVolumes')" :options="deletionPolicyOption" />

    <Footer mode="create" :errors="errors" @save="saveRestore" @done="done" />
  </div>
</template>

<style lang="scss">
#restore {
  .radio-group {
    display: flex;
    .radio-container {
      margin-right: 30px;
    }
  }
}
</style>
