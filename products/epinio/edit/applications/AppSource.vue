<script lang="ts">
import Vue, { PropType } from 'vue';
import Application from '@/products/epinio/models/applications.class';
// import FileSelector from '@/components/form/FileSelector.vue';

interface Data {
  errors: string[],
  tarball: string,
}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({

  components: { }, // FileSelector,

  props: {
    application: {
      type:     Object as PropType<Application>,
      required: true
    },
    mode: {
      type:     String,
      required: true
    },
  },

  data() {
    return {
      errors:        [],
      tarball: '',
    };
  },

  methods: {
    onFileSelected(value: { name: string, value: any }) {
      const file = this.$refs.file.files[0];
      // lastModified: 1633451677134
      // lastModifiedDate: Tue Oct 05 2021 17:34:37 GMT+0100 (British Summer Time) {}
      // name: "sample-app.tar.gz"
      // size: 256
      // type: "application/gzip"
      // webkitRelativePath: ""

      this.tarball = file;

      this.update();

      // const { name: fileName, value: fileContent, ...others } = value;

      // console.log(fileName, fileContent, others); // eslint-disable-line no-console
      // this.tarball = value;
    },

    update() {
      this.$emit('change', { tarball: this.tarball });
    }

  },

  watch: {}
});
</script>

<template>
  <div>
    <!-- TODO: Switch back -->
    <input
      id="file"
      ref="file"
      type="file"
      @change="onFileSelected"
    />

    <!-- <FileSelector
          class="role-tertiary add mt-5"
          :label="t('generic.readFromFile')"
          :include-file-name="true"
          :mode="mode"
          :read-as-data-url="true"
          @selected="onFileSelected"
        /> -->

    <!-- <br><br> -->
    <!-- Debug<br>
        Mode: {{ mode }}<br>
        Value: {{ JSON.stringify(value) }}<br>
        originalValue: {{ JSON.stringify(originalValue) }}<br> -->
  </div>
</template>

<style lang="scss" scoped>

</style>
