<script>
import { _VIEW } from '@/config/query-params';
import AsyncButton from '@/components/AsyncButton';
import Banner from '@/components/Banner';

export default {
  components: {
    AsyncButton,
    Banner,
  },

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
      type:    Array,
      default: null,
    },
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },
  },

  methods: {
    save(buttonCb) {
      this.$emit('save', buttonCb);
    },

    done() {
      this.$emit('done');
    }
  }
};
</script>
<template>
  <div v-if="!isView">
    <div class="spacer-small"></div>

    <div v-for="(err,idx) in errors" :key="idx">
      <Banner color="error" :label="err" />
    </div>
    <div class="cancel-create">
      <slot name="left" />
      <slot name="cancel">
        <button type="button" class="btn role-secondary" @click="done">
          <t k="generic.cancel" />
        </button>
      </slot>
      <slot name="middle" />
      <slot name="save">
        <AsyncButton
          v-if="!isView"
          :mode="mode"
          @click="save"
        />
      </slot>
      <slot name="right" />
    </div>
  </div>
</template>

<style lang='scss'>
  .cancel-create {
    text-align: right;

    > * {
      margin: 0 0 0 $column-gutter;
    }
  }
</style>
