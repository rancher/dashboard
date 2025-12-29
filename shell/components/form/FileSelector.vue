<script>
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { set } from '@shell/utils/object';

export function createOnSelected(field) {
  return function(contents) {
    set(this, field, contents);
  };
}

export default {
  emits: ['error', 'selected'],

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
    },

    byteLimit: {
      type:    Number,
      default: 0
    },

    readAsDataUrl: {
      type:    Boolean,
      default: false
    },

    directory: {
      type:    Boolean,
      default: false
    },

    rawData: {
      type:    Boolean,
      default: false
    },

    accept: {
      type:    String,
      default: '*'
    },

    allowedFileTypes: {
      type:    Array,
      default: null
    },

    class: {
      type:    [String, Array],
      default: () => [],
    }

  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    customClass() {
      return ['file-selector', 'btn', ...(Array.isArray(this.class) ? this.class : [this.class])];
    },
  },

  methods: {
    selectFile() {
      // Clear the value so the user can reselect the same file again
      this.$refs.uploader.value = null;
      this.$refs.uploader.click();
    },

    isFileTypeAllowed(file) {
      // If no allowed types specified, allow all files
      if (!this.allowedFileTypes || this.allowedFileTypes.length === 0) {
        return true;
      }

      // Check if file type matches any of the allowed types
      return this.allowedFileTypes.some((allowedType) => {
        // Support both exact match and prefix match (e.g., 'text/' matches 'text/plain')
        return file.type === allowedType || file.type.startsWith(allowedType);
      });
    },

    async fileChange(event) {
      const input = event.target;
      const files = Array.from(input.files || []);

      if (this.byteLimit) {
        for (const file of files) {
          if (file.size > this.byteLimit) {
            this.$emit('error', `${ file.name } exceeds the file size limit of ${ this.byteLimit } bytes`);
            // Clear the input so the user can try again
            input.value = null;

            return;
          }
        }
      }

      // Check file types if allowed types are specified
      if (this.allowedFileTypes && this.allowedFileTypes.length > 0) {
        for (const file of files) {
          if (!this.isFileTypeAllowed(file)) {
            const errorMsg = `${ file.name } is not an allowed file type. Please select a file with one of the following types: ${ this.allowedFileTypes.join(', ') }`;

            this.$emit('error', errorMsg);
            if (this.showGrowlError) {
              this.$store.dispatch('growl/fromError', { title: 'Invalid file type', error: new Error(errorMsg) }, { root: true });
            }
            // Clear the input so the user can try again
            input.value = null;

            return;
          }
        }
      }

      if (this.rawData) {
        const unboxedContents = !this.multiple && files.length === 1 ? files[0] : files;

        this.$emit('selected', unboxedContents);

        return;
      }

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
        if (this.readAsDataUrl) {
          reader.readAsDataURL(file);
        } else {
          reader.readAsText(file);
        }
      });
    }
  }
};
</script>

<template>
  <button
    v-if="!isView"
    :disabled="disabled"
    :aria-label="label"
    type="button"
    role="button"
    :class="customClass"
    data-testid="file-selector__uploader-button"
    @click="selectFile"
  >
    <span>{{ label }}</span>
    <input
      ref="uploader"
      type="file"
      class="hide"
      :multiple="multiple"
      :webkitdirectory="directory"
      :accept="accept"
      @change="fileChange"
    >
  </button>
</template>
