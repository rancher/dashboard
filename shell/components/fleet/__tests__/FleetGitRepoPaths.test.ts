import { getRelevantPrefixes } from '@shell/components/fleet/FleetGitRepoPaths.vue';

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

describe.skip('test UI elements from YAML resource', () => {});
