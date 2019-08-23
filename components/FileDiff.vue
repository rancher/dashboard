<script>
import { Diff2Html } from 'diff2html';
import { createPatch } from 'diff';

export default {
  props: {
    filename: {
      type:    String,
      default: 'file.txt',
    },

    sideBySide: {
      type:    Boolean,
      default: false,
    },

    orig: {
      type:     String,
      required: true,
    },

    neu: {
      type:     String,
      required: true,
    }
  },

  computed: {
    html() {
      const outputFormat = this.sideBySide ? 'side-by-side' : 'line-by-line';
      const showFiles = false;
      const matching = 'words';

      const patch = createPatch(
        this.filename,
        this.orig,
        this.neu
      );

      const json = Diff2Html.getJsonFromDiff(patch, {
        inputFormat: 'diff',
        outputFormat,
        showFiles,
        matching
      });

      return Diff2Html.getPrettyHtml(json, {
        inputFormat:        'json',
        outputFormat,
        showFiles,
        matching,
        synchronizedScroll: true,
      });
    }
  }
};
</script>

<template>
  <div class="root" v-html="html" />
</template>

<style lang="scss" scoped>
.root {
  max-width: 100%;
  position: relative;
}

.mode {
  position: absolute;
  top: 10px;
  right: 10px;
}
</style>

<style lang="scss">
@import 'node_modules/diff2html/dist/diff2html.min.css';

.d2h-file-header {
  display: none;

}

.d2h-lines-added {
  border-color: #b4e2b4;
  color: #399839;
}

.d2h-lines-deleted {
  border-color: #e9aeae;
  color: #c33;
}

.d2h-file-name-wrapper {
  font-family: "Source Sans Pro","Helvetica Neue",Helvetica,Arial,sans-serif;
  font-size: 15px;
}

.d2h-file-wrapper {
  border-color: #ddd;
}

.d2h-diff-table {
  font-family: Menlo,Consolas,monospace;
  font-size: 13px;
}

.d2h-code-line del,.d2h-code-side-line del {
  background-color: #ffb6ba;
}

.d2h-code-line ins,.d2h-code-side-line ins {
  background-color: #97f295;
}

.d2h-code-linenumber {
  background-color: #fff;
  color: rgba(0,0,0,.3);
  border-color: #eee;
}

.d2h-code-side-linenumber {
  background-color: #fff;
  color: rgba(0,0,0,.3);
  border-color: #eee;
}

.d2h-code-side-emptyplaceholder,.d2h-emptyplaceholder {
  background-color: #f1f1f1;
  border-color: #e1e1e1;
}

.d2h-del {
  background-color: #fee8e9;
  border-color: #e9aeae;
}

.d2h-ins {
  background-color: #dfd;
  border-color: #b4e2b4;
}

.d2h-info {
  background-color: #f8fafd;
  color: rgba(0,0,0,.3);
  border-color: #d5e4f2;
}

.d2h-file-diff .d2h-del.d2h-change {
  background-color: #fdf2d0;
}

.d2h-file-diff .d2h-ins.d2h-change {
  background-color: #ded;
}

.d2h-file-list-wrapper a {
  color: #3572b0;
}

.d2h-file-list-wrapper a:visited {
  color: #3572b0;
}

.d2h-file-list>li {
  border-bottom-color: #ddd;
}
</style>
