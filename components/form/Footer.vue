<script>
import { _CREATE, _EDIT, _VIEW } from '@/config/query-params';
import AsyncButton from '@/components/AsyncButton';

export default {
  components: { AsyncButton },

  props: {
    mode: {
      type:     String,
      required: true,
    },

    errors: {
      type:    Array,
      default: null,
    }
  },

  computed: {
    isCreate() {
      return this.mode === _CREATE;
    },
    isEdit() {
      return this.mode === _EDIT;
    },
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
  <div>
    <div class="spacer"></div>

    <div v-for="(err,idx) in errors" :key="idx">
      <div class="text-error">
        {{ err }}
      </div>
    </div>
    <div class="text-center">
      <AsyncButton v-if="isEdit" key="edit" mode="edit" @click="save" />
      <AsyncButton v-if="isCreate" key="create" mode="create" @click="save" />
      <button v-if="!isView" class="btn bg-transparent" @click="done">
        Cancel
      </button>
    </div>
  </div>
</template>
