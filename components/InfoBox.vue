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
    <div v-if="step" class="step-number">
      {{ step }}
    </div>
    <slot />
  </div>
</template>

<style lang="scss" scoped>
  .info-box {
    background-color: var(--tabbed-container-bg);
    border: .5px solid var(--tabbed-border);
    box-shadow: 0 0 10px var(--shadow);
    padding: 20px;
    margin-bottom: 20px;
    border-radius: var(--border-radius);
    flex-grow: 1;
    flex-basis: 0;
    position:relative;

    .stepped {
      padding-left: 40px;
    }

    .step-number {
      border-radius: 50%;
      background: var(--primary);
      width: 1.5em;
      height: 1.5em;
      line-height: 1.5em;
      text-align: center;
      position: absolute;
      top: 20px;
      left: -.75em;
      color: var(--primary-text)
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
