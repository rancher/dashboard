<script lang="ts">
import { defineComponent, inject } from 'vue';
import { mapGetters } from 'vuex';

export default defineComponent({
  name: 'Accordion',

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
    }
  },

  data() {
    return {
      isOpen:    this.openInitially,
      updateToc: inject('updateToc') as Function
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    displayTitle() {
      return this.titleKey ? this.t(this.titleKey) : this.title;
    },
  },

  mounted() {
    this.updateToc();
  },

  beforeUnmount() {
    this.updateToc();
  },

  methods: {
    toggle() {
      this.isOpen = !this.isOpen;
    },

    scrollTo() {
      this.isOpen = true;

      this.$nextTick(() => {
        const el = this.$el as HTMLElement;

        el.scrollIntoView(true);
      });
    }
  },
});
</script>

<template>
  <div
    class="accordion-container"
  >
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
          {{ displayTitle }}
        </h2>
      </slot>
    </div>
    <div
      v-show="isOpen"
      class="accordion-body"
      data-testid="accordion-body"
    >
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.accordion-container {
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
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
