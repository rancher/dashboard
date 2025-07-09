import { indent as _indent } from '@shell/utils/string';
import { addObject, findBy, removeObject, removeObjects } from '@shell/utils/array';
import jsyaml from 'js-yaml';
import { cleanUp, isEmpty } from '@shell/utils/object';
import { parseType } from '@shell/models/schema';

export const SIMPLE_TYPES = [
  'string',
  'multiline',
  'masked',
  'password',
  'float',
  'int',
  'date',
  'blob',
  'boolean',
  'version'
];

const ALWAYS_ADD = [
  'apiVersion',
  'kind',
  'metadata',
  'metadata.name',
  'spec',
  'spec.selector',
  'spec.selector.matchLabels',
  'spec.template',
  'spec.template.metadata',
  'spec.template.metadata.labels',
  'spec.template.spec.containers.name',
  'spec.template.spec.containers.image',
];

export const NEVER_ADD = [
  'metadata.clusterName',
  'metadata.creationTimestamp',
  'metadata.deletionGracePeriodSeconds',
  'metadata.deletionTimestamp',
  'metadata.finalizers',
  'metadata.generateName',
  'metadata.generation',
  'metadata.initializers',
  'metadata.managedFields',
  'metadata.ownerReferences',
  'metadata.resourceVersion',
  'metadata.relationships',
  'metadata.selfLink',
  'metadata.state',
  'metadata.uid',
  // CRD -> Schema describes the schema used for validation, pruning, and defaulting of this version of the custom resource. If we allow processing we fall into inf loop on openAPIV3Schema.allOf which contains a cyclical ref of allOf props.
  'spec.versions.schema',
  'status',
  'stringData',
  'links',
  '_name',
  '_labels',
  '_annotations',
];

export const ACTIVELY_REMOVE = [
  'metadata.managedFields',
  'metadata.relationships',
  'metadata.state',
  'status',
  'links',
  'type',
  'id'
];

const INDENT = 2;

export function createYamlWithOptions(schemas, type, data, options) {
  return createYaml(
    schemas,
    type,
    data,
    true, 0, '', null,
    options
  );
}

