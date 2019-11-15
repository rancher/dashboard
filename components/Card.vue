<script>
export default {
  props:      {
    title: {
      type:     String,
      default: ''
    },
    content: {
      type:    String,
      default: ''
    },
    buttonAction: {
      type:    Function,
      default: () => {}
    },
    buttonText: {
      type:    String,
      default: 'go'
    },
  }
};
</script>

<template>
  <div class="card-container">
    <div class="card-title">
      <slot name="title">
        {{ title }}
      </slot>
    </div>
    <div class="card-body">
      <slot name="body">
        {{ content }}
      </slot>
    </div>
    <div class="card-actions">
      <slot name="actions">
        <button class="btn role-secondary" @click="buttonAction">
          {{ buttonText }}
        </button>
      </slot>
    </div>
  </div>
</template>

<style lang='scss'>
    .card-container {
        padding: 10px;
        border: 1px solid  var(--border);
        background: var(--nav-bg);
        display: grid;
        padding: 1.25rem;
        grid-gap: .75rem;
        grid-template-rows: 1fr 2fr 1fr;
        & .card-body {
            overflow: hidden;
        }
        & .card-actions{
            align-self: end;
        }
        & .card-title{
            color: var(--primary);
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid var(--border);
        }
    }
</style>
