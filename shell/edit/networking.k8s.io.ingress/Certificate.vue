<script>
import LabeledSelect from '@shell/components/form/LabeledSelect';
import ArrayList from '@shell/components/form/ArrayList';

const DEFAULT_CERT_VALUE = '__[[DEFAULT_CERT]]__';

export default {
  emits: ['update:value'],

  components: { ArrayList, LabeledSelect },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      },
    },
    certs: {
      type:    Array,
      default: () => [],
    },
    rules: {
      default: () => ({ host: [] }),
      type:    Object,
    }
  },
  data() {
    return {
      hosts:      this.value?.hosts ?? [''],
      secretName: this.value?.secretName === undefined ? DEFAULT_CERT_VALUE : this.value?.secretName,
      secretVal:  this.value?.secretName ?? DEFAULT_CERT_VALUE,
    };
  },
  watch: {
    value(newVal) {
      this.hosts = newVal.hosts;
      this.secretName = newVal.secretName;
      this.secretVal = this.secretName === null ? DEFAULT_CERT_VALUE : this.secretName;
    },
  },
  computed: {
    certsWithDefault() {
      const defaultCert = {
        label: this.t('ingress.certificates.defaultCertLabel'),
        value: DEFAULT_CERT_VALUE,
      };

      return [defaultCert, ...this.certs.map((c) => ({ label: c, value: c }))];
    },
    certificateStatus() {
      const isValueAnOption = !this.secretName || this.certsWithDefault.find((cert) => this.secretName === cert.value);

      return isValueAnOption ? null : 'warning';
    },
    certificateTooltip() {
      return this.certificateStatus === 'warning' ? this.t('ingress.certificates.certificate.doesntExist') : null;
    },
  },
  methods: {
    update() {
      const out = { hosts: this.hosts };

      out.secretName = this.secretVal;

      if (out.secretName === DEFAULT_CERT_VALUE) {
        out.secretName = null;
      }

      this.$emit('update:value', out);
    },
    onSecretInput(e) {
      this.secretVal = e && typeof e === 'object' ? e.label : e;
      this.update();
    },
    onHostsInput(e) {
      this.hosts = e;
      this.update();
    }
  },
};
</script>

<template>
  <div class="cert row">
    <div class="col span-6">
      <LabeledSelect
        v-model:value="secretVal"
        class="secret-name"
        :options="certsWithDefault"
        :label="t('ingress.certificates.certificate.label')"
        required
        :status="certificateStatus"
        :taggable="true"
        :tooltip="certificateTooltip"
        :hover-tooltip="true"
        :searchable="true"
        @update:value="onSecretInput"
      />
    </div>
    <div class="col span-6">
      <ArrayList
        :value="hosts"
        :add-label="t('ingress.certificates.addHost')"
        :rules="rules.host"
        :initial-empty-row="true"
        @update:value="onHostsInput"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.close {
  top: 10px;
  right: 10px;
  padding:0;
  position: absolute;
}

.cert {
  position: relative;

  .secret-name {
    height: $input-height;
  }

  &:not(:last-of-type) {
    padding-bottom: 10px;
    margin-bottom: 30px;
  }
}
</style>
