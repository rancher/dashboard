<script>
import LabeledInput from "@/components/form/LabeledInput";
import LabeledSelect from "@/components/form/LabeledSelect";
export default {
  components: { LabeledInput, LabeledSelect },
  props: {
    value: {
      type: Object,
      default: () => {
        return {};
      },
    },
    certs: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    const defaultCert = {
      label: this.t("ingress.certificates.defaultCertLabel"),
      value: null,
    };
    const { hosts = [""], secretName = defaultCert.value } = this.value;

    return {
      defaultCert,
      hosts,
      secretName,
    };
  },
  computed: {
    certsWithDefault() {
      return [this.defaultCert, ...this.certs];
    },
  },
  methods: {
    addHost(ev) {
      ev.preventDefault();
      this.hosts.push("");
      this.update();
    },
    remove(ev, idx) {
      ev.preventDefault();
      this.hosts.splice(idx, 1);
      this.update();
    },
    update() {
      const out = { hosts: this.hosts };

      if (this.secretName !== this.defaultCert) {
        out.secretName = this.secretName;
      }
      this.$emit("input", out);
    },
  },
};
</script>

<template>
  <div class="cert" @input="update">
    <div class="row">
      <div class="col span-6">
        <LabeledSelect
          :value="secretName"
          :options="certsWithDefault"
          :label="t('ingress.certificates.certificate.label')"
          required
          @input="
            (e) => {
              secretName = e;
              update();
            }
          "
        />
      </div>
      <div class="col span-5">
        <div v-for="(host, i) in hosts" :key="i" class="row mb-10">
          <div :style="{ 'margin-right': '0px' }" class="col span-12">
            <LabeledInput
              :value="host"
              :label="t('ingress.certificates.host.label')"
              :placeholder="t('ingress.certificates.host.placeholder')"
              @input="(e) => $set(hosts, i, e)"
            />
          </div>
          <button
            class="btn btn-sm role-link col"
            @click="(e) => remove(e, i)"
            style="line-height: 40px;"
          >
            {{ t("ingress.certificates.removeHost") }}
          </button>
        </div>
        <button
          :style="{ padding: '0px 0px 0px 5px' }"
          class="bn btn-sm role-link"
          @click="addHost"
        >
          {{ t("ingress.certificates.addHost") }}
        </button>
      </div>
      <div class="col span-1">
        <button class="btn role-link close" @click="$emit('remove')">
          <i class="icon icon-2x icon-x" />
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.close {
  float: right;
  padding: 0px;
  position: relative;
  top: -10px;
  right: -10px;
}
.cert:not(:last-of-type) {
  padding-bottom: 10px;
  margin-bottom: 30px;
  border-bottom: 1px solid var(--border);
}
</style>
