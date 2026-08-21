<script setup lang="ts">
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { BadgeState } from '@components/BadgeState';
import SubtleLink from '@shell/components/SubtleLink.vue';

export interface IssuanceStage {
  labelKey: string;
  resource: any;
}

/**
 * Certificate -> CertificateRequest -> Order -> Challenge, as a stepper.
 *
 * The stage that is actually stuck is rarely the certificate: it reports a bland "not ready" while
 * the real reason sits further down the chain. Showing the chain makes that visible without the
 * user having to know the resources exist.
 */
defineProps<{ stages: IssuanceStage[] }>();

const { t } = useI18n(useStore());

/** Static throughout: a spinner on some steps and not others reads as a rendering glitch. */
function iconFor(resource: any): string {
  switch (resource.stateSimpleColor) {
  case 'success': return 'icon-checkmark';
  case 'error': return 'icon-error';
  case 'warning': return 'icon-warning';
  default: return 'icon-dot-open';
  }
}
</script>

<template>
  <div
    class="issuance-progress"
    data-testid="cert-manager-issuance-progress"
  >
    <h3 class="title">
      {{ t('certManager.issuance.title') }}
    </h3>

    <ol class="stages">
      <li
        v-for="(stage, i) in stages"
        :key="stage.labelKey"
        class="stage"
        :data-testid="`cert-manager-issuance-stage-${ i }`"
      >
        <span
          v-if="i > 0"
          class="connector"
          :class="`connector--${ stages[i - 1].resource.stateSimpleColor }`"
          aria-hidden="true"
        />
        <span class="step">
          <span
            class="marker"
            :class="`marker--${ stage.resource.stateSimpleColor }`"
          >
            <i
              class="icon"
              :class="iconFor(stage.resource)"
            />
          </span>
          <span class="detail">
            <SubtleLink :to="stage.resource.detailLocation">{{ t(stage.labelKey) }}</SubtleLink>
            <BadgeState :value="stage.resource" />
          </span>
        </span>
      </li>
    </ol>
  </div>
</template>

<style lang="scss" scoped>
// Matches the shell's detail cards, which carry a border and no background of their own
.issuance-progress {
  border: 1px solid var(--border);
  border-radius: var(--border-radius-md);
  margin-bottom: 20px;
  padding: 16px;

  .title {
    margin-bottom: 20px;
  }

  .stages {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    list-style: none;
    margin: 0;
    padding: 0;
    row-gap: var(--gap-md);
  }

  // Steps hug their content and the connectors are a fixed length. Letting either grow spreads a
  // short chain across the full page width, which reads as a gap rather than a connection.
  .stage {
    align-items: center;
    display: flex;
    flex: 0 0 auto;
  }

  .step {
    align-items: center;
    display: flex;
    gap: var(--gap-md);
    white-space: nowrap;
  }

  .connector {
    background: var(--border);
    flex: 0 0 48px;
    height: 2px;
    margin: 0 16px;

    @each $color in (error, warning, info, success) {
      &--#{$color} {
        background: var(--#{$color});
      }
    }
  }

  .marker {
    align-items: center;
    background: var(--disabled-bg);
    border-radius: 50%;
    color: var(--body-bg);
    display: inline-flex;
    flex: 0 0 auto;
    height: 32px;
    justify-content: center;
    width: 32px;

    @each $color in (error, warning, info, success) {
      &--#{$color} {
        background: var(--#{$color});
      }
    }
  }

  .detail {
    // Shrink each child to its own content, so the state pill sizes to its label rather than
    // stretching to match a wider link above it.
    align-items: flex-start;
    display: flex;
    flex-direction: column;
    gap: var(--gap);
  }
}
</style>
