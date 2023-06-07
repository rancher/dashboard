<script>
import Wizard from '@shell/components/Wizard.vue';
import { SETTING } from '@shell/config/settings';
import { MANAGEMENT } from '@shell/config/types';
import { REPO_TYPE, REPO, CHART } from '@shell/config/query-params';
import { BLANK_CLUSTER } from '@shell/store';

import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import { Banner } from '@components/Banner';

const URL_DOMAIN_REG = /[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+\.?/;
const URL_REG = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/;

export default {
  props: {
    k8sAuditLog: {
      type:     Boolean,
      required: false,
      default:  false,
    },
    auditLogCollector: {
      type:     Object,
      default:  null,
      required: false
    },
    clusterId: {
      type:    String,
      default: BLANK_CLUSTER
    },
    auditLogSetting: {
      type:     Object,
      required: true
    }
  },
  data() {
    const steps = [];
    const url = this.auditLogSetting?.value ?? '';

    if (!url) {
      steps.push(
        {
          name:    'deploymentComponents',
          label:   this.t('auditLog.installView.steps.deploymentCompoents.label'),
          subtext: this.t('auditLog.installView.steps.deploymentCompoents.label'),
          ready:   false,
        }
      );
    }

    if (this.k8sAuditLog && !this.auditLogCollector) {
      steps.push({
        name:    'installAuditLogCollector',
        label:   this.t('auditLog.installView.steps.installAuditLogCollector.label'),
        subtext: this.t('auditLog.installView.steps.installAuditLogCollector.label'),
        ready:   false,
      });
    }

    return {
      steps,
      errors: [],
      url,
    };
  },
  computed: {
    hasAuditlogCollector() {
      return this.app?.spec?.chart?.metadata?.name === 'rancher-k8s-auditlog-collector';
    },
    needInstallCollector() {
      return this.app && !this.hasAuditlogCollector;
    }
  },
  methods: {
    async saveAuditLogSetting() {
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
      await Promise.all([whitelistSetting.save(), auditLogSetting.save()]);
    },
    async finish(btnCb) {
      try {
        await this.saveAuditLogSetting();
        btnCb(true);
        // this.reload();
        // this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.AUDIT_LOG_SERVER_URL }, { force: true })
      } catch (err) {
        this.errors = [err];
        btnCb(false);
      }
    },
    async chartRoute() {
      if (this.steps.find(s => s.name === 'deploymentComponents')) {
        try {
          await this.saveAuditLogSetting();
        } catch (err) {
          this.errors = [err];

          return;
        }
      }
      this.$router.push({
        name:   'c-cluster-apps-charts-install',
        params: { cluster: this.clusterId === BLANK_CLUSTER ? 'local' : this.clusterId },
        query:  {
          [REPO_TYPE]: 'cluster',
          [REPO]:      'pandaria-catalog',
          [CHART]:     'rancher-k8s-auditlog-collector',
        },
      });
    },

    reload() {
      this.$router.go();
    }
  },
  watch: {
    url: {
      immediate: true,
      handler(v) {
        if (!URL_REG.test(v?.trim())) {
          this.errors = [this.t('validation.invalid', { key: SETTING.AUDIT_LOG_SERVER_URL }, true)];
        } else {
          this.errors = [];
          const step = this.steps.find(s => s.name === 'deploymentComponents');

          if (step) {
            step.ready = true;
          }
        }
      }
    },
    auditLogSetting: {
      immediate: true,
      handler(v) {
        if (v) {
          this.url = v.value;
        }
      }
    }
  },
  components: {
    Wizard, LabeledInput, Banner
  }
};
</script>
<template>
  <div class="install-view">
    <Wizard
      :steps="steps"
      :banner-title="t('auditLog.title')"
      :banner-title-subtext="t('auditLog.installView.steps.deploymentCompoents.label')"
      :edit-first-step="true"
      :errors="errors"
      banner-image="/_nuxt/shell/assets/images/generic-catalog.svg"
      header-mode="create"
      finish-mode="done"
      @finish="finish"
    >
      <template #cancel>
        <div />
      </template>
      <template #deploymentComponents>
        <div class="mb-20">
          <Banner
            color="info"
          >
            <div v-clean-html="t('auditLog.installView.steps.deploymentCompoents.tips', {}, true)" />
          </Banner>
          <Banner
            color="info"
          >
            <div v-clean-html="t('auditLog.installView.steps.deploymentCompoents.address.tips')" />
          </Banner>
          <LabeledInput
            v-model="url"
            :localized-label="true"
            :required="true"
            :label="t('auditLog.installView.steps.deploymentCompoents.address.label')"
          />
        </div>
      </template>
      <template #installAuditLogCollector>
        <div class="mb-20">
          <Banner
            color="info"
          >
            <div v-clean-html="t('auditLog.installView.steps.installAuditLogCollector.endpointTips')" />
          </Banner>
          <Banner
            color="info"
          >
            <div v-clean-html="t('auditLog.installView.steps.installAuditLogCollector.deploymentTips')" />
          </Banner>
          <div class="flex justify-center">
            <button
              class="btn role-primary mt-20"
              @click.prevent="chartRoute"
            >
              {{ t("auditLog.installView.steps.installAuditLogCollector.label") }}
            </button>
          </div>
        </div>
      </template>
      <template
        v-if="needInstallCollector"
        #finish
      >
        <div />
      </template>
    </Wizard>
  </div>
</template>
<style scoped>
.flex {
  display: flex;
}
.justify-center {
  justify-content: center;
}
::v-deep .controls-row {
  position: relative;
}
</style>
