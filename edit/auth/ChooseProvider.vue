<script>
export default {
  props: {
    providers: {
      type:     Array,
      required: true
    },
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  }
};
</script>

<template>
  <div>
    <div class="providers">
      <button
        v-for="provider in providers"
        :key="provider.id"
        type="button"
        class="provider btn-tab"
        :class="{'selected':value===provider, 'disabled':!provider.available}"
        :disabled="!provider.available"
        @click="$emit('input', provider)"
      >
        <span v-if="provider.authCategory" class="category">
          {{ provider.authCategory }}
        </span>
        <h4>
          {{ provider.nameDisplay }}
        </h4>
      </button>
    </div>
  </div>
</template>

<style lang='scss'>
.providers {
  display: flex;
  flex-wrap: wrap;
  max-width: 100%;
}

  .provider.btn-tab {
      flex-basis: 20%;
      box-shadow: 0px 0px 12px 3px var(--box-bg);
      margin: 20px 10px 20px 10px;
      background-color: var(--default);
      justify-content:space-around;

      &.disabled {
        border-left: 5px solid var(--disabled-bg);
        cursor: not-allowed;
      }

      &.selected {
        background: var(--accent-btn);
      }

      & .category {
        color: var(--input-label);
        margin-bottom: 5px;
      }

      & .controls a {
        margin: 10px 10px 0px 0px;
      }

      & H4{
        margin: 0px;
      }
  }
</style>
