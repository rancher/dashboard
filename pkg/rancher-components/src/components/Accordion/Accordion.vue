<script lang="ts">
import { defineComponent } from 'vue';
import { mapGetters } from 'vuex';

export default defineComponent({
  props: {
    title: {
      type:    String,
      default: ''
    },

    titleKey: {
      type:    String,
      default: null
    },

    openInitially: {
      type:    Boolean,
      default: false
    },

    /**
     * When true, the accordion body uses v-if instead of v-show.
     * This defers mounting of the content until the accordion is opened,
     * which is useful for components that need correct dimensions on mount (e.g. code editors).
     */
    lazyMount: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return { isOpen: this.openInitially };
  },

  computed: { ...mapGetters({ t: 'i18n/t' }) },

  methods: {
    toggle() {
      this.isOpen = !this.isOpen;
    }
  }
});
</script>

<template>
  <div class="accordion-container">
    <div
      class="accordion-header"
      data-testid="accordion-header"
      @click="toggle"
    >
      <i
        class="icon text-primary"
        :class="{'icon-chevron-down':isOpen, 'icon-chevron-up':!isOpen}"
        data-testid="accordion-chevron"
      />
      <slot name="header">
        <h2
          data-testid="accordion-title-slot-content"
          class="mb-0"
        >
          {{ titleKey ? t(titleKey) : title }}
        </h2>
      </slot>
    </div>
    <div
      v-if="lazyMount ? isOpen : true"
      v-show="lazyMount ? true : isOpen"
      class="accordion-body"
      data-testid="accordion-body"
    >
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.accordion-container {
  border: 1px solid var(--border)
}
.accordion-header {
  padding: 16px 16px 16px 11px;
  display: flex;
  align-items: center;
  &>*{
    padding: 5px 0px 5px 0px;
  }
  I {
    margin: 0px 10px 0px 10px;
  }
}
.accordion-body {
  padding: 0px 16px 16px;
}
</style>
