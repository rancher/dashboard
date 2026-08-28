<script setup lang="ts">
import { useStore } from 'vuex';
import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading.vue';
import Masthead from '@shell/components/ResourceList/Masthead.vue';
import SubtleLink from '@shell/components/SubtleLink.vue';
import { useI18n } from '@shell/composables/useI18n';
import { CERT_MANAGER } from '../../types';
import { useCertManagerOverview, CERT_MANAGER_DOCS } from './composable';
import CertificatesSection from './CertificatesSection.vue';
import CardsSection from './CardsSection.vue';

const { t } = useI18n(useStore());

const {
  loading,
  fetchError,
  hasContent,
  hasCertificates,
  subtitle,
  certificateSummary,
  expiringSoon,
  issuerCards,
  acmeCards,
  showAcmeSection,
  showIssuersSection,
  createRoute,
  resetNamespaceFilter,
} = useCertManagerOverview();
</script>

<template>
  <Loading v-if="loading" />

  <div
    v-else
    class="cert-manager-overview"
  >
    <Banner
      v-if="fetchError"
      color="error"
    >
      {{ fetchError }}
    </Banner>

    <!-- ━━━ Empty state: nothing to work with yet ━━━ -->
    <div
      v-if="!hasContent"
      class="empty-state"
      data-testid="cert-manager-overview-empty"
    >
      <h1 class="mm-0">
        {{ t('certManager.overview.empty.title') }}
      </h1>
      <p class="empty-message">
        {{ t('certManager.overview.empty.message') }}
      </p>
      <div class="empty-actions">
        <router-link
          class="btn role-primary"
          :to="createRoute(CERT_MANAGER.ISSUER)"
        >
          {{ t('certManager.overview.empty.createIssuer') }}
        </router-link>
        <router-link
          class="btn role-secondary"
          :to="createRoute(CERT_MANAGER.CLUSTER_ISSUER)"
        >
          {{ t('certManager.overview.empty.createClusterIssuer') }}
        </router-link>
      </div>
      <SubtleLink
        :href="CERT_MANAGER_DOCS"
        target="_blank"
        :open-in-new-tab-label="t('generic.opensInNewTab')"
      >
        {{ t('certManager.overview.empty.docsLink') }}
      </SubtleLink>
    </div>

    <template v-else>
      <Masthead
        :resource="CERT_MANAGER.CERTIFICATE"
        :type-display="t('certManager.overview.title')"
        :is-creatable="false"
        :show-favorite="false"
        component-testid="cert-manager-overview"
      >
        <template #subHeader>
          <div
            class="text-muted mmt-1"
            data-testid="cert-manager-overview-subtitle"
          >
            {{ subtitle }}
          </div>
        </template>
      </Masthead>

      <div class="overview-content">
        <CertificatesSection
          :summary="certificateSummary"
          :expiring-soon="expiringSoon"
          :has-certificates="hasCertificates"
          :create-route="createRoute(CERT_MANAGER.CERTIFICATE)"
          :reset-namespace-filter="resetNamespaceFilter"
        />

        <CardsSection
          v-if="showIssuersSection"
          :title="t('certManager.overview.sections.issuers')"
          :cards="issuerCards"
          testid="cert-manager-overview-issuers"
        />

        <CardsSection
          v-if="showAcmeSection"
          :title="t('certManager.overview.sections.acme')"
          :cards="acmeCards"
          testid="cert-manager-overview-acme"
        />
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.cert-manager-overview {
  display: flex;
  flex-direction: column;

  .overview-content {
    display: flex;
    flex-direction: column;
    gap: var(--gap-lg);
  }

  .empty-state {
    text-align: center;
    padding: 72px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--gap-md);

    h1 {
      line-height: 38px;
    }

    .empty-message {
      font-size: 16px;
      line-height: 29px;
      max-width: 620px;
      margin: 0;
    }

    .empty-actions {
      display: flex;
      gap: 12px;
    }
  }
}
</style>
