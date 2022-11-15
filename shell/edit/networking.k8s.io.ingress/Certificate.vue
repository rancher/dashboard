<script>
import LabeledSelect from '@shell/components/form/LabeledSelect';
import ArrayList from '@shell/components/form/ArrayList';

const DEFAULT_CERT_VALUE = '__[[DEFAULT_CERT]]__';

export default {
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
    const defaultCert = {
      label: this.t('ingress.certificates.defaultCertLabel'),
      value: DEFAULT_CERT_VALUE,
    };
    const { hosts = [''], secretName = defaultCert.value } = this.value;

    return {
      defaultCert,
      hosts,
      secretName,
    };
  },
  computed: {
    certsWithDefault() {
      return [this.defaultCert, ...this.certs.map(c => ({ label: c, value: c }))];
    },
    certificateStatus() {
      const isValueAnOption = !this.secretName || this.certsWithDefault.find(cert => this.secretName === cert.value);

      return isValueAnOption ? null : 'warning';
    },
    certificateTooltip() {
      return this.certificateStatus === 'warning' ? this.t('ingress.certificates.certificate.doesntExist') : null;
    },
  },
  methods: {
    addHost(ev) {
      ev.preventDefault();
      this.hosts.push('');
      this.update();
    },
    update() {
      const out = { hosts: this.hosts };

      out.secretName = this.secretName;

      if (out.secretName === DEFAULT_CERT_VALUE) {
        out.secretName = null;
      }

      this.$emit('input', out);
    },
    onSecretInput(e) {
      this.secretName = e && typeof e === 'object' ? e.label : e;
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
  <div
    class="cert row"
    @input="update"
  >
    <div class="col span-6">
      <LabeledSelect
        v-model="secretName"
        class="secret-name"
        :options="certsWithDefault"
        :label="t('ingress.certificates.certificate.label')"
        required
        :status="certificateStatus"
        :taggable="true"
        :tooltip="certificateTooltip"
        :hover-tooltip="true"
        :searchable="true"
        @input="onSecretInput"
      />
    </div>
    <div class="col span-6">
      <ArrayList
        :value="hosts"
        :add-label="t('ingress.certificates.addHost')"
        :rules="rules.host"
        @input="onHostsInput"
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
