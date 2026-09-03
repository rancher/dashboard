<script setup lang="ts">
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { BadgeState } from '@components/BadgeState';
import SubtleLink from '@shell/components/SubtleLink.vue';
import Card from '@shell/components/Resource/Detail/Card/index.vue';

export interface IssuanceStage {
  labelKey: string;
  resource: any;
}

/**
 * A detail-page card listing the stages of the current issuance - Certificate ->
 * CertificateRequest -> Order -> Challenge - each with its own state. Only the stages that apply
 * are passed in (see the model's `issuanceStages`): a self-signed certificate has no Order or
 * Challenge, so those rows never appear.
 *
 * The stage that is actually stuck is rarely the certificate: it reports a bland "not ready" while
 * the real reason sits further down the chain. Listing the chain makes that visible without the
 * user having to know the resources exist.
 */
defineProps<{ title: string; stages: IssuanceStage[] }>();

const { t } = useI18n(useStore());

/**
 * A stage is "settled" once it has reached a state that is not going to change on its own -
 * issued, failed or expiring. Those get a coloured status icon and a link to the resource. The
 * remaining stages are still working (or waiting on an earlier one), so they show a spinner and,
 * having nothing meaningful to show yet, are plain text rather than links.
 */
function isSettled(resource: any): boolean {
  return ['success', 'error', 'warning'].includes(resource.stateSimpleColor);
}

/** The icon classes for a stage - a coloured status marker once settled, a spinner while it works. */
function iconFor(resource: any): string[] {
  switch (resource.stateSimpleColor) {
  case 'success': return ['icon-checkmark', 'state-icon--success'];
  case 'error': return ['icon-error', 'state-icon--error'];
  case 'warning': return ['icon-warning', 'state-icon--warning'];
  default: return ['icon-spinner', 'icon-spin'];
  }
}
</script>

<template>
  <Card
    :title="title"
    data-testid="cert-manager-issuance-status-card"
  >
    <ul class="stages">
      <li
        v-for="(stage, i) in stages"
        :key="stage.labelKey"
        class="stage"
        :data-testid="`cert-manager-issuance-stage-${ i }`"
      >
        <i
          class="icon state-icon"
          :class="iconFor(stage.resource)"
          aria-hidden="true"
        />
        <SubtleLink
          v-if="isSettled(stage.resource)"
          class="label"
          :to="stage.resource.detailLocation"
        >
          {{ t(stage.labelKey) }}
        </SubtleLink>
        <span
          v-else
          class="label"
        >{{ t(stage.labelKey) }}</span>
        <span class="badge-wrap">
          <BadgeState :value="stage.resource" />
        </span>
      </li>
    </ul>
  </Card>
</template>

<style lang="scss" scoped>
.stages {
  display: flex;
  flex-direction: column;
  gap: var(--gap);
  list-style: none;
  margin: 0;
  padding: 0;
}

.stage {
  align-items: center;
  display: flex;
  gap: var(--gap-md);
  line-height: 24px;

  .state-icon {
    flex: 0 0 auto;
    // The spinner on still-working stages has no colour of its own; keep it muted so the settled
    // stages stand out.
    color: var(--muted);

    @each $color in (error, warning, success) {
      &--#{$color} {
        color: var(--#{$color});
      }
    }
  }

  // Let the link take the slack so the state badge sits flush to the right edge of the card.
  .label {
    flex-grow: 1;
  }

  .badge-wrap {
    line-height: 1.15;
    font-size: 12px;
  }
}
</style>
