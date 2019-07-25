import { dasherize } from '@/utils/string';

export default class Definition {
  constructor(data) {
    Object.assign(this, data);
  }

  modelName() {
    const gvk = (this['x-kubernetes-group-version-kind'] || [])[0];

    if (gvk) {
      return dasherize(gvk.kind);
    }

    return 'base';
  }

  setKey(key) {
    Object.defineProperty(this, '_key', {
      configurable: true,
      writable:     true,
      value:        key,
    });
  }

  toString() {
    return this._key;
  }
}

/*
import { indent as _indent, dasherize } from '@/utils/string';

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

const NEVER_ADD  = [
  'status',
  'metadata.clusterName',
  'metadata.creationTimestamp',
  'metadata.clusterName',
  'metadata.deletionGracePeriodSeconds',
  'metadata.generateName',
  'metadata.generation',
  'metadata.deletionTimestamp',
  'metadata.finalizers',
  'metadata.initializers',
  'metadata.ownerReferences',
  'metadata.resourceVersion',
  'metadata.selfLink',
  'metadata.uid',
];

const INDENT = 2;

function comment(lines) {
  return (lines || '').split('\n').map((x) => `#${ x.replace(/^#/, '') }`).join('\n');
}

function indent(lines, depth = 1) {
  return _indent(lines, depth * INDENT, ' ', /^#/);
}

  createYaml(data, populate = true, depth = 0, path = '') {
    const self = this;

    // console.log('createYaml', this._key, data, populate, depth);
    data = data || {};

    const gvk = ( get(this, 'x-kubernetes-group-version-kind') || [])[0];

    if ( depth === 0 && gvk ) {
      const apiVersion = (gvk.group ? `${ gvk.group }/${ gvk.version }` : gvk.version);
      const kind = gvk.kind;

      data.apiVersion = apiVersion;
      data.kind = kind;
    }

    const regularFields = [];

    // Add all the parents of each key so that spec.template.foo.blah
    // causes 'spec', 'template' and 'foo' keys to be created
    let always = ALWAYS_ADD.slice();

    for ( let i = always.length - 1 ; i >= 0 ; i-- ) {
      let entry = always[i].split(/\./);

      while ( entry.length ) {
        always.addObject(entry.join('.'));
        entry = entry.slice(0, -1);
      }
    }

    always.forEach((entry) => {
      let parts = entry.split(/\./);
      let key = parts[parts.length - 1];
      let prefix = parts.slice(0, -1).join('.');

      if ( prefix === path && this.properties[key] ) {
        regularFields.addObject(key);
      }
    });

    const commentFields = Object.keys(this.properties);

    commentFields.forEach((key) => {
      if ( typeof data[key] !== 'undefined' ) {
        regularFields.addObject(key);
      }
    });

    NEVER_ADD.forEach((entry) => {
      let parts = entry.split(/\./);
      let key = parts[parts.length - 1];
      let prefix = parts.slice(0, -1).join('.');

      if ( prefix === path && this.properties[key] ) {
        commentFields.removeObject(key);
      }
    });

    commentFields.removeObjects(regularFields);

    let regular = regularFields.map((key) => {
      return stringifyField(key);
    })

    const comments = commentFields.map((key) => {
      return comment(stringifyField(key));
    });

    let out = regular.join('\n');

    out += '\n';
    out += comments.join('\n');

    return out.trim();

    // ---------------

    function stringifyField(key) {
      const field = self.properties[key];

      let out = `${ key }: `;

      if ( !field ) {
        // Not much to do here...
      } else if ( field.items ) {
        if ( field.items.type === 'object' ) {
          out += `\n#  key: val`;
        } else if ( field.items.type ) {
          out +=  `\n#  - ${ field.items.type }`;
        } else if ( field.items['$ref'] ) {
          const subDef = get(self, 'definitions').getRef(field.items['$ref']);
          const chunk = subDef.createYaml(null, populate, depth + 1, (path ? `${ path }.${ key }` : key));

          out += `\n  - ${ indent(chunk, 2).substr(4) }`;
        }
      } else if ( field.type ) {
        if ( field.type === 'object' ) {
          if ( data[key] ) {
            // @TODO serialize it somehow..
          } else {
            out += `\n#  key: val`;
          }
        } else if ( typeof data[key] !== 'undefined' ) {
          out += data[key];
        } else {
          out +=  ` #${ field.type }`;
        }
      } else if ( field['$ref'] ) {
        const subDef = get(self, 'definitions').getRef(field['$ref']);

        if ( subDef && subDef.properties ) {
          const chunk = subDef.createYaml(data[key], populate, depth + 1, (path ? `${ path }.${ key }` : key));

          out += `\n${ indent(chunk) }`;
        }
      }

      return out;
    }
  },

  createInstance(data, populate = true, root = true) {
    console.log('createInstance', this._key, data, root);
    data = data || {};

    const gvk = ( get(this, 'x-kubernetes-group-version-kind') || [])[0];

    if ( root && gvk ) {
      const apiVersion = `${ gvk.group }/${ gvk.version }`;
      const kind = gvk.kind;

      data.apiVersion = apiVersion;
      data.kind = kind;
    }

    const fields = Object.keys(this.properties);

    ALWAYS_ADD.forEach((key) => {
      if ( this.properties[key] ) {
        fields.addObject(key);
      }
    });

    if ( !root ) {
      fields.removeObjects(IF_ROOT_ADD);
    }

    fields.removeObjects(NEVER_ADD);

    fields.forEach((key) => {
      if ( data[key] ) {
        return;
      }

      const field = this.properties[key];

      if ( field['$ref'] ) {
        const subDef = get(this, 'definitions').getRef(field['$ref']);

        if ( subDef && subDef.properties ) {
          data[key] = subDef.createInstance(data[key], true, false);
        }
      } else if ( field.items && field.items['$ref'] ) {
        const subDef = get(this, 'definitions').getRef(field.items['$ref']);

        if ( subDef && subDef.properties ) {
            const subObj = subDef.createInstance(null, true, false);
            if ( Object.keys(subObj).length ) {
              data[key] = [ subObj ];
            }

          data[key] = [];
        }
      }
    });

    if ( root && data && data.metadata && !data.metadata.name ) {
      data.metadata.name = '';
    }

    const out = get(this, 'store').createRecord(get(this, 'modelName'), data);

    Object.defineProperty(out, '_definition', {
      configurable: true,
      value:        this,
    });

    return out;
  },
  */
