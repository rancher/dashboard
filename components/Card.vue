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
  <div class="aspect-wrapper">
    <div class="card-container">
      <div class="card-title">
        <slot name="title">
          {{ title }}
        </slot>
      </div>
      <hr>
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
  </div>
</template>

<style lang='scss'>
    .card-container {
        padding: 10px;
        border: 1px solid  var(--border);
        background: var(--nav-bg);
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        overflow: hidden;
        & .card-body {
            overflow: hidden;
        }
        & .card-actions{
            position: absolute;
            bottom: 0px;
        }
        & > * {
            margin: 10px;
        }
        & .card-title{
            color: var(--primary);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
    }
    .aspect-wrapper {
        width: 100%;
        padding-bottom: 75%;
        position: relative;
    }
</style>
