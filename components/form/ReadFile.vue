<script>
import { mapGetters } from 'vuex';
import { asciiLike } from '../../utils/string';

export default {
  props: {
    role: {
      type:    String,
      default: 'primary'
    }
  },
  computed: { ...mapGetters({ t: 'i18n/t' }) },

  methods:  {
    readFromFile() {
      this.$refs.uploader.click();
    },

    fileChange(event) {
      const input = event.target;
      const handles = input.files;
      const names = [];

      if ( handles ) {
        for ( let i = 0 ; i < handles.length ; i++ ) {
          const reader = new FileReader();

          reader.onload = (loaded) => {
            const value = loaded.target.result;

            this.$emit('input', {
              value, name: names[i], asciiLike: asciiLike(value)
            });
          };

          reader.onerror = (err) => {
            this.$dispatch('growl/fromError', { title: 'Error reading file', err }, { root: true });
          };

          names[i] = handles[i].name;
          reader.readAsText(handles[i]);
        }

        input.value = '';
      }
    },
  },

};
</script>

<template>
  <button class="btn btn-sm" :class="`role-${role}`" @click="readFromFile">
    <slot>
      {{ t('generic.readFromFile') }}
    </slot>
    <input
      ref="uploader"
      v-bind="$attrs"
      type="file"
      class="hide"
      @change="fileChange"
    />
  </button>
</template>
