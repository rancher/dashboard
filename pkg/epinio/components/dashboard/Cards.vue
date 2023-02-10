<script>
export default {
  name:  'DashboardCard',
  props: {
    isLoaded:    { type: Boolean, required: true },
    title:       { type: String, required: true },
    icon:        { type: String, required: true },
    cta:         { type: Object, required: true },
    link:        { type: Object, required: true },
    linkText:    { type: String, required: true },
    description: { type: String, required: true },
    slotTitle:   {
      type:     String,
      required: false,
      default:  null,
    },
  },
  computed: {
    setLoading() {
      return !this.isLoaded ? 'loading' : '';
    },
  },
};
</script>

<template>
  <div
    v-if="!isLoaded"
    :class="setLoading"
  >
    <i class="icon-spinner animate-spin" />
  </div>
  <div
    v-else
    class="d-main"
    :class="setLoading"
  >
    <div class="d-header">
      <i
        class="icon icon-fw"
        :class="icon"
      />
      <n-link :to="link">
        <h1>
          {{ title }}
        </h1>
      </n-link>
    </div>

    <p>
      {{ description }}
    </p>

    <n-link
      class="btn role-secondary"
      :to="cta"
    >
      {{ linkText }}
    </n-link>

    <hr>

    <div
      class="d-slot"
    >
      <h2 v-if="slotTitle">
        {{ slotTitle }}
      </h2>
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.d-main, .loading  {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: $space-m;
  grid-auto-rows: 1fr;
  gap: $space-m;
  outline: 1px solid var(--border);
  border-radius: var(--border-radius);
  height: 100%;

  // Header's style
  .d-header {
    display: flex;
    align-items: center;

    i {
      margin-right: 5px ;
      width: auto;
      text-decoration: none;
    }

    h1 {
      margin: 0;
      font-size: 18px;
    }
  }

  p {
    min-height: 48px;
  }

  .d-slot {
    width: 100%;
    display: flex;
    flex-direction: column;

    h2 {
      min-height: 18px;
      font-size: 16px;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: $space-s;

      li, .link {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        font-size: 14px;

        &:not(:last-child) {
          border-bottom: 1px solid var(--border);
          padding-bottom: $space-s;
        }
      }

      li > .disabled {
        color: var(--disabled-text);
      }

      .disabled {
        cursor: not-allowed;
      }
    }
  }
}

.loading {
  min-height: 325px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  place-content: center;

  // INFO: Disable shimmer effect for now
  // &::after {
  //   position: absolute;
  //   top: 0;
  //   right: 0;
  //   bottom: 0;
  //   left: 0;
  //   opacity: 0.1;
  //   transform: translateX(-100%);
  //   background-image: linear-gradient(
  //     90deg,
  //     rgba(#fff, 0) 0,
  //     rgba(#fff, 0.2) 20%,
  //     rgba(#fff, 0.5) 60%,
  //     rgba(#fff, 0)
  //   );
  //   animation: shimmer 4s infinite;
  //   content: '';
  // }

  // @keyframes shimmer {
  //   100% {
  //     transform: translateX(100%);
  //   }
  // }

  .animate-spin {
    opacity: 0.5;
    font-size: 24px;
    animation: spin 5s linear infinite;
  }

  @keyframes spin {
    100% {
      transform: rotate(360deg);
    }
  }
}
</style>
