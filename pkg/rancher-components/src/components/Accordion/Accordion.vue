<script lang="ts">
import {
  computed, defineComponent, getCurrentInstance, nextTick, ref
} from 'vue';
import { mapGetters } from 'vuex';
import { useInSummary } from '@shell/components/TableOfContents/composables';

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

  setup(props) {
    const instance = getCurrentInstance();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = (instance?.proxy as any)?.$store?.getters?.['i18n/t'] as ((key: string) => string) | undefined;
    const label = computed(() => props.titleKey && typeof t === 'function' ? t(props.titleKey) : props.title);

    const isOpen = ref(props.openInitially);

    const scrollTo = () => {
      isOpen.value = true;
      nextTick(() => {
        const el = instance?.proxy?.$el as HTMLElement | undefined;

        el?.scrollIntoView(true);
      });
    };

    const { summary } = useInSummary({ scrollTo, label });

    return {
      summary,
      isOpen,
      scrollTo,
    };
  },

  data() {
    return {};
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    displayTitle() {
      return this.titleKey ? this.t(this.titleKey) : this.title;
    },
  },

  methods: {
    toggle() {
      this.isOpen = !this.isOpen;
    },
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