export function createYaml(
  schemas,
  type,
  data,
  processAlwaysAdd = true,
  depth = 0,
  path = '',
  rootType = null,
  dataOptions = {},
) {
  data = data || {};

  let schema, rootSchema, schemaDefinitions, schemaResourceFields;

  if (depth === 0) {
    // `type` is a schema id
    schema = findBy(schemas, 'id', type);

    if ( !schema ) { // schema is only needed at the root level.
      return `Error loading schema for ${ type }`;
    }

    rootSchema = schema;

    schemaDefinitions = rootSchema.schemaDefinitions;
    schemaResourceFields = rootSchema.resourceFields;

    const attr = schema.attributes || {};

    // Default to data.apiVersion/kind to accommodate spoofed types that aggregate multiple types
    data.apiVersion = (attr.group ? `${ attr.group }/${ attr.version }` : attr.version) || data.apiVersion;
    data.kind = attr.kind || data.kind;
  } else {
    rootSchema = findBy(schemas, 'id', rootType);

    if (rootSchema.requiresResourceFields) { // See `requiresResourceFields` definition
      schemaDefinitions = rootSchema.schemaDefinitions;
      schemaResourceFields = schemaDefinitions[type]?.resourceFields;
    } else {
      schema = findBy(schemas, 'id', type);
      if ( !schema ) { // schema is only needed at the root level.
        return `Error loading schema for ${ type }`;
      }
      schemaResourceFields = schema.resourceFields;
    }
  }

  if ( !rootType ) {
    rootType = type;
  }

  const regularFields = [];

  if (processAlwaysAdd) {
    // Add all the parents of each key so that spec.template.foo.blah
    // causes 'spec', 'template' and 'foo' keys to be created
    const always = ALWAYS_ADD.slice();

    for ( let i = always.length - 1 ; i >= 0 ; i-- ) {
      let entry = always[i].split(/\./);

      while ( entry.length ) {
        addObject(always, entry.join('.'));
        entry = entry.slice(0, -1);
      }
    }

    // Mark always fields as regular so they're not commented out
    for ( const entry of always ) {
      const parts = entry.split(/\./);
      const key = parts[parts.length - 1];
      const prefix = parts.slice(0, -1).join('.');

      if ( prefix === path && schemaResourceFields && schemaResourceFields[key] ) {
        addObject(regularFields, key);
      }
    }
  }

  // Include all fields in schema's resourceFields as comments
  const commentFields = Object.keys(schemaResourceFields || {});

  commentFields.forEach((key) => {
    if ( typeof data[key] !== 'undefined' || (depth === 0 && key === '_type') ) {
      addObject(regularFields, key);
    }
  });

  // add any fields defined in data as uncommented fields in yaml
  for ( const key in data ) {
    if ( typeof data[key] !== 'undefined' ) {
      addObject(regularFields, key);
    }
  }

  // ACTIVELY_REMOVE are fields that should be removed even if they are defined in data
  for ( const entry of (dataOptions.activelyRemove || ACTIVELY_REMOVE) ) {
    const parts = entry.split(/\./);
    const key = parts[parts.length - 1];
    const prefix = parts.slice(0, -1).join('.');

    if ( prefix === path) {
      removeObject(regularFields, key);
    }
  }

  // NEVER_ADD are fields that should not be added as comments, but may added as regular fields if already defined in data
  for ( const entry of NEVER_ADD ) {
    const parts = entry.split(/\./);
    const key = parts[parts.length - 1];
    const prefix = parts.slice(0, -1).join('.');

    if ( prefix === path && schemaResourceFields && schemaResourceFields[key] ) {
      removeObject(commentFields, key);
    }
  }

  // do not include commented fields if already defined in data
  removeObjects(commentFields, regularFields);

  const regular = regularFields.map((k) => stringifyField(k));
  const comments = commentFields.map((k) => {
    // Don't add a namespace comment for types that aren't namespaced.
    if ( path === 'metadata' && k === 'namespace' ) {
      if ( rootSchema && !rootSchema.attributes?.namespaced ) {
        return null;
      }
    }

    return comment(stringifyField(k));
  });

  const out = [...regular, ...comments]
    .filter((x) => x !== null)
    .join('\n')
    .trim();

  return out;

  // ---------------

  function stringifyField(key) {
    const field = schemaResourceFields?.[key];
    let out = `${ key }:`;

    // '_type' in steve maps to kubernetes 'type' field; show 'type' field in yaml
    if (key === '_type') {
      out = 'type:';
    }

    // if a key on data is not listed in the schema's resourceFields, just convert it to yaml, add indents where needed, and return
    if ( !field ) {
      if (data[key]) {
        try {
          const cleaned = cleanUp(data);
          const parsedData = jsyaml.dump(cleaned[key]);

          if ( typeof data[key] === 'object' || Array.isArray(data[key]) ) {
            out += `\n${ indent(parsedData.trim()) }`;
          } else {
            out += ` ${ parsedData.trim() }`;
          }

          return out;
        } catch (e) {
          console.error(`Error: Unable to parse map data for yaml key: ${ key }`, e); // eslint-disable-line no-console
        }
      }

      return null;
    }

    const type = typeMunge(field.type);
    const mapOf = typeRef('map', type, field);
    const arrayOf = typeRef('array', type, field);
    const referenceTo = typeRef('reference', type);

    // type == map[mapOf]
    if ( mapOf ) {
      // if key is defined in data, convert the value to yaml, add newline+indent and add to output yaml string
      if (data[key]) {
        try {
          const cleaned = cleanUp(data);
          const parsedData = dumpBlock(cleaned[key], dataOptions[key]);

          out += `\n${ indent(parsedData) }`;
        } catch (e) {
          console.error(`Error: Unable to parse map data for yaml of type: ${ type }`, e); // eslint-disable-line no-console
        }
      }

      if ( SIMPLE_TYPES.includes(mapOf) ) {
        out += `#  key: ${ mapOf }`;
      } else {
        // If not a simple type ie some sort of object/array, recursively build out commented fields (note data = null here) per the type's (mapOf's) schema
        const chunk = createYaml(schemas, mapOf, null, processAlwaysAdd, depth + 1, (path ? `${ path }.${ key }` : key), rootType, dataOptions);
        let indented = indent(chunk);

        // convert "#    foo" to "#foo"
        indented = indented.replace(/^(#)?\s\s\s\s/, '$1');

        out += `${ indented }`;
      }

      return out;
    }

    // type == array[arrayOf]
    if ( arrayOf ) {
      if (data[key]) {
        try {
          const cleaned = cleanUp(data);

          if ( cleaned?.[key] ) {
            const parsedData = jsyaml.dump(cleaned[key]);

            out += `\n${ indent(parsedData.trim()) }`;
          }
        } catch (e) {
          console.error(`Error: Unable to parse array data for yaml of type: ${ type }`, e); // eslint-disable-line no-console
        }
      }

      if ( SIMPLE_TYPES.includes(arrayOf) ) {
        out += `\n#  - ${ arrayOf }`;
      } else {
        const chunk = createYaml(schemas, arrayOf, null, false, depth + 1, (path ? `${ path }.${ key }` : key), rootType, dataOptions);
        let indented = indent(chunk, 2);

        // turn "#        foo" into "#  - foo"
        indented = indented.replace(/^(#)?\s*\s\s([^\s])/, '$1  - $2');

        out += `\n${ indented }`;
      }

      return out;
    }

    if ( referenceTo ) {
      out += ` #${ referenceTo }`;

      return out;
    }

    if ( SIMPLE_TYPES.includes(type) ) {
      if (key === '_type' && typeof data[key] === 'undefined' && typeof data['type'] !== 'undefined') {
        out += ` ${ serializeSimpleValue(data['type']) }`;
      } else if ( typeof data[key] === 'undefined' ) {
        out += ` #${ serializeSimpleValue(type) }`;
      } else {
        out += ` ${ serializeSimpleValue(data[key]) }`;
      }

      return out;
    }

    /**
     * .spec is the type used for the Logging chart Output and ClusterOutput resource spec.
     * Without this Output and ClusterOutput specs are empty.
     */
    if ( type === 'json' || type === '.spec') {
      try {
        const parsedData = jsyaml.dump(data[key]);

        if (parsedData) {
          out += `\n${ indent(parsedData.trim()) }`;
        } else {
          out += ` #${ type }`;
        }

        return out;
      } catch (e) {
      }
    }

    const subDef = schemaDefinitions?.[type] || findBy(schemas, 'id', type);

    if ( subDef) {
      let chunk;

      if (subDef?.resourceFields && !isEmpty(subDef?.resourceFields)) {
        chunk = createYaml(schemas, type, data[key], processAlwaysAdd, depth + 1, (path ? `${ path }.${ key }` : key), rootType, dataOptions);
      } else if (data[key]) {
        // if there are no fields defined on the schema but there are in the data, just format data as yaml and add to output yaml
        try {
          const parsed = jsyaml.dump(data[key]);

          chunk = parsed.trim();
        } catch (e) {
          console.error(`Error: Unale to parse data for yaml of type: ${ type }`, e); // eslint-disable-line no-console
        }
      }

      out += `\n${ indent(chunk) }`;
    } else {
      out += ` #${ type }`;
    }

    return out;
  }
}

function comment(lines) {
  return (lines || '').split('\n').map((x) => `#${ x.replace(/#/g, '') }`).join('\n');
}

function indent(lines, depth = 1) {
  return _indent(lines, depth * INDENT, ' ', /^#/);
}

function serializeSimpleValue(data) {
  return jsyaml.dump(data).trim();
}

export function getBlockDescriptor(value, key) {
  const header = getBlockHeader(value, key);

  return {
    header,
    indentation: getBlockIndentation(header),
  };
}

/**
 *
 * @param {string} value the block of text to be parsed
 * @param {*} blockKey the key of the block
 * @returns the key + the block scalar indicators, see https://yaml-multiline.info - Block Scalars
 */
function getBlockHeader(value, blockKey) {
  const card = `(${ blockKey })[\\:][\\s|\\t]+[\\|\\>][\\d]*[\\-\\+]?`;
  const re = new RegExp(card, 'gi');

  const found = value.match(re);

  return found?.[0] || '';
}

/**
 *
 * @param {string} blockHeader the key + the block scalar indicators
 * @returns the indentation indicator from the block header, see https://yaml-multiline.info - Indentation
 */
function getBlockIndentation(blockHeader) {
  const blockScalars = blockHeader.substr(blockHeader.indexOf(':') + 1);

  const indentation = blockScalars.match(/\d+/);

  return indentation?.[0] || '';
}

/**
 * Check for a specific type and if valid return it's sub type or self
 * @param {string} type required type
 * @param {string} str actual type
 * @param {ResourceField} field resourceField entry to the actual type
 *
 * @returns the sub type, or if not found the type
 */
export function typeRef(type, str, field = null) {
  const [foundType, foundSubType] = parseType(str, field);

  if (type === foundType) {
    return typeMunge(foundSubType || foundType);
  }
}

export function typeMunge(type) {
  if ( type === 'integer' ) {
    return 'int';
  }

  if ( type === 'io.k8s.apimachinery.pkg.api.resource.Quantity' ) {
    return 'string';
  }

  return type;
}

export function saferDump(obj) {
  const out = jsyaml.dump(obj || {});

  if ( out === '{}\n' ) {
    return '';
  }

  return out;
}

/**
 * Handles newlines indicators in the multiline blocks.
 *
 * this is required since jsyaml.dump doesn't support chomping and scalar style at the moment.
 * see: https://github.com/nodeca/js-yaml/issues/171

 * @typedef {Object} DumpBlockOptions
 * @property {('>' | '|')} [scalarStyle] - The scalar style.
 * @property {('-' | '+' | '' | null)} [chomping] - The chomping style.
 *
 * @param {*} data the multiline block
 * @param {Object} options - Serialization options for jsyaml.dump.
 * @param {number} options.lineWidth - Set max line width. Set -1 for unlimited width.
 * @param {DumpBlockOptions} [options.dynamicProperties] - Options for dynamic properties.
 *   Developers can provide their own property names under `options`.
 *
 * @returns the result of jsyaml.dump with the addition of multiline indicators
 */
export function dumpBlock(data, options = { lineWidth: -1 }) {
  const parsed = jsyaml.dump(data, options);

  let out = parsed;

  const blockFields = Object.keys(data).filter((k) => {
    if (typeof data[k] === 'string') {
      return data[k].includes('\n');
    }
  });

  if (blockFields.length) {
    for (const key of blockFields) {
      const { header, indentation } = getBlockDescriptor(out, key);

      const scalarStyle = options[key]?.scalarStyle ?? '|';
      const chomping = options[key]?.chomping ?? '';

      /**
       * Replace the original block indicators with the ones provided in the options param
       */
      if (header) {
        out = out.replace(header, `${ key }: ${ scalarStyle }${ chomping }${ indentation }`);
      }
    }
  }

  return out;
}
