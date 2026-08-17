import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import FleetGitRepoPaths, { Subpath, getRelevantPrefixes } from '@shell/components/fleet/FleetGitRepoPaths.vue';
import { getters, state, mutations } from '@shell/store/i18n.js';

// The i18n store imports the en-us yaml, which jest can't parse. The a11y tests below load the
// small subset of translations they need explicitly, via `loadTranslations`.
jest.mock('@shell/assets/translations/en-us.yaml', () => ({}));

describe('fx: getRelevantPrefixes', () => {
  it('should return an empty array for an empty input array', () => {
    const paths: string[] = [];

    expect(getRelevantPrefixes(paths)).toStrictEqual([]);
  });

  it('should return the single path if only one is provided', () => {
    const paths: string[] = ['aaa'];

    expect(getRelevantPrefixes(paths)).toStrictEqual(['aaa']);
  });

  it('should return only 2nd level prefixes', () => {
    const paths: string[] = [
      'folderA/aaa',
      'folderA/subfolderB/bbb',
      'folderC/ccc'
    ];

    const res = getRelevantPrefixes(paths);

    expect(res).toStrictEqual([
      'folderC',
      'folderA/subfolderB',
      'folderA'
    ]);
  });

  it('should return common prefix between 2 paths with same prefix', () => {
    const paths: string[] = [
      'level1/level2',
      'level1/level2/aaa'
    ];

    const res = getRelevantPrefixes(paths);

    expect(res).toStrictEqual([
      'level1/level2'
    ]);
  });

  it('should return common prefix between 2 paths with same low level prefix', () => {
    const paths: string[] = [
      'aaa/bbb/ccc',
      'aaa/bbb/eee/fff'
    ];

    const res = getRelevantPrefixes(paths);

    expect(res).toStrictEqual([
      'aaa/bbb/eee',
      'aaa/bbb'
    ]);
  });

  it('should return all original paths if they are leaves or satisfy the one-child condition', () => {
    const paths: string[] = [
      'aaa',
      'bbb',
      'ccc'
    ];

    const res = getRelevantPrefixes(paths);

    expect(res).toStrictEqual(['ccc', 'bbb', 'aaa']);
  });

  it('should handle multiple prefixes', () => {
    const paths: string[] = [
      'root/file1.txt',
      'root/file2.txt',
      'root/file3.txt'
    ];

    const res = getRelevantPrefixes(paths);

    expect(res).toStrictEqual([
      'root'
    ]);
  });

  it('should add leaf nodes and single-child original paths, not grouping parents', () => {
    const paths: string[] = [
      'driven/kustomize/path1',
      'driven/kustomize/path2',
      'driven/kustomize',
      'driven/simple',
      'driven/helm'
    ];

    const res = getRelevantPrefixes(paths);

    expect(res).toStrictEqual([
      'driven/kustomize',
      'driven',
    ].sort((a, b) => b.localeCompare(a)));
  });
});

describe('decode spec.targets to build UI source data', () => {
  describe('mode: edit', () => {
    const mode = _EDIT;

    it('should build empty rows from empty paths and empty bundles', async() => {
      const paths: string[] = [];
      const bundles: Subpath[] = [];

      const wrapper = mount(FleetGitRepoPaths, {
        props: {
          value:   { paths, bundles },
          mode,
          touched: {}
        },
      });

      const { rows } = wrapper.vm;

      expect(rows).toStrictEqual([]);
    });

    it('should build 1 row from 1 path', async() => {
      const paths: string[] = ['path1'];
      const bundles: Subpath[] = [];

      const wrapper = mount(FleetGitRepoPaths, {
        props: {
          value:   { paths, bundles },
          mode,
          touched: {}
        },
      });

      const { rows } = wrapper.vm;

      expect(rows).toStrictEqual([{ path: 'path1' }]);
    });

    it('should build empty rows from empty subpaths', async() => {
      const paths: string[] = [];
      const bundles: any[] = [{}];

      const wrapper = mount(FleetGitRepoPaths, {
        props: {
          value:   { paths, bundles },
          mode,
          touched: {}
        },
      });

      const { rows } = wrapper.vm;

      expect(rows).toStrictEqual([]);
    });

    it('should build empty rows from bundles with empty key', async() => {
      const paths: string[] = [];
      const bundles: Subpath[] = [{ base: '', options: 'dev.yaml' }];

      const wrapper = mount(FleetGitRepoPaths, {
        props: {
          value:   { paths, bundles },
          mode,
          touched: {}
        },
      });

      const { rows } = wrapper.vm;

      expect(rows).toStrictEqual([]);
    });

    it('should build 1 path from bundles with empty options', async() => {
      const paths: string[] = [];
      const bundles: Subpath[] = [{ base: 'aaa', options: '' }];

      const wrapper = mount(FleetGitRepoPaths, {
        props: {
          value:   { paths, bundles },
          mode,
          touched: {}
        },
      });

      const { rows } = wrapper.vm;

      expect(rows).toStrictEqual([{
        isBundles: true,
        path:      'aaa',
        subpaths:  []
      }]);
    });

    it('should build 1 row from bundles', async() => {
      const paths: string[] = [];
      const bundles: Subpath[] = [{ base: 'dev', options: 'dev.yaml' }];

      const wrapper = mount(FleetGitRepoPaths, {
        props: {
          value:   { paths, bundles },
          mode,
          touched: {}
        },
      });

      const { rows } = wrapper.vm;

      expect(rows).toStrictEqual([{
        isBundles: true,
        path:      'dev',
        subpaths:  [{
          base:    '',
          options: 'dev.yaml'
        }]
      }]);
    });

    it('should build rows from mixed paths and bundles', async() => {
      const paths: string[] = ['folderC', 'folderA/subfolderB', 'folderA'];
      const bundles: Subpath[] = [{
        base:    'folderA',
        options: 'dev.yaml'
      }, {
        base:    'vvv',
        options: 'vvv.yaml'
      }];

      const wrapper = mount(FleetGitRepoPaths, {
        props: {
          value:   { paths, bundles },
          mode,
          touched: {}
        },
      });

      const { rows } = wrapper.vm;

      expect(rows).toStrictEqual([
        {
          path:     'vvv',
          subpaths: [{
            base:    '',
            options: 'vvv.yaml'
          }],
          isBundles: true
        },
        {
          path:     'folderA',
          subpaths: [{
            base:    '',
            options: 'dev.yaml'
          }],
          isBundles: true
        },
        { path: 'folderC' },
        { path: 'folderA/subfolderB' },
        { path: 'folderA' }
      ]);
    });
  });
});

