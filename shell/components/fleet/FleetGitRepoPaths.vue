<script lang="ts">
import { uniq, uniqBy } from 'lodash';
import { PropType } from 'vue';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { pathArrayToTree } from '@shell/utils/string.js';
import ArrayList from '@shell/components/form/ArrayList.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';

interface DirectoryTree {
  name?:    string,
  children: DirectoryTree[]
}

interface Subpath {
  base:     string,
  options?: string
}

interface DataType {
  paths:     string[],
  subpaths:  Subpath[][],
  isBundles: Record<string, boolean>
}

function _cl(str: string) {
  const removeSlashes = str?.replace(/^\s*\/+|\/+\s*$/g, '');

  const trim = removeSlashes?.trim();

  return trim;
}

export default {

  name: 'FleetGitRepoPaths',

  inheritAttrs: false,

  emits: ['udpate:value'],

  components: {
    ArrayList,
    Checkbox,
    KeyValue,
  },

  props: {
    value: {
      type:    Object as PropType<{ paths: string[], bundles: Subpath[] }>,
      default: () => ({})
    },

    mode: {
      type:    String,
      default: _EDIT,
    },
  },

  data(): DataType {
    return {
      paths:     [],
      subpaths:  [],
      isBundles: {}
    };
  },

  mounted() {
    this.toDirectoryTree();
  },

  computed: {
    isView(): boolean {
      return this.mode === _VIEW;
    },
  },

  methods: {
    updatePaths() {
      this.update();
    },

    removePaths({ index }: { index: number }) {
      this.subpaths[index] = [];

      this.update();
    },

    updatePath(index: number, value: any) {
      if (!this.paths) {
        return;
      }

      const neu = value?.srcElement?.value;

      this.paths[index] = value?.srcElement?.value;

      if (!neu) {
        delete this.isBundles[this.paths[index]];
      }

      this.update();
    },

    updateSubpaths(index: number, value: Subpath[]) {
      if (!this.subpaths) {
        return;
      }

      this.subpaths[index] = value;

      this.update();
    },

    updateIsBundles(index: number) {
      if (!this.paths[index]) {
        return;
      }

      this.isBundles[this.paths[index]] = !this.isBundles[this.paths[index]];

      this.update();
    },

    update() {
      const value = this.fromDirectoryTree();

      this.$emit('udpate:value', value);
    },

    toDirectoryTree() {
      const paths = this.normalizePaths(this.value.paths);
      const bundles = this.buildBundlesRows(this.normalizeBundles(this.value.bundles));

      const rPaths = uniq([
        ...Object.keys(bundles),
        ...paths.filter((path) => !this.value.bundles.map(({ base }) => _cl(base)).includes(path))
      ]);

      this.isBundles = rPaths.reduce((acc, key) => ({ ...acc, [key]: false }), {});

      Object.keys(bundles).forEach((key, i) => {
        this.subpaths[i] = [];

        bundles[key].forEach(({ base, options }) => {
          if (base || options) {
            this.subpaths[i].push({ base, options });
          }
        });

        this.isBundles[key] = true;
      });

      // if (this.mode === _CREATE) {
      //   this.paths = rPaths;
      // } else {
      const ordered = Object.keys(this.isBundles).sort((a, b) => `${ this.isBundles[a] }${ a }`.localeCompare(`${ this.isBundles[b] }${ b }`));

      this.subpaths = ordered.map((key) => this.subpaths[rPaths.indexOf(key)]);
      this.paths = ordered;
      // }
    },

    normalizePaths(paths: string[]) {
      return uniq(paths || []).map((path) => _cl(path));
    },

    normalizeBundles(_bundles: Subpath[]) {
      const bundles = (_bundles || [])
        .map((bundle) => ({
          base:    _cl(bundle.base),
          options: _cl(bundle.options || ''),
        }));

      return uniqBy(bundles, (elem) => `${ elem.base }_${ elem.options }`)
        .sort((b, a) => `${ a.base }${ a.options }`.localeCompare(`${ b.base }${ b.options }`));
    },

    buildBundlesRows(bundles: Subpath[]) {
      const out: Record<string, Subpath[]> = {};

      const prefixes = this.buildMaxPrefixes(bundles.map(({ base }) => base));

      const remaining: any[] = [];

      prefixes.forEach((prefix) => {
        [...bundles].forEach(({ base, options }) => {
          if (base.startsWith(prefix)) {
            const neu = _cl(base.replace(prefix, ''));

            if (out[prefix]?.find(({ base }) => base === neu && !options)) {
              if (!out[base]) {
                out[base] = [];
              }
              out[base].push({
                base:    '',
                options: ''
              });
            } else {
              if (!out[prefix]) {
                out[prefix] = [];
              }
              out[prefix].push({
                base:    neu,
                options: options || ''
              });
            }
          } else if (!remaining.find((r) => r.base === base)) {
            remaining.push({ base });
          }
        });
        bundles = remaining;
      });

      return out;
    },

    fromDirectoryTree() {
      const paths: string[] = [];
      const bundles: Subpath[] = [];

      this.paths?.forEach((path, i) => {
        const el = _cl(path);

        if (el) {
          if (this.isBundles[path]) {
            if (this.subpaths[i]?.length) {
              this.subpaths[i]?.forEach(({ base, options }) => {
                bundles.push({
                  base:    _cl(`${ el }/${ _cl(base) }`),
                  options: options || undefined
                });
              });
            } else {
              bundles.push({ base: el });
            }
          } else {
            paths.push(el);
          }
        }
      });

      return {
        paths,
        bundles
      };
    },

    buildMaxPrefixes(paths: string[]): string[] {
      const prefixes: string[] = [];

      this.buildPrefixes(prefixes, '', { name: '', children: pathArrayToTree(paths) });

      return prefixes.sort((a, b) => b.localeCompare(a));
    },

    buildPrefixes(ret: string[], path: string, tree: DirectoryTree) {
      if (tree.children.length === 0) {
        const str = _cl(path === '/' ? path + tree.name : path);

        if (str && !ret.includes(str)) {
          ret.push(str);
        }

        return;
      }

      if (tree.children.length === 1) {
        const str = _cl(path + tree.name);

        if (str && !ret.includes(str)) {
          ret.push(str);
        }
      }

      tree.children.forEach((child: DirectoryTree) => {
        this.buildPrefixes(ret, `${ path + tree.name }/`, child);
      });
    },
  }
};
</script>
<template>
  <h3 v-t="'fleet.gitRepo.paths.label'" />
  <h4 class="text-muted">
    {{ t('fleet.gitRepo.paths.description1') }}<br>
    {{ t('fleet.gitRepo.paths.description2') }}
  </h4>
  <ArrayList
    v-model:value="paths"
    :mode="mode"
    :initial-empty-row="false"
    :a11y-label="t('fleet.gitRepo.paths.ariaLabel')"
    :add-label="t('fleet.gitRepo.paths.addLabel')"
    :add-icon="'icon-plus'"
    :protip="t('fleet.gitRepo.paths.tooltip', {}, true)"
    :remove-label="' '"
    :remove-icon="'icon-x'"
    :removeAllowed="!isView"
    @update:value="updatePaths"
    @remove="removePaths"
  >
    <template #columns="{row, i}">
      <div class="paths-container">
        <div>
          <h4>
            {{ t('fleet.gitRepo.paths.index', { index: i + 1 }, true) }}
          </h4>
          <p
            v-clean-html="'Main path'"
            class="text-muted mb-5"
          />
          <input
            :value="row.value"
            :placeholder="t('fleet.gitRepo.paths.placeholder')"
            :disabled="isView"
            @input="updatePath(i, $event)"
          >
          <Checkbox
            :value="isBundles[paths[i]]"
            class="check mt-10"
            type="checkbox"
            label-key="fleet.gitRepo.paths.enableBundles"
            :mode="mode"
            :disabled="!paths[i]"
            @update:value="updateIsBundles(i)"
          />
        </div>
        <div
          v-if="isBundles[paths[i]]"
          class="paths-row"
        >
          <KeyValue
            :value="subpaths[i]"
            :mode="mode"
            :key-name="'base'"
            :value-name="'options'"
            :key-label="t('fleet.gitRepo.paths.subpaths.props.base')"
            :value-label="t('fleet.gitRepo.paths.subpaths.props.options')"
            :as-map="false"
            :value-can-be-empty="true"
            :read-allowed="false"
            :key-placeholder="t('fleet.gitRepo.paths.subpaths.placeholders.key')"
            :value-placeholder="t('fleet.gitRepo.paths.subpaths.placeholders.value')"
            :add-label="t('fleet.gitRepo.paths.subpaths.addLabel')"
            :add-icon="'icon-plus'"
            :remove-label="' '"
            :remove-icon="'icon-x'"
            :protip="t('fleet.gitRepo.paths.subpaths.protipKey')"
            :protip-value="t('fleet.gitRepo.paths.subpaths.protipValue')"
            @update:value="updateSubpaths(i, $event)"
          />
        </div>
      </div>
    </template>
  </ArrayList>
</template>

<style lang="scss" scoped>
  .paths-container {
    display: flex;
    flex-direction: column;

    .paths-row {
      .key-value {
        :deep() .kv-container {
          grid-template-columns: 10px repeat(2, 1fr) 1px !important;

          .rowgroup {
            .row::before {
              content: "";
              display: block;
            }
          }

          .rowgroup:not(:first-child) {
            .row::before {
              border-left: 1px solid var(--border);
              border-bottom: 1px solid var(--border);
              height: 70%;
              margin-top: -10px;
              margin-right: -10px;
            }
          }
        }

        :deep() .footer {
          margin-top: 10px !important;
          margin-left: 30px;
        }
      }
    }
  }
</style>
