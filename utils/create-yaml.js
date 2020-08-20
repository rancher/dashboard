import { indent as _indent } from '@/utils/string';
import { addObject, removeObject, removeObjects } from '@/utils/array';
import jsyaml from 'js-yaml';
import { cleanUp } from '@/utils/object';

const SIMPLE_TYPES = [
  'string',
  'multiline',
  'masked',
  'password',
  'float',
  'int',
  'date',
  'blob',
  'boolean',
  'json',
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

const NEVER_ADD = [
  'status',
  'metadata.clusterName',
  'metadata.creationTimestamp',
  'metadata.clusterName',
  'metadata.deletionGracePeriodSeconds',
  'metadata.managedFields',
  'metadata.generateName',
  'metadata.generation',
  'metadata.deletionTimestamp',
  'metadata.finalizers',
  'metadata.initializers',
  'metadata.ownerReferences',
  'metadata.resourceVersion',
  'metadata.selfLink',
  'metadata.uid',
  'stringData'
];

const INDENT = 2;

export function createYaml(schemas, type, data, populate = true, depth = 0, path = '') {
  const schema = schemas.find(x => x.id === type);

  if ( !schema ) {
    throw new Error('Unknown schema for', type);
  }

  data = data || {};

  if ( depth === 0 ) {
    const attr = schema.attributes || {};

    data.apiVersion = (attr.group ? `${ attr.group }/${ attr.version }` : attr.version);
    data.kind = attr.kind;
  }

  const regularFields = [];

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

    if ( prefix === path && schema.resourceFields && schema.resourceFields[key] ) {
      addObject(regularFields, key);
    }
  }

  // Mark any fields that are passed in as data as regular so they're not commented out
  const commentFields = Object.keys(schema.resourceFields || {});

  commentFields.forEach((key) => {
    if ( typeof data[key] !== 'undefined' || key === '_type' ) {
      addObject(regularFields, key);
    }
  });

  NEVER_ADD.forEach((entry) => {
    const parts = entry.split(/\./);
    const key = parts[parts.length - 1];
    const prefix = parts.slice(0, -1).join('.');

    if ( prefix === path && schema.resourceFields && schema.resourceFields[key] ) {
      removeObject(commentFields, key);
    }
  });

  removeObjects(commentFields, regularFields);

  const regular = regularFields.map((key) => {
    return stringifyField(key);
  });

  const comments = commentFields.map((key) => {
    return comment(stringifyField(key));
  });

  const out = [...regular, ...comments].join('\n').trim();

  return out;

  // ---------------

  function typeRef(type, str) {
    const re = new RegExp(`^${ type }\\[(.*)\\]$`);
    const match = str.match(re);

    if ( match ) {
      return typeMunge(match[1]);
    }
  }

  function typeMunge(type) {
    if ( type === 'integer' ) {
      return 'int';
    }

    if ( type === 'io.k8s.apimachinery.pkg.api.resource.Quantity' ) {
      return 'string';
    }

    return type;
  }

  function stringifyField(key) {
    const field = schema.resourceFields[key];
    const type = typeMunge(field.type);
    const mapOf = typeRef('map', type);
    const arrayOf = typeRef('array', type);
    const referenceTo = typeRef('reference', type);

    let out = `${ key }:`;

    // '_type' in steve maps to kubernetes 'type' field; show 'type' field in yaml
    if (key === '_type') {
      out = 'type:';
    }

    if ( !field ) {
      // Not much to do here...
      return null;
    }

    if ( mapOf ) {
      if (data[key]) {
        try {
          const cleaned = cleanUp(data);
          const parsedData = jsyaml.safeDump(cleaned[key]);

          out += `\n${ indent(parsedData.trim()) }`;
        } catch (e) {
          console.error(`Error: Unale to parse map data for yaml of type: ${ type }`, e); // eslint-disable-line no-console
        }
      }

      if ( SIMPLE_TYPES.includes(mapOf) ) {
        out += `\n#  key: ${ mapOf }`;
      } else {
        const chunk = createYaml(schemas, mapOf, null, populate, depth + 1, (path ? `${ path }.${ key }` : key));
        let indented = indent(chunk, 2);

        indented = indented.replace(/^(#)?\s\s\s\s/, '$1');

        out += `\n  ${ indented }`;
      }

      return out;
    }

    if ( arrayOf ) {
      if (data[key]) {
        try {
          const cleaned = cleanUp(data);
          const parsedData = jsyaml.safeDump(cleaned[key]);

          out += `\n${ indent(parsedData.trim()) }`;
        } catch (e) {
          console.error(`Error: Unale to parse array data for yaml of type: ${ type }`, e); // eslint-disable-line no-console
        }
      }

      if ( SIMPLE_TYPES.includes(arrayOf) ) {
        out += `\n#  - ${ arrayOf }`;
      } else {
        const chunk = createYaml(schemas, arrayOf, null, populate, depth + 1, (path ? `${ path }.${ key }` : key));
        let indented = indent(chunk, 2);

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
        out += ` ${ data['type'] }`;
      } else if ( typeof data[key] === 'undefined' ) {
        out += ` #${ type }`;
      } else {
        out += ` ${ data[key] }`;
      }

      return out;
    }

    const subDef = schemas.find(x => x.id === type);

    if ( subDef ) {
      const chunk = createYaml(schemas, type, data[key], populate, depth + 1, (path ? `${ path }.${ key }` : key));

      out += `\n${ indent(chunk) }`;
    } else {
      out += ` #${ type }`;
    }

    return out;
  }
}

function comment(lines) {
  return (lines || '').split('\n').map(x => `#${ x.replace(/#/g, '') }`).join('\n');
}

function indent(lines, depth = 1) {
  return _indent(lines, depth * INDENT, ' ', /^#/);
}
