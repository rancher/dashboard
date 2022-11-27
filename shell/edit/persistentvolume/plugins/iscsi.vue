<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';
import ArrayList from '@shell/components/form/ArrayList';

export default {
  components: {
    ArrayList, LabeledInput, RadioGroup
  },
  props: {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:     String,
      required: true,
    },
  },
  data() {
    const yesNoOptions = [
      {
        label: this.t('generic.yes'),
        value: true
      },
      {
        label: this.t('generic.no'),
        value: false
      }
    ];

    this.$set(this.value.spec, 'iscsi', this.value.spec.iscsi || {});
    this.$set(this.value.spec.iscsi, 'readOnly', this.value.spec.iscsi.readOnly || false);
    this.$set(this.value.spec.iscsi, 'secretRef', this.value.spec.iscsi.secretRef || {});
    this.$set(this.value.spec.iscsi, 'chapAuthDiscovery', this.value.spec.iscsi.chapAuthDiscovery || false);
    this.$set(this.value.spec.iscsi, 'chapAuthSession', this.value.spec.iscsi.chapAuthSession || false);

    return { yesNoOptions };
  },
  computed: {
    lun: {
      get() {
        return this.value.spec.iscsi.lun;
      },
      set(value) {
        this.$set(this.value.spec.iscsi, 'lun', Number.parseInt(value, 10));
      }
    },
  }
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.iscsi.initiatorName"
          :mode="mode"
          :label="t('persistentVolume.iscsi.initiatorName.label')"
          :placeholder="t('persistentVolume.iscsi.initiatorName.placeholder')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.iscsi.iscsiInterface"
          :mode="mode"
          :label="t('persistentVolume.iscsi.iscsiInterface.label')"
          :placeholder="t('persistentVolume.iscsi.iscsiInterface.placeholder')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <RadioGroup
          v-model="value.spec.iscsi.chapAuthDiscovery"
          name="chap-auth-discovery"
          :mode="mode"
          :label="t('persistentVolume.iscsi.chapAuthDiscovery.label')"
          :options="yesNoOptions"
          :row="true"
        />
      </div>
      <div class="col span-6">
        <RadioGroup
          v-model="value.spec.iscsi.chapAuthSession"
          name="chap-auth-session"
          :mode="mode"
          :label="t('persistentVolume.iscsi.chapAuthSession.label')"
          :options="yesNoOptions"
          :row="true"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.iscsi.iqn"
          :mode="mode"
          :label="t('persistentVolume.iscsi.iqn.label')"
          :placeholder="t('persistentVolume.iscsi.iqn.placeholder')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="lun"
          :mode="mode"
          :label="t('persistentVolume.iscsi.lun.label')"
          :placeholder="t('persistentVolume.iscsi.lun.placeholder')"
          type="number"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.iscsi.targetPortal"
          :mode="mode"
          :label="t('persistentVolume.iscsi.targetPortal.label')"
          :placeholder="t('persistentVolume.iscsi.targetPortal.placeholder')"
        />
      </div>
      <div class="col span-6">
        <ArrayList
          v-model="value.spec.iscsi.portals"
          :mode="mode"
          :add-label="t('persistentVolume.iscsi.portals.add')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.iscsi.secretRef.name"
          :mode="mode"
          :label="t('persistentVolume.shared.secretName.label')"
          :placeholder="t('persistentVolume.shared.secretName.placeholder')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.iscsi.secretRef.namespace"
          :mode="mode"
          :label="t('persistentVolume.shared.secretNamespace.label')"
          :placeholder="t('persistentVolume.shared.secretNamespace.placeholder')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.iscsi.fsType"
          :mode="mode"
          :label="t('persistentVolume.shared.filesystemType.label')"
          :placeholder="t('persistentVolume.shared.filesystemType.placeholder')"
        />
      </div>
      <div class="col span-6">
        <RadioGroup
          v-model="value.spec.iscsi.readOnly"
          name="readOnly"
          :mode="mode"
          :label="t('persistentVolume.shared.readOnly.label')"
          :options="yesNoOptions"
          :row="true"
        />
      </div>
    </div>
  </div>
</template>
