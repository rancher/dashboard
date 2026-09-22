<script>
import Markdown from '@shell/components/Markdown.vue';

// TEXT — "Markdown for runbooks and contacts".
//
// Rendered through Rancher's own Markdown component, so a note here behaves exactly like every
// other piece of markdown in the product (same renderer, same external-link handling) instead of
// this extension growing its own.
export default {
  name:       'WidgetText',
  components: { Markdown },

  props: {
    widget: {
      type:     Object,
      required: true,
    },
  },

  computed: {
    body() {
      return `${ this.widget.body || '' }`.trim();
    },
  },
};
</script>

<template>
  <div class="wtext">
    <h3
      v-if="widget.title"
      class="wtext__title"
    >
      {{ widget.title }}
    </h3>
    <Markdown
      v-if="body"
      :value="body"
    />
    <p
      v-else
      class="wtext__empty"
    >
      Nothing written yet — open this widget's settings to write something.
    </p>
  </div>
</template>

<style lang="scss" scoped>
.wtext {
  background:    var(--simple-box-bg, var(--body-bg));
  border:        1px solid var(--border);
  border-radius: 4px;
  box-sizing:    border-box;
  font-size:     14px;
  height:        100%;
  overflow:      auto;
  padding:       var(--wcard-solo-pad, 16px);

  &__title {
    font-size:   18px;
    font-weight: 600;
    margin:      0 0 16px;
  }

  &__empty {
    color:  var(--muted);
    margin: 0;
  }

  // The markdown body owns the rest of the card; keep its first/last block flush with the padding.
  :deep(> div > :first-child) {
    margin-top: 0;
  }

  :deep(> div > :last-child) {
    margin-bottom: 0;
  }
}
</style>
