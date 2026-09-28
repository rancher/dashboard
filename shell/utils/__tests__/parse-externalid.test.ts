import { parseExternalId, parseHelmExternalId } from '@shell/utils/parse-externalid';

describe('parseExternalId', () => {
  describe('falsy / empty input', () => {
    it.each([
      { desc: 'null', input: null },
      { desc: 'undefined', input: undefined },
      { desc: 'empty string', input: '' },
    ])('returns all-null output for $desc', ({ input }) => {
      expect(parseExternalId(input as any)).toStrictEqual({
        kind:    null,
        group:   null,
        base:    null,
        id:      null,
        name:    null,
        version: null,
      });
    });
  });

  describe('new-style: kind://group:name:version', () => {
    it('extracts kind, group, name and version from a full new-style id', () => {
      const result = parseExternalId('catalog://library:mysql:1.2.3');

      expect(result.kind).toStrictEqual('catalog');
      expect(result.group).toStrictEqual('library');
      expect(result.name).toStrictEqual('mysql');
      expect(result.version).toStrictEqual('1.2.3');
      expect(result.id).toStrictEqual('library:mysql:1.2.3');
      expect(result.templateId).toStrictEqual('library:mysql');
    });

    it('handles name with base separator (*)', () => {
      const result = parseExternalId('catalog://library:base*app:1.0.0');

      expect(result.base).toStrictEqual('base');
      expect(result.name).toStrictEqual('app');
      expect(result.version).toStrictEqual('1.0.0');
    });

    it('uses part before colon as group', () => {
      // For 'containers://someimage:latest', group='someimage', name='latest'
      const result = parseExternalId('containers://someimage:latest');

      expect(result.kind).toStrictEqual('containers');
      expect(result.group).toStrictEqual('someimage');
      expect(result.name).toStrictEqual('latest');
      expect(result.version).toBeNull();
    });

    it('name with no version (no trailing colon) sets version to null', () => {
      const result = parseExternalId('catalog://library:nameonly');

      expect(result.name).toStrictEqual('nameonly');
      expect(result.version).toBeNull();
    });
  });

  describe('new-style: kind://name (no group, no colon in rest)', () => {
    it('leaves group null when rest has no colon', () => {
      // NOTE: EXTERNAL_ID.KIND_CATALOG is undefined, so the "set library group for
      // catalog kind" branch is unreachable (kind === undefined condition never matches).
      // group stays null for all kinds when rest contains no colon.
      const result = parseExternalId('catalog://appname');

      expect(result.kind).toStrictEqual('catalog');
      expect(result.group).toBeNull();
      expect(result.name).toStrictEqual('appname');
    });
  });

  describe('old-style: name-version (no ://)', () => {
    it('extracts group, name and version from a name-version string', () => {
      // NOTE: EXTERNAL_ID.KIND_CATALOG is not defined, so result.kind is undefined (not 'catalog').
      // All other fields (group, name, version, templateId) are populated correctly.
      const result = parseExternalId('mysql-1.2.3');

      expect(result.kind).toBeUndefined();
      expect(result.group).toStrictEqual('library');
      expect(result.name).toStrictEqual('mysql');
      expect(result.version).toStrictEqual('1.2.3');
      expect(result.templateId).toStrictEqual('library:mysql');
    });

    it('splits on last hyphen so names with hyphens are preserved', () => {
      const result = parseExternalId('my-app-chart-0.1.0');

      expect(result.kind).toBeUndefined();
      expect(result.group).toStrictEqual('library');
      expect(result.version).toStrictEqual('0.1.0');
      expect(result.name).toStrictEqual('my-app-chart');
    });
  });
});

describe('parseHelmExternalId', () => {
  describe('falsy / empty input', () => {
    it.each([
      { desc: 'null', input: null },
      { desc: 'undefined', input: undefined },
      { desc: 'empty string', input: '' },
    ])('returns all-null output for $desc', ({ input }) => {
      expect(parseHelmExternalId(input as any)).toStrictEqual({
        kind:    null,
        group:   null,
        base:    null,
        id:      null,
        name:    null,
        version: null,
      });
    });
  });

  describe('valid helm external id', () => {
    it('parses a helm id with catalog containing a slash (catalog/chart format)', () => {
      // Format: kind:///key=val&key=val — the key=val pairs are parsed directly
      const id = 'catalog:///catalog=cattle-global-data/mycharts&template=nginx&version=1.0.0';
      const result = parseHelmExternalId(id);

      expect(result.kind).toStrictEqual('catalog');
      expect(result.id).toStrictEqual(id);
      expect(result.template).toStrictEqual('nginx');
      expect(result.version).toStrictEqual('1.0.0');
      // catalog contains slash → replaced with colon for templateId prefix
      expect(result.templateId).toStrictEqual('cattle-global-data:mycharts-nginx');
      expect(result.templateVersionId).toStrictEqual('cattle-global-data:mycharts-nginx-1.0.0');
    });

    it('prepends cattle-global-data: prefix when catalog value has no slash', () => {
      const id = 'catalog:///catalog=mycharts&template=redis&version=2.0.0';
      const result = parseHelmExternalId(id);

      expect(result.templateId).toStrictEqual('cattle-global-data:mycharts-redis');
      expect(result.templateVersionId).toStrictEqual('cattle-global-data:mycharts-redis-2.0.0');
    });
  });
});
