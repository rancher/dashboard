const EXTERNAL_ID = {
  KIND_SEPARATOR:    '://',
  GROUP_SEPARATOR:   ':',
  BASE_SEPARATOR:    '*',
  ID_SEPARATOR:      ':',
  KIND_ALL:          'containers',
  SYSTEM_CATEGORIES: [
    'Rancher services'
  ],
  CATALOG_DEFAULT_GROUP: 'library',
};

/**
 * @typedef {object} ParsedExternalId
 * @property {string | null | undefined} kind - What kind of id this is supposed to be. `undefined`
 * on the old-style branch, which assigns `EXTERNAL_ID.KIND_CATALOG`, and `KIND_CATALOG` is not a key
 * of `EXTERNAL_ID`.
 * @property {string | null} group - For catalog, what group it's in.
 * @property {string | null} base - The part of the name before the base separator, when there is one.
 * @property {string | null} id - The actual external id.
 * @property {string | null} name - The chart name.
 * @property {string | null} version - The chart version, when the id carries one.
 * @property {string} [templateId] - `group:name`, only present when a name could be parsed out.
 */

/**
 * Parses externalIds on services.
 *
 * @param {string | null | undefined} externalId - The external id to parse.
 * @returns {ParsedExternalId} The parsed id. When `externalId` is falsy every field is null and
 * `templateId` is absent.
 */
export function parseExternalId(externalId) {
  let nameVersion;
  const out = {
    kind:    null,
    group:   null,
    base:    null,
    id:      null,
    name:    null,
    version: null,
  };

  if (!externalId) {
    return out;
  }

  let idx = externalId.indexOf(EXTERNAL_ID.KIND_SEPARATOR);

  if (idx >= 0) {
    // New style kind://[group:]id
    out.kind = externalId.substr(0, idx);

    const rest = externalId.substr(idx + EXTERNAL_ID.KIND_SEPARATOR.length);

    idx = rest.indexOf(EXTERNAL_ID.GROUP_SEPARATOR);
    out.id = rest;
    if (idx >= 0) {
      // With group kind://group/id
      out.group = rest.substr(0, idx);
      nameVersion = rest.substr(idx + 1);
    } else {
      // Without group kind://id
      if (out.kind === EXTERNAL_ID.KIND_CATALOG) {
        // For catalog kinds, we have a default group
        out.group = EXTERNAL_ID.CATALOG_DEFAULT_GROUP;
      }

      nameVersion = rest;
    }
  } else {
    const dashedIdx = externalId.lastIndexOf('-');

    // Old style just an ID
    out.kind = EXTERNAL_ID.KIND_CATALOG;
    const group = EXTERNAL_ID.CATALOG_DEFAULT_GROUP;
    const name = externalId.substr(0, dashedIdx);
    const version = externalId.substr(dashedIdx + 1);

    nameVersion = `${ name }${ EXTERNAL_ID.ID_SEPARATOR }${ version }`;
    // defaultgroup:extid:version
    out.id = `${ group }${ EXTERNAL_ID.GROUP_SEPARATOR }${ nameVersion }`;
    out.group = group;
  }

  if ( nameVersion ) {
    idx = nameVersion.lastIndexOf(EXTERNAL_ID.ID_SEPARATOR);
    let nameBase;

    if ( idx > 0 ) {
      out.version = nameVersion.substr(idx + 1);
      nameBase = nameVersion.substr(0, idx);
    } else {
      nameBase = nameVersion;
    }

    out.templateId = `${ out.group }${ EXTERNAL_ID.GROUP_SEPARATOR }${ nameBase }`;

    idx = nameBase.lastIndexOf(EXTERNAL_ID.BASE_SEPARATOR);
    if ( idx > 0 ) {
      out.base = nameBase.substr(0, idx);
      out.name = nameBase.substr(idx + 1);
    } else {
      out.name = nameBase;
    }
  }

  return out;
}

/**
 * @typedef {object} ParsedHelmExternalId
 * @property {string | null} kind - What kind of id this is supposed to be.
 * @property {string | null} group - For catalog, what group it's in.
 * @property {string | null} base - Unused by this format, kept so both parsers return the same fields.
 * @property {string | null} id - The external id, unchanged.
 * @property {string | null} name - Unused by this format, kept so both parsers return the same fields.
 * @property {string | null} version - The chart version, from the `version` pair of the id.
 * @property {string} [catalog] - The catalog, from the `catalog` pair of the id.
 * @property {string} [template] - The chart, from the `template` pair of the id.
 * @property {string} [templateId] - `catalog-template`, with the catalog namespaced.
 * @property {string} [templateVersionId] - `catalog-template-version`, with the catalog namespaced.
 */

/**
 * Parses the helm form of an externalId, `kind:///catalog=x&template=y&version=z`.
 *
 * @param {string | null | undefined} externalId - The external id to parse.
 * @returns {ParsedHelmExternalId} The parsed id. When `externalId` is falsy every field is null and
 * `catalog`, `template`, `templateId` and `templateVersionId` are absent. Note that a truthy id
 * without a `://` never assigns `out.catalog`, and the `catalog.includes('/')` below then throws.
 */
export function parseHelmExternalId(externalId) {
  const out = {
    kind:    null,
    group:   null,
    base:    null,
    id:      null,
    name:    null,
    version: null,
  };

  if (!externalId) {
    return out;
  }

  const idx = externalId.indexOf(EXTERNAL_ID.KIND_SEPARATOR);

  // not very smart but maybe doesn't need to be?
  if (idx >= 0) {
    out.kind = externalId.substr(0, idx);

    let rest = externalId.substr(idx + EXTERNAL_ID.KIND_SEPARATOR.length + 1);

    out.id = externalId;
    rest = rest.split('&');
    rest.forEach((it) => {
      const [nm, vl] = it.split('=');

      out[nm] = vl;
    });
  }

  let catalog = out.catalog;

  if ( catalog.includes('/') ) {
    catalog = catalog.replace('/', ':');
  } else {
    catalog = `cattle-global-data:${ catalog }`;
  }

  out.templateId = `${ catalog }-${ out.template }`;
  out.templateVersionId = `${ catalog }-${ out.template }-${ out.version }`;

  return out;
}
