<script>
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { set } from '@shell/utils/object';
import { IMAGE_TYPE } from '@shell/utils/fileTypes';
const SVG_TYPE = 'image/svg+xml';
const IMAGE_MIMES = [
  {
    mime:    'image/jpeg',
    pattern: [0xFF, 0xD8, 0xFF],
    mask:    [0xFF, 0xFF, 0xFF],
  },
  {
    mime:    'image/png',
    pattern: [0x89, 0x50, 0x4E, 0x47],
    mask:    [0xFF, 0xFF, 0xFF, 0xFF],
  }
];

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

    fileType: {
      type:    String,
      default: ''
    },

  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    }
  },

  methods: {
    selectFile() {
      // Clear the value so the user can reselect the same file again
      this.$refs.uploader.value = null;
      this.$refs.uploader.click();
    },

    async fileChange(event) {
      const input = event.target;
      const files = Array.from(input.files || []);

      if (this.byteLimit) {
        for (const file of files) {
          if (file.size > this.byteLimit) {
            this.$emit('error', `${ file.name } exceeds the file size limit of ${ this.byteLimit } bytes`);

            return;
          }
        }
      }

      if (this.fileType === IMAGE_TYPE) {
        for (const file of files) {
          const isImage = await this.checkIsImage(file);

          if (!isImage) {
            this.$emit('error', `${ file.name } is not an image.`);

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

    checkMime(bytes, mime) {
      for (let i = 0, l = mime.mask.length; i < l; ++i) {
        if ((bytes[i] & mime.mask[i]) - mime.pattern[i] !== 0) {
          return false;
        }
      }

      return true;
    },

    async checkIsImage(file) {
      return new Promise((resolve, reject) => {
        if (file.type === SVG_TYPE) {
          resolve(true);
        }
        const blob = file.slice(0, 4);

        const reader = new FileReader();

        reader.onloadend = (e) => {
          if (e.target.readyState === FileReader.DONE) {
            const bytes = new Uint8Array(e.target.result);

            for (let i = 0, l = IMAGE_MIMES.length; i < l; ++i) {
              if (this.checkMime(bytes, IMAGE_MIMES[i])) {
                resolve(true);
              }
            }

            resolve(false);
          }
        };
        reader.onerror = (err) => {
          reject(err);
        };
        reader.readAsArrayBuffer(blob);
      });
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
    type="button"
    class="file-selector btn"
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
