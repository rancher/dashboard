<script lang="ts">
import { PropType } from 'vue';
import { _EDIT } from '@shell/config/query-params';
import ArrayList from '@shell/components/form/ArrayList.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import { pathArrayToTree } from '@shell/utils/string.js';

interface DirectoryTree {
  name?: string,
  children: DirectoryTree[]
}

interface Subpath {
  base: string,
  options: string
}

interface DataType {
  paths: string[],
  subPaths: Subpath[][]
}

function _cl(str: string) {
  const removeSlashes = str?.replace(/^\/|\/$/g, '');

  const trim = removeSlashes?.trim();

  return trim;
}

export default {

  name: 'FleetGitRepoPaths',

  inheritAttrs: false,

  emits: ['udpate:value'],

  components: {
    ArrayList,
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
      paths:    [],
      subPaths: [],
    };
  },

  mounted() {
    const pathsMap = this.fromPathsSubpaths([
      ...(this.value.paths || []).map((path) => _cl(path)),
      ...(this.value.bundles || []).map((bundle) => _cl(bundle.base)),
    ]);

    Object.keys(pathsMap).forEach((key) => {
      this.paths.push(key);
      this.subPaths.push(pathsMap[key]?.filter((el) => el.base || el.options));
    });
  },

  methods: {
    updatePaths() {
      this.update();
    },

    removePaths({ index }: { index: number }) {
      this.subPaths[index] = [];

      this.update();
    },

    updatePath(index: number, value: any) {
      if (!this.paths) {
        return;
      }

      const neu = value?.srcElement?.value;

      this.paths[index] = neu;

      this.update();
    },

    updateSubpaths(index: number, value: Subpath[]) {
      if (!this.subPaths) {
        return;
      }

      this.subPaths[index] = value;

      this.update();
    },

    update() {
      const value = this.toPathsSubpaths();

      this.$emit('udpate:value', value);
    },

    fromPathsSubpaths(paths: string[]) {
      const out: Record<string, Subpath[]> = {};

      this.buildMaxPrefixes(paths).forEach((prefix) => {
        out[prefix] = [];
        const remaining: string[] = [];

        [...paths].forEach((path) => {
          const options = this.getOptions(path);

          if (path.startsWith(prefix)) {
            const base = _cl(path.replace(prefix, ''));

            if (options.length === 0) {
              out[prefix].push({ base, options: '' });
            } else {
              options.forEach((option) => {
                out[prefix].push({ base, options: option });
              });
            }
          } else {
            if (!remaining.includes(path)) {
              remaining.push(path);
            }
          }
        });

        paths = remaining;
      });

      return out;
    },

    toPathsSubpaths() {
      const paths: string[] = [];
      const subpaths: Subpath[] = [];

      this.paths.forEach((path, i) => {
        let isSubpath = false;

        this.subPaths[i]?.forEach((subpath) => {
          if (subpath.base || subpath.options) {
            const el = {
              base:    _cl(this.paths[i] ? `${ _cl(this.paths[i]) }/${ _cl(subpath.base) }` : _cl(subpath.base)),
              options: subpath.options || undefined
            };

            if (!subpaths.find((sp) => sp.base === el.base && sp.options === el.options)) {
              subpaths.push(el as Subpath);
            }

            isSubpath = true;
          }
        });

        if (!isSubpath) {
          const el = _cl(path);

          if (!subpaths.find((sp) => sp.base.startsWith(el))) {
            paths.push(el);
          }
        }
      });

      return {
        paths:    paths.filter((p) => p),
        subpaths: subpaths.filter((sp) => sp.base || sp.options)
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

      tree.children.forEach((child: DirectoryTree) => {
        this.buildPrefixes(ret, `${ path + tree.name }/`, child);
      });
    },

    getOptions(base: string): string[] {
      return this.value.bundles.reduce((acc, bundle) => {
        const options = _cl(bundle.options);

        if (_cl(bundle.base) === _cl(base) && options) {
          return [
            ...acc,
            options
          ];
        }

        return acc;
      }, [] as string[]);
    },
  }
};
</script>
<template>
  <ArrayList
    v-model:value="paths"
    :title="t('fleet.gitRepo.paths.label')"
    :mode="mode"
    :initial-empty-row="false"
    :a11y-label="t('fleet.gitRepo.paths.ariaLabel')"
    :add-label="t('fleet.gitRepo.paths.addLabel')"
    :add-icon="'icon-plus'"
    :protip="t('fleet.gitRepo.paths.tooltip', {}, true)"
    @update:value="updatePaths"
    @remove="removePaths"
  >
    <template #columns="{row, i}">
      <div class="paths-container">
        <div>
          <input
            :value="row.value"
            :placeholder="t('fleet.gitRepo.paths.placeholder')"
            :disabled="false"
            @input="updatePath(i, $event)"
          >
        </div>
        <div class="paths-row mt-5">
          <KeyValue
            :value="subPaths[i]"
            :mode="mode"
            :key-name="'base'"
            :value-name="'options'"
            :key-label="t('fleet.gitRepo.bundlePaths.props.base')"
            :value-label="t('fleet.gitRepo.bundlePaths.props.options')"
            :as-map="false"
            :value-can-be-empty="true"
            :read-allowed="false"
            :key-placeholder="t('fleet.gitRepo.bundlePaths.placeholders.key')"
            :value-placeholder="t('fleet.gitRepo.bundlePaths.placeholders.value')"
            :add-label="t('fleet.gitRepo.bundlePaths.addLabel')"
            :add-icon="'icon-plus'"
            :remove-label="' '"
            :remove-icon="'icon-x'"
            :protip="t('fleet.gitRepo.bundlePaths.protipKey')"
            :protip-value="t('fleet.gitRepo.bundlePaths.protipValue')"
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

  :deep() .box {
    align-items: baseline;
  }
</style>
