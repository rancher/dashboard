<script>

import CodeMirror from './CodeMirror';
import FileDiff from './FileDiff';
import AsyncButton from './AsyncButton';

import { MODE, _VIEW, _EDIT, _PREVIEW } from '~/utils/query-params';

export default {
  components: {
    CodeMirror, FileDiff, AsyncButton
  },

  props: {
    obj: {
      type:     Object,
      required: true,
    },

    value: {
      type:     String,
      required: true,
    },

    doneRoute: {
      type:    String,
      default: null,
    }
  },

  data() {
    let mode = this.$route.query.mode || _VIEW;

    if ( mode === _PREVIEW ) {
      mode = _EDIT;
    }

    return {
      mode,
      currentValue: this.value,
    };
  },

  computed: {
    schema() {
      return this.$store.getters['v1/schemaFor'](this.obj.type);
    },

    cmOptions() {
      const readOnly = this.mode === _VIEW;
      const gutters = ['CodeMirror-lint-markers'];

      if ( !readOnly ) {
        gutters.push('CodeMirror-foldgutter');
      }

      return {
        readOnly,
        gutters,
        mode:            'text/yaml',
        lint:            true,
        lineNumbers:     !readOnly,
        extraKeys:       { 'Ctrl-Space': 'autocomplete' },
        cursorBlinkRate: ( readOnly ? -1 : 530)
      };
    },

    isView() {
      return this.mode === _VIEW;
    },

    isEdit() {
      return this.mode === _EDIT;
    },

    isPreview() {
      return this.mode === _PREVIEW;
    }
  },

  methods: {
    onCodeChange(value) {
      this.currentValue = value;
    },

    edit() {
      this.mode = _EDIT;
      this.$router.applyQuery({ [MODE]: this.mode });
    },

    preview() {
      this.mode = _PREVIEW;
      this.$router.applyQuery({ [MODE]: this.mode });
    },

    cancel() {
      this.mode = _VIEW;
      this.$router.applyQuery({ [MODE]: this.mode });
      this.currentValue = this.value;
    },

    async save(buttonDone) {
      await this.obj.followLink('update', {
        method:  'PUT',
        headers: {
          'content-type': 'application/yaml',
          accept:         'application/yaml',
        },
        data: this.currentValue,
      });

      buttonDone(true);
      this.done();
    },

    async remove(buttonDone) {
      await this.obj.remove();
      buttonDone(true);
      this.done();
    },

    done() {
      debugger;
      if ( !this.doneRoute ) {
        return;
      }

      this.$router.replace({ name: this.doneRoute });
    }
  }
};
</script>

<template>
  <div>
    <header>
      <h2>
        <nuxt-link :to="'/explorer/'+ obj.type+'/'">
          {{ schema.attributes.kind }}
        </nuxt-link>: {{ obj.id }}
      </h2>
      <div class="actions">
        <button v-if="!isView" class="btn bg-transparent" @click="cancel">
          Cancel
        </button>
        <button v-if="isEdit" class="btn bg-transparent" @click="preview">
          Preview
        </button>
        <AsyncButton
          v-if="isView"
          key="delete"
          mode="delete"
          action-color="bg-error"
          waiting-color="bg-error"
          @click="remove"
        />
        <button v-if="!isEdit" class="btn bg-primary" @click="edit">
          Edit
        </button>
        <AsyncButton v-if="!isView" key="apply" mode="apply" @click="save" />
      </div>
    </header>
    <CodeMirror
      v-if="isView || isEdit"
      :value="currentValue"
      :options="cmOptions"
      @onCodeChange="onCodeChange"
    />
    <FileDiff
      v-if="isPreview"
      :filename="obj.id + '.yaml'"
      :side-by-side="false"
      :orig="value"
      :neu="currentValue"
    />
  </div>
</template>

<style lang="scss" scoped>
  HEADER {
    display: grid;
    grid-template-areas: "type actions";
    grid-template-columns: "auto min-content";
    margin-bottom: 10px;

    H2 {
      grid-area: type;
      margin: 0;
    }

    .actions {
      grid-area: actions;
      text-align: right;
    }
  }
</style>
