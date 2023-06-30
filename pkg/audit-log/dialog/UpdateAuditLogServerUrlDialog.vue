<script>
import { Card } from '@components/Card';
import { SETTING } from '@shell/config/settings';
import { MANAGEMENT } from '@shell/config/types';
import { Banner } from '@components/Banner';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';

const URL_DOMAIN_REG = /[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+\.?/;
const URL_REG = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/;

export default {
  data() {
    const auditLogSetting = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.AUDIT_LOG_SERVER_URL);

    return {
      auditLogSetting, url: auditLogSetting?.value ?? '', errors: [], loading: false
    };
  },
  methods: {
    close() {
      this.$emit('close');
    },
    async save() {
      if (!this.validate()) {
        this.errors = [this.t('validation.invalid', { key: SETTING.AUDIT_LOG_SERVER_URL }, true)];

        return;
      }
      this.loading = true;
      const url = this.url.trim();
      const [whitelistSetting, auditLogSetting] = await Promise.all([
        this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.WHITELIST_DOMAIN),
        this.$store.dispatch(`management/clone`, { resource: this.auditLogSetting })
      ]);
      const values = whitelistSetting?.value?.split(',') ?? [];
      const domain = URL_DOMAIN_REG.exec(url)?.[0] ?? url;

      values.push(domain);
      whitelistSetting.value = [...new Set(values)].filter(v => v).join(',');

      auditLogSetting.value = url;
      try {
        await Promise.all([whitelistSetting.save(), auditLogSetting.save()]);
        this.close();
      } catch (err) {
        this.errors = [err];
      }
      this.loading = false;
    },
    validate() {
      if (this.url?.trim() === '') {
        return true;
      }

      return URL_REG.test(this.url?.trim());
    }
  },
  components: {
    Card, LabeledInput, Banner
  }
};
</script>
<template>
  <Card
    class="view-audit-log-dialog"
    :show-highlight-border="false"
  >
    <h4
      slot="title"
      v-clean-html="t('auditLog.serverUrlDialog.title')"
      class="text-default-text"
    />
    <div
      slot="body"
      class="pl-10 pr-10"
    >
      <LabeledInput
        v-model="url"
        class="mb-10"
        :localized-label="true"
        :required="true"
        :label="t('auditLog.installView.steps.deploymentCompoents.address.label')"
      />

      <Banner
        v-for="(e, idx) in errors"
        :key="idx"
        color="error"
        :label="e"
      />
    </div>
    <div
      slot="actions"
      class="buttons"
    >
      <button
        class="btn role-primary mr-10"
        :disabled="loading"
        @click="save"
      >
        {{ t('generic.save') }}
      </button>
      <button
        class="btn role-secondary mr-10"
        @click="close"
      >
        {{ t('generic.cancel') }}
      </button>
    </div>
  </Card>
</template>

<style lang="scss" scoped>
.buttons {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}
.view-audit-log-dialog {
  &.card-container {
      box-shadow: none;
    }
}
</style>
