<script>
import Footer from '@/components/form/Footer';
import RadioGroup from '@/components/form/RadioGroup';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import CreateEditView from '@/mixins/create-edit-view';
import { allHash } from '@/utils/promise';
import { exceptionToErrorsArray } from '@/utils/error';
import { HCI, NAMESPACE } from '@/config/types';
import { sortBy } from '@/utils/sort';

const createObject = {
  apiVersion: 'harvesterhci.io/v1beta1',
  kind:       'VirtualMachineRestore',
  metadata:   { name: '', namespace: '' },
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
    LabeledSelect,
  },

  mixins: [CreateEditView],

  async fetch() {
    await allHash({
      backups:         this.$store.dispatch('virtual/findAll', { type: HCI.BACKUP }),
      vms:             this.$store.dispatch('virtual/findAll', { type: HCI.VM }),
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
      namespace:      ''
    };
  },

  computed: {
    backupOption() {
      const choices = this.$store.getters['virtual/all'](HCI.BACKUP);

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

      const backupList = this.$store.getters['virtual/all'](HCI.BACKUP);

      return backupList.find( O => O.name === name);
    },

    disableExisting() {
      return !this.currentBackupResource?.attachVmExisting;
    },

    backupNamespace() {
      const backupList = this.$store.getters['virtual/all'](HCI.BACKUP);

      return backupList.find( B => B.metadata.name === this.backupName)?.metadata?.namespace;
    },

    namespaces() {
      const inStore = this.$store.getters['currentStore'](NAMESPACE);
      const choices = this.$store.getters[`${ inStore }/all`](NAMESPACE);

      const out = sortBy(
        choices.map((obj) => {
          return {
            label: obj.nameDisplay,
            value: obj.id,
          };
        }),
        'label'
      );

      return out;
    },
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

    backupNamespace: {
      handler(neu) {
        this.namespace = neu;
      },
      immediate: true
    }
  },

  methods: {
    async saveRestore(buttonCb) {
      this.update();

      const proxyResource = await this.$store.dispatch('virtual/create', this.restoreResource);

      proxyResource.metadata.namespace = this.namespace;
      proxyResource.spec.virtualMachineBackupNamespace = this.backupNamespace;

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

    <div class="row">
      <div class="col span-6">
        <LabeledSelect
          v-model="namespace"
          :disabled="!restoreNewVm"
          :label="t('nameNsDescription.namespace.label')"
          :options="namespaces"
        />
      </div>

      <div class="col span-6">
        <LabeledInput
          v-model="name"
          :disabled="!restoreNewVm"
          :label="t('harvester.backup.restore.virtualMachineName')"
          :placeholder="t('nameNsDescription.name.placeholder')"
          class="mb-20"
        />
      </div>
    </div>

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
