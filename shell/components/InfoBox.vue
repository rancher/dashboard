<script>
export default {
  props: {
    step: {
      type:    Number,
      default: null
    }
  }
};
</script>

<template>
  <div :class="{'stepped': !!step}" class="info-box">
    <div v-if="step" class="step-number mb-10">
      <h2>Step {{ step }}</h2>
    </div>
    <slot />
  </div>
</template>

<style lang="scss" scoped>
  .info-box {
    border: 2px solid var(--tabbed-border);
    padding: 10px;
    margin-bottom: 20px;
    border-radius: var(--border-radius);
    flex-grow: 1;
    flex-basis: 0;
    position:relative;

    .stepped {
      padding-left: 40px;
    }

    .step-number {
      border-radius: var(--border-radius);
      background: var(--secondary);
      color: var(--input-text);
      display: inline-block;
      padding: 5px 10px;
    }

    .step-list {
      margin: 0;
    }

    .info-column:not(:last-child) {
      border-right: 1px solid var(--tabbed-border);
    }
    .info-row {
      margin-bottom: 10px;
      .info-row-label {
        padding-top: 2px;
        display: inline-block;
      }
    }
    .info-column,
    .info-row {
      label {
        color: var(--input-label);
      }
    }

    .info-column {
      .usage {
        margin-bottom: 10px;
        label {
          display: inline-block;
          font-size: 12px;
          padding-top: 6px;
        }
      }
      .flex-item-half {
        align-items: center;
      }
    }
  }
</style>
