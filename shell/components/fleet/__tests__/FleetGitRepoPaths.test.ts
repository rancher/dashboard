import { mount } from '@vue/test-utils';
import { _EDIT } from '@shell/config/query-params';
import FleetGitRepoPaths, { Subpath, getRelevantPrefixes } from '@shell/components/fleet/FleetGitRepoPaths.vue';

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
