<script>
export default {
  name:       'DashboardCard',
  props:      {
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
};
</script>

<template>
  <div class="d-main">
    <div class="d-header">
      <i class="icon icon-fw" :class="icon" />
      <n-link :to="link">
        <h1>
          {{ title }}
        </h1>
      </n-link>
    </div>

    <p>
      {{ description }}
    </p>

    <n-link class="btn role-secondary" :to="cta">
      {{ linkText }}
    </n-link>

    <hr v-if="slotTitle" />

    <div v-if="slotTitle" class="d-slot">
      <h2>{{ slotTitle }}</h2>
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.d-main {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: $space-m;
  grid-auto-rows: 1fr;
  gap: $space-m;
  outline: 1px solid var(--border);
  border-radius: var(--border-radius);

  // Header's style
  .d-header {
    display: flex;
    align-items: center;

    i {
      margin: 5px 10px 0 0 ;
      width: auto;
      text-decoration: none;
    }

    h1 {
      margin: 0;
      font-size: 18px;
    }
  }

  .d-slot {
    width: 100%;
    display: flex;
    flex-direction: column;

    h2 {
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
    }
  }
}
</style>
