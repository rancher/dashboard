<script lang="ts">
import { uniq, uniqBy } from 'lodash';
import { PropType } from 'vue';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { pathArrayToTree } from '@shell/utils/string.js';
import ArrayList from '@shell/components/form/ArrayList.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';

interface DirectoryTree {
  name?: string,
  children: DirectoryTree[]
}

interface Subpath {
  base: string,
  options?: string
}

interface Row {
  path: string,
  subpaths?: Subpath[],
  isBundles?: boolean | undefined,
}

interface DataType {
  rows: Row[]
}

function _cl(str: string) {
  const removeSlashes = str?.replace(/^\s*\/+|\/+\s*$/g, '');

  const trim = removeSlashes?.trim();

  return trim;
}

export function getRelevantPrefixes(paths: string[]): string[] {
  const prefixes: string[] = [];

  getPrefixesRecursive(prefixes, paths, '', { name: '', children: pathArrayToTree(paths) });

  return prefixes.sort((a, b) => b.localeCompare(a));
}

function getPrefixesRecursive(ret: string[], paths: string[], path: string, tree: DirectoryTree) {
  if (tree.children.length === 0) {
    const str = _cl(path === '/' ? path + tree.name : path);

    if (str && !ret.includes(str)) {
      ret.push(str);
    }

    return;
  }

  if (tree.children.length === 1 && paths.includes(tree.name || '')) {
    const str = _cl(path + tree.name);

    if (str && !ret.includes(str)) {
      ret.push(str);
    }
  }

  tree.children.forEach((child: DirectoryTree) => {
    getPrefixesRecursive(ret, paths, `${ path + tree.name }/`, child);
  });
}

export default {

  name: 'FleetGitRepoPaths',

  inheritAttrs: false,

  emits: ['udpate:value', 'touched'],

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

    touched: {
      type:    Object as PropType<Record<string, number>>,
      default: () => ({}),
    },
  },

  data(): DataType {
    return { rows: [] };
  },

  mounted() {
    this.toDirectoryTree();
  },

  computed: {
    isView(): boolean {
      return this.mode === _VIEW;
    },

    paths() {
      return this.rows.map(({ path }) => path);
    }
  },

  methods: {
    updatePaths(paths: string[]) {
      this.rows = paths.map((path, i) => ({
        ...this.rows[i],
        path
      }));

      this.update();
    },

    removePaths(index: number) {
      this.rows.splice(index, 1);

      this.update();
    },

    updatePath(index: number, value: any) {
      const neu = value?.srcElement?.value;

      this.rows[index].path = neu;

      if (!neu) {
        this.rows[index].isBundles = undefined;
      }

      this.update();
    },

    updateSubpaths(index: number, value: Subpath[]) {
      this.rows[index].subpaths = value;

      this.update();
    },

    updateIsBundles(index: number) {
      if (!this.rows[index].path) {
        return;
      }

      this.rows[index].isBundles = !this.rows[index].isBundles;

      this.update();
    },

    update() {
      const value = this.fromDirectoryTree();

      this.$emit('udpate:value', value);
      this.$emit('touched', this.pathsOrder());
    },

    toDirectoryTree() {
      const paths = this.normalizePaths(this.value.paths);
      const bundles = this.buildBundles(this.normalizeBundles(this.value.bundles));

      const rows: Row[] = [...uniq(Object.keys(bundles)), ...uniq(paths)].map((path) => ({ path }));

      Object.keys(bundles).forEach((key, i) => {
        rows[i].subpaths = [];

        bundles[key].forEach(({ base, options }) => {
          if (base || options) {
            if (rows[i].subpaths) {
              rows[i].subpaths.push({ base, options });
            }
          }
        });

        rows[i].isBundles = true;
      });

      if (!!this.touched) {
        this.rows = rows.sort((a, b) => (this.touched[a.path] || -1) - (this.touched[b.path] || -1));
      } else {
        this.rows = rows.sort((b, a) => `${ a.isBundles }${ a.path }`.localeCompare(`${ b.isBundles }${ b.path }`));
      }
    },

    fromDirectoryTree() {
      const paths: string[] = [];
      const bundles: Subpath[] = [];

      this.rows.forEach((row, i) => {
        const el = _cl(row.path);

        if (el) {
          if (row.isBundles) {
            if (row.subpaths?.length) {
              row.subpaths?.forEach(({ base, options }) => {
                bundles.push({
                  base:    _cl(`${ el }/${ _cl(base) }`),
                  options: options || undefined
                });
              });
            } else {
              bundles.push({ base: el });
            }
          } else if (!paths.includes(el)) {
            paths.push(el);
          }
        }
      });

      return {
        paths,
        bundles
      };
    },

    buildBundles(bundles: Subpath[]) {
      const out: Record<string, Subpath[]> = {};

      const prefixes = getRelevantPrefixes(bundles.map(({ base }) => base));

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

    pathsOrder() {
      return this.rows.reduce((acc, { path }, i) => ({ ...acc, [path]: i }), {});
    }
  }
};
</script>
<template>
  <h3 v-t="'fleet.gitRepo.paths.label'" />
  <p class="text-muted mb-10">
    {{ t('fleet.gitRepo.paths.description1') }}<br>
    {{ t('fleet.gitRepo.paths.description2') }}
  </p>
  <ArrayList
    :value="paths"
    :mode="mode"
    :initial-empty-row="false"
    :a11y-label="t('fleet.gitRepo.paths.ariaLabel')"
    :add-label="t('fleet.gitRepo.paths.addLabel')"
    :add-icon="'icon-plus'"
    :protip="t('fleet.gitRepo.paths.tooltip', {}, true)"
    :remove-allowed="false"
    @update:value="updatePaths"
  >
    <template #columns="{row, i}">
      <div class="row-container">
        <div>
          <div class="header">
            <h4 class="m-0">
              {{ t('fleet.gitRepo.paths.index', { index: i + 1 }, true) }}
            </h4>
            <button
              v-if="!isView"
              type="button"
              class="btn role-link"
              role="button"
              @click="removePaths(i)"
            >
              <i :class="'icon-x'" />
            </button>
          </div>
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
            v-if="!isView"
            :value="rows[i]?.isBundles"
            class="check mt-10"
            type="checkbox"
            label-key="fleet.gitRepo.paths.enableBundles"
            :mode="mode"
            :disabled="!paths[i]"
            @update:value="updateIsBundles(i)"
          />
        </div>
        <div
          v-if="rows[i]?.isBundles"
          class="subpaths"
          :class="{ ['mt-10']: isView }"
        >
          <KeyValue
            :value="rows[i]?.subpaths"
            :mode="mode"
            :key-name="'base'"
            :value-name="'options'"
            :key-label="t('fleet.gitRepo.paths.subpaths.props.base')"
            :value-label="t('fleet.gitRepo.paths.subpaths.props.options')"
            :as-map="false"
            :value-can-be-empty="true"
            :read-allowed="false"
            :initial-empty-row="true"
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
  .row-container {
    display: flex;
    flex-direction: column;

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .btn {
        padding-right: 0;
      }
    }

    .subpaths {
      .key-value {
        :deep() .kv-container {
          grid-template-columns: 10px repeat(2, 30%) 1px !important;

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
          margin-top: 5px !important;
          margin-left: 20px;

          .btn {
            background: transparent;
            color: var(--link);
            border: 0
          }
        }
      }
    }
  }

  .array-list-main-container {
    :deep() .box {
      grid-template-columns: auto 1px;
    }
  }
</style>
