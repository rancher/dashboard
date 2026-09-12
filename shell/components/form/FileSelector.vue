<script>
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { set } from '@shell/utils/object';
import { RcButton } from '@components/RcButton';

export function createOnSelected(field) {
  return function(contents) {
    set(this, field, contents);
  };
}

/**
 * Reads a file the user selected or dropped, either as plain text or as a data URL.
 */
export function readFileContents(file, asDataUrl = false) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (ev) => resolve(ev.target.result);
    // `onerror` is handed a ProgressEvent, not the failure. The DOMException that says what went wrong
    // — NotFoundError for a dropped folder, NotReadableError for a file pulled out from under us — is on
    // the reader. Rejecting with the event instead left every caller with nothing to report.
    reader.onerror = () => reject(reader.error || new Error(`Could not read ${ file.name }`));

    if (asDataUrl) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  });
}

export default {
  emits: ['error', 'selected'],

  components: { RcButton },

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

    /**
     * The RcButton variant used for the trigger button.
     * @values primary, secondary, tertiary, link, ghost
     */
    variant: {
      type:    String,
      default: 'secondary'
    },

    /**
     * The RcButton size used for the trigger button.
     * @values small, medium, large
     */
    size: {
      type:    String,
      default: 'medium'
    }
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },
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
          // `err`, not `error`: growl/fromError reads `err`, so the other spelling threw the detail away
          // and left the growl with a title and no body.
          this.$store.dispatch('growl/fromError', { title: this.t('generic.errorReadingFile'), err: error }, { root: true });
        }
      }
    },

    async getFileContents(file) {
      const value = await readFileContents(file, this.readAsDataUrl);

      return this.includeFileName ? { value, name: file.name } : value;
    }
  }
};
</script>

<template>
  <RcButton
    v-if="!isView"
    :variant="variant"
    :size="size"
    :disabled="disabled"
    :aria-label="label"
    class="file-selector"
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
  </RcButton>
</template>
