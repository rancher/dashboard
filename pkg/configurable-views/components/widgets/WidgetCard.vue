<script setup lang="ts">
// The box a widget sits in: a bordered card with a title, an optional count beside it, and the
// widget's own content below - so a Table reads as the same kind of thing as the widgets around it.
// The cluster widgets draw the dashboard's own boxes instead, and use this one only to say what they
// are missing.
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

withDefaults(defineProps<{
  title?: string;
  /** A small pill beside the title (the "42" next to Clusters). null hides it. */
  count?: number | string | null;
  loading?: boolean;
  error?: string;
  /** An empty widget says so rather than drawing a blank card. */
  empty?: boolean;
  emptyText?: string;
}>(), {
  title:     '',
  count:     null,
  loading:   false,
  error:     '',
  empty:     false,
  emptyText: '',
});

const store = useStore();
const { t } = useI18n(store);
</script>

<template>
  <div class="wcard">
    <header
      v-if="title || count !== null"
      class="wcard__head"
    >
      <h3 class="wcard__title">
        {{ title }}
      </h3>
      <span
        v-if="count !== null"
        class="wcard__count"
      >{{ count }}</span>
    </header>

    <div class="wcard__body">
      <p
        v-if="error"
        class="wcard__msg wcard__msg--error"
      >
        {{ error }}
      </p>
      <p
        v-else-if="loading"
        v-clean-html="t('generic.loading', {}, true)"
        class="wcard__msg"
      />
      <p
        v-else-if="empty"
        class="wcard__msg"
      >
        {{ emptyText || t('configurableViews.widget.nothingToShow') }}
      </p>
      <slot v-else />
    </div>
  </div>
</template>

<style lang="scss" scoped>
// Straight from the design: a 1px border at radius 4, a 56px header (12px above and below a
// 32px title block) and a 16px content inset with no extra gap under the header.
.wcard {
  background:     var(--simple-box-bg, var(--body-bg));
  border:         1px solid var(--border);
  border-radius:  4px;
  box-sizing:     border-box;
  display:        flex;
  flex-direction: column;
  height:         100%;
  min-height:     0;
  overflow:       hidden;

  // The insets come from the widget's own spacing (see WidgetNode), falling back to the design's
  // card when this is used outside one.
  &__head {
    align-items: center;
    box-sizing:  border-box;
    display:     flex;
    flex:        0 0 auto;
    gap:         10px;
    min-height:  var(--wcard-head-min, 56px);
    padding:     var(--wcard-head-pad, 12px 16px);
  }

  &__title {
    font-size:   18px;
    font-weight: 600;
    line-height: 22px;
    margin:      0;
  }

  &__count {
    background:    var(--default);
    border-radius: 10px;
    color:         var(--body-text);
    font-size:     12px;
    line-height:   1;
    padding:       4px 8px;
  }

  &__body {
    flex:       1 1 auto;
    font-size:  14px;
    min-height: 0;
    overflow:   auto;
    padding:    var(--wcard-body-pad, 0 16px 16px);
  }

  // A card with no heading (the banner, a bare links box) still owes its content the same inset.
  &__body:first-child {
    padding: var(--wcard-solo-pad, 16px);
  }

  &__msg {
    color:     var(--muted);
    font-size: 14px;
    margin:    0;

    &--error {
      color: var(--error);
    }
  }
}
</style>