describe('a11y: unique path row labels', () => {
  // Mirrors the `fleet.gitRepo.paths` block of shell/assets/translations/en-us.yaml, so the
  // assertions below check the strings a screen reader would actually announce.
  const TRANSLATIONS = {
    fleet: {
      gitRepo: {
        paths: {
          ariaLabel:       'Enter paths for Git Repo',
          inputAriaLabel:  'Enter path {index} for Git Repo',
          removeBtn:       'Remove Path {index}',
          addBtnAriaLabel: 'Add Path for Git Repo',
          addLabel:        'Add Path',
          index:           'Path {index}',
        }
      }
    }
  };

  const store = createStore({
    state,
    getters: { 'i18n/t': getters.t },
    mutations,
  });

  store.commit('loadTranslations', { locale: 'en-us', translations: TRANSLATIONS });

  /**
   * Resolves against the real i18n store getter (so `{index}` is interpolated), falling back to
   * the `%key%` form used by the global test mock for untranslated keys.
   */
  const t = jest.fn((key: string, args?: Record<string, unknown>) => {
    return store.getters['i18n/t'](key, args) ?? `%${ key }%`;
  });

  /**
   * The component builds its rows in `mounted`, and ArrayList only picks them up through its
   * `value` watcher, so the rows are rendered a couple of ticks after mount.
   */
  const mountPaths = async(paths: string[], mode: string = _EDIT) => {
    const wrapper = mount(FleetGitRepoPaths, {
      props: {
        value:   { paths, bundles: [] as Subpath[] },
        mode,
        touched: {}
      },
      global: { mocks: { t } },
    });

    await nextTick();
    await nextTick();

    return wrapper;
  };

  type PathsWrapper = Awaited<ReturnType<typeof mountPaths>>;

  const removeButtonLabels = (wrapper: PathsWrapper) => wrapper
    .findAll('.header button')
    .map((btn) => btn.attributes('aria-label'));

  const inputLabels = (wrapper: PathsWrapper) => wrapper
    .findAll('[data-testid="main-path"]')
    .map((input) => input.attributes('aria-label'));

  beforeEach(() => t.mockClear());

  it('should give each path row remove button a label naming the path and its position', async() => {
    const wrapper = await mountPaths(['path1', 'path2', 'path3']);

    expect(removeButtonLabels(wrapper)).toStrictEqual([
      'Remove Path 1',
      'Remove Path 2',
      'Remove Path 3',
    ]);
  });

  it('should keep the remove button labels unique across path rows', async() => {
    const wrapper = await mountPaths(['path1', 'path2', 'path3']);
    const labels = removeButtonLabels(wrapper);

    expect(new Set(labels).size).toStrictEqual(labels.length);
  });

  it('should re-index the remove button labels after a path is removed', async() => {
    const wrapper = await mountPaths(['path1', 'path2', 'path3']);

    await wrapper.findAll('.header button')[0].trigger('click');

    expect(removeButtonLabels(wrapper)).toStrictEqual([
      'Remove Path 1',
      'Remove Path 2',
    ]);
  });

  it('should not render the remove buttons in view mode', async() => {
    const wrapper = await mountPaths(['path1', 'path2'], _VIEW);

    expect(removeButtonLabels(wrapper)).toStrictEqual([]);
  });

  it('should give each path input a label naming its position', async() => {
    const wrapper = await mountPaths(['path1', 'path2']);

    expect(inputLabels(wrapper)).toStrictEqual([
      'Enter path 1 for Git Repo',
      'Enter path 2 for Git Repo',
    ]);
  });

  it('should label the add button with the path specific text while keeping the visible label', async() => {
    const wrapper = await mountPaths(['path1']);
    const addButton = wrapper.find('[data-testid="array-list-button"]');

    expect(addButton.attributes('aria-label')).toStrictEqual('Add Path for Git Repo');
    expect(addButton.text()).toStrictEqual('Add Path');
  });

  it('should pass the add button aria-label down to the ArrayList', async() => {
    const wrapper = await mountPaths(['path1']);
    const arrayList = wrapper.findComponent({ name: 'ArrayList' });

    expect(arrayList.props('addBtnAriaLabel')).toStrictEqual('Add Path for Git Repo');
  });
});
