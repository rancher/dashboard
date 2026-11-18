<script setup lang="ts">
import { useStore } from 'vuex';
import RichTranslation from '@shell/components/RichTranslation.vue';
import { RcIcon } from '@components/RcIcon';
import { useI18n } from '@shell/composables/useI18n';
import { getGitRepoRestrictionMigrationDocsUrl } from '@shell/utils/fleet-docs';

const store = useStore();
const { t } = useI18n(store);

const migrationGuideUrl = getGitRepoRestrictionMigrationDocsUrl();
</script>

<template>
  <RichTranslation
    k="fleet.restrictions.migrationGuide"
    tag="div"
  >
    <template #docsLink="{ content }">
      <a
        :href="migrationGuideUrl"
        target="_blank"
        rel="noopener noreferrer nofollow"
        data-testid="fleet-migration-guide-link"
      >
        {{ content }}
        <RcIcon
          type="external-link"
          size="small"
          :aria-hidden="true"
        /><span class="sr-only">{{ t('generic.opensInNewTab') }}</span>
      </a>
    </template>
  </RichTranslation>
</template>
