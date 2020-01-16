<script>
import CodeMirror from './CodeMirror';
import FileDiff from './FileDiff';
import AsyncButton from './AsyncButton';

import {
  MODE, _CREATE, _VIEW, _EDIT, _PREVIEW
} from '@/config/query-params';

import { mapPref, DIFF } from '@/store/prefs';

export default {
  components: {
    CodeMirror, FileDiff, AsyncButton
  },

  props: {
    forCreate: {
      type:    Boolean,
      default: false,
    },

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
    },

    parentRoute: {
      type:    String,
      default: null,
    },
    parentParams: {
      type:    Object,
      default: null,
    },
  },

  data() {
    let mode;

    if ( this.forCreate ) {
      mode = _CREATE;
    } else {
      mode = this.$route.query.mode || _VIEW;
    }

    if ( mode === _PREVIEW ) {
      mode = _EDIT;
    }

    return {
      mode,
      currentValue: this.value,
      errors:       null,
    };
  },

  computed: {
    schema() {
      return this.$store.getters['cluster/schemaFor'](this.obj.type);
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
        mode:            'yaml',
        lint:            true,
        lineNumbers:     !readOnly,
        extraKeys:       { 'Ctrl-Space': 'autocomplete' },
        cursorBlinkRate: ( readOnly ? -1 : 530)
      };
    },

    isCreate() {
      return this.mode === _CREATE;
    },
    isView() {
      return this.mode === _VIEW;
    },
    isEdit() {
      return this.mode === _EDIT;
    },
    isPreview() {
      return this.mode === _PREVIEW;
    },

    canEdit() {
      return this.obj.hasLink('update');
    },

    canDelete() {
      return this.obj.hasLink('remove');
    },

    diffMode: mapPref(DIFF),

    parentLink() {
      const name = this.parentRoute || 'explorer-group-resource';
      const params = this.parentParams || {
        group:    this.schema.groupName,
        resource: this.obj.type
      };

      const out = this.$router.resolve({ name, params }).href;

      return out;
    },
  },

  methods: {
    onInput(value) {
      this.currentValue = value;
    },

    onReady(cm) {
      cm.getMode().fold = 'yaml';

      if ( this.isCreate ) {
        cm.execCommand('foldAll');
      }
    },

    onChanges(cm, changes) {
      if ( changes.length !== 1 ) {
        return;
      }

      const change = changes[0];

      if ( change.from.line !== change.to.line ) {
        return;
      }

      let line = change.from.line;
      let str = cm.getLine(line);
      let maxIndent = indentChars(str);

      if ( maxIndent === null ) {
        return;
      }

      cm.replaceRange('', { line, ch: 0 }, { line, ch: 1 }, '+input');

      while ( line > 0 ) {
        line--;
        str = cm.getLine(line);
        const indent = indentChars(str);

        if ( indent === null ) {
          break;
        }

        if ( indent < maxIndent ) {
          cm.replaceRange('', { line, ch: 0 }, { line, ch: 1 }, '+input');

          if ( indent === 0 ) {
            break;
          }

          maxIndent = indent;
        }
      }

      function indentChars(str) {
        const match = str.match(/^#(\s+)/);

        if ( match ) {
          return match[1].length;
        }

        return null;
      }
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
      try {
        if ( this.isCreate ) {
          await this.schema.followLink('collection', {
            method:  'POST',
            headers: {
              'content-type': 'application/yaml',
              accept:         'application/json',
            },
            data: this.currentValue,
          });
        } else {
          const link = this.obj.hasLink('rioupdate') ? 'rioupdate' : 'update';

          await this.obj.followLink(link, {
            method:  'PUT',
            headers: {
              'content-type': 'application/yaml',
              accept:         'application/json',
            },
            data: this.currentValue,
          });
        }

        buttonDone(true);
        this.done();
      } catch (err) {
        if ( err && err.response && err.response.data ) {
          const body = err.response.data;

          if ( body && body.message ) {
            this.errors = [body.message];
          } else {
            this.errors = [err];
          }
        } else {
          this.errors = [err];
        }

        buttonDone(false);
      }
    },

    async remove(buttonDone) {
      await this.obj.remove();
      buttonDone(true);
      this.done();
    },

    done() {
      if ( !this.doneRoute ) {
        return;
      }

      this.$router.replace({
        name:   this.doneRoute,
        params: { resource: this.obj.type }
      });
    }
  }
};
</script>

<template>
  <div class="root">
    <header>
      <h1>
        <span v-if="isCreate">
          Create {{ schema.attributes.kind }}
        </span>
        <span v-else>
          {{ schema.attributes.kind }}: {{ obj.id }}
        </span>
      </h1>
      <div class="actions">
        <button v-if="!isView" type="button" class="btn bg-transparent" @click="cancel">
          Cancel
        </button>
        <button v-if="isEdit" type="button" class="btn bg-transparent" @click="preview">
          Preview
        </button>
        <AsyncButton
          v-if="canDelete && isView"
          key="delete"
          mode="delete"
          action-color="bg-error"
          waiting-color="bg-error"
          @click="remove"
        />
        <button v-if="canEdit && (isView || isPreview)" type="button" class="btn bg-primary" @click="edit">
          Edit
        </button>
        <AsyncButton v-if="isEdit || isPreview" key="apply" mode="apply" @click="save" />
        <AsyncButton v-if="isCreate" key="create" mode="create" @click="save" />
      </div>
      <div v-for="(err, idx) in errors" :key="idx" class="text-error">
        {{ err }}
      </div>
    </header>
    <div class="text-right">
      <span v-if="isPreview" v-trim-whitespace class="btn-group btn-sm diff-mode">
        <button type="button" class="btn btn-sm bg-default" :class="{'active': diffMode !== 'split'}" @click="diffMode='unified'">
          Unified
        </button>
        <button type="button" class="btn btn-sm bg-default" :class="{'active': diffMode === 'split'}" @click="diffMode='split'">
          Split
        </button>
      </span>
    </div>
    <CodeMirror
      v-if="!isPreview"
      :value="currentValue"
      :options="cmOptions"
      :footer-space="71"
      @onInput="onInput"
      @onReady="onReady"
      @onChanges="onChanges"
    />
    <FileDiff
      v-if="isPreview"
      :filename="obj.id + '.yaml'"
      :side-by-side="diffMode === 'split'"
      :orig="value"
      :neu="currentValue"
      :footer-space="71"
    />
  </div>
</template>

<style lang="scss" scoped>
  @import "../assets/styles/base/_variables.scss";
  @import "../assets/styles/base/_functions.scss";
  @import "../assets/styles/base/_mixins.scss";

  .diff-mode {
    position: absolute;
    top: 95px;
    right: 21px;
    z-index: z-index('overContent');
  }
</style>
