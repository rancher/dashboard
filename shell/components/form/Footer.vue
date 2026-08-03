<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { _VIEW } from '@shell/config/query-params';
import AsyncButton, { AsyncButtonCallback } from '@shell/components/AsyncButton.vue';
import Banner from '@components/Banner/Banner.vue';

export default defineComponent({
  emits: ['save', 'done', 'closeError'],

  components: { AsyncButton, Banner },

  props: {
    /**
     * Current mode of the page
     * passed to asyncButton to determine lables of the button
     */
    mode: {
      type:     String,
      required: true,
    },

    errors: {
      type:    Array as PropType<string[]>,
      default: () => []
    },

    disableSave: {
      type:    Boolean,
      default: false,
    }
  },

  computed: {
    isView(): boolean {
      return this.mode === _VIEW;
    },
  },

  methods: {
    closeError(index: number) {
      this.$emit('closeError', index);
    },

    save(buttonCb: AsyncButtonCallback) {
      this.$emit('save', buttonCb);
    },

    done() {
      this.$emit('done');
    }
  }
});
</script>
<template>
  <div v-if="!isView">
    <div class="spacer-small" />

    <!-- `role="alert"` sits on each banner rather than on a wrapper element, so the
         layout is unchanged. Assistive tech announces an alert when it is inserted,
         which is exactly when an error appears. -->
    <div
      v-for="(err,idx) in errors"
      :key="idx"
    >
      <Banner
        color="error"
        role="alert"
        :label="err"
        :closable="true"
        @close="closeError(idx)"
      />
    </div>
    <div class="buttons">
      <div class="left">
        <slot name="left" />
      </div>
      <div class="right">
        <slot name="cancel">
          <button
            type="button"
            class="btn role-secondary"
            @click="done"
          >
            <t k="generic.cancel" />
          </button>
        </slot>
        <slot name="middle" />
        <slot name="save">
          <AsyncButton
            v-if="!isView"
            :mode="mode"
            :disabled="disableSave"
            @click="save"
          />
        </slot>
        <slot name="right" />
      </div>
    </div>
  </div>
</template>

<style lang='scss'>
  .buttons {
    display: grid;
    grid-template-areas:  "left right";
    grid-template-columns: "min-content auto";

    .left {
      grid-area: left;
      text-align: left;

      .btn, button {
        margin: 0 $column-gutter 0 0;
      }
    }

    .right {
      grid-area: right;
      text-align: right;

      .btn, button {
        margin: 0 0 0 $column-gutter;
      }
    }
  }
</style>
