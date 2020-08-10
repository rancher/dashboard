<script>
import { _EDIT } from '@/config/query-params';
import { set } from '@/utils/object';

export function createOnSelected(field) {
  return function(contents) {
    set(this, field, contents);
  };
}

export default {
  props: {
    label: {
      type:     String,
      required: true
    },

    mode: {
      type:    String,
      default: _EDIT
    },

    disabled: {
      type:    Boolean,
      default: false,
    },

    includeFileName: {
      type:    Boolean,
      default: false,
    },

    showGrowlError: {
      type:    Boolean,
      default: true
    },

    multiple: {
      type:    Boolean,
      default: false
    }
  },

  computed: {
    isEditing() {
      return this.mode === _EDIT;
    }
  },

  methods: {
    selectFile() {
      this.$refs.uploader.click();
    },

    async fileChange(event) {
      const input = event.target;
      const files = Array.from(input.files || []);

      try {
        const asyncFileContents = files.map(this.getFileContents);
        const fileContents = await Promise.all(asyncFileContents);
        const unboxedContents = !this.multiple && fileContents.length === 1 ? fileContents[0] : fileContents;

        this.$emit('selected', unboxedContents);
      } catch (error) {
        this.$emit('error', error);
        if (this.showGrowlError) {
          this.$store.dispatch('growl/fromError', { title: 'Error reading file', error }, { root: true });
        }
      }
    },

    getFileContents(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (ev) => {
          const value = ev.target.result;
          const name = file.name;
          const fileContents = this.includeFileName ? { value, name } : value;

          resolve(fileContents);
        };

        reader.onerror = (err) => {
          reject(err);
        };

        reader.readAsText(file);
      });
    }
  }
};
</script>

<template>
  <button type="button" class="file-selector btn" @click="selectFile">
    {{ label }}
    <input
      ref="uploader"
      type="file"
      class="hide"
      :multiple="multiple"
      @change="fileChange"
    />
  </button>
</template>
