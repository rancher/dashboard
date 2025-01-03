import { ANNOTATIONS_TO_IGNORE_REGEX, LABELS_TO_IGNORE_REGEX } from '@shell/config/labels-annotations';
import pickBy from 'lodash/pickBy';
import { findBy } from '@shell/utils/array';
import { matchesSomeRegex, coerceStringTypeToScalarType } from '@shell/utils/string';
import Resource, { DNS_LIKE_TYPES } from '@shell/plugins/dashboard-store/resource-class';
import { get } from '@shell/utils/object';
import {
  displayKeyFor,
  validateBoolean,
  validateChars,
  validateDnsLikeTypes,
  validateLength,
} from '@shell/utils/validators';
import { normalizeType } from '@shell/plugins/dashboard-store/normalize';
import isString from 'lodash/isString';
import uniq from 'lodash/uniq';

import isEmpty from 'lodash/isEmpty';

const STRING_LIKE_TYPES = [
  'string',
  'date',
  'blob',
  'enum',
  'multiline',
  'masked',
  'password',
  'dnsLabel',
  'hostname',
];

export default class NormanModel extends Resource {
  setLabels(val) {
    const all = this.labels || {};
    const wasIgnored = pickBy(all, (value, key) => {
      return matchesSomeRegex(key, LABELS_TO_IGNORE_REGEX);
    });

    this['labels'] = { ...wasIgnored, ...val };
  }

  setLabel(key, val) {
    if ( val ) {
      if ( !this.labels ) {
        this.labels = {};
      }

      this.labels[key] = val;
    } else if ( this.labels ) {
      this.labels[key] = undefined;
      delete this.labels[key];
    }
  }

  setAnnotations(val) {
    const all = this.annotations || {};
    const wasIgnored = pickBy(all, (value, key) => {
      return matchesSomeRegex(key, ANNOTATIONS_TO_IGNORE_REGEX);
    });

    this['annotations'] = { ...wasIgnored, ...val };
  }

  setAnnotation(key, val) {
    if ( val ) {
      if ( !this.annotations ) {
        this.annotations = {};
      }

      this.annotations[key] = val;
    } else if ( this.annotations ) {
      this.annotations[key] = undefined;
      delete this.annotations[key];
    }
  }

  setResourceQuotas(spec) {
    const keys = ['resourceQuota', 'namespaceDefaultResourceQuota'];

    keys.forEach((key) => {
      this[key] = { ...spec[key] };
    });
  }

  isCondition(condition, withStatus = 'True') {
    if ( !this.conditions ) {
      return false;
    }

    const entry = findBy((this.conditions || []), 'type', condition);

    if ( !entry ) {
      return false;
    }

    if ( !withStatus ) {
      return true;
    }

    return (entry.status || '').toLowerCase() === `${ withStatus }`.toLowerCase();
  }

  /**
   * Check this instance is valid against
   * - the schema's resource fields
   * - also calls super.validationErrors
   */
  validationErrors(data = this, opt = { ignoreFields: undefined }) {
    const errors = [];
    const {
      type: originalType,
      schema
    } = data;
    const type = normalizeType(originalType);

    if ( !originalType ) {
      // eslint-disable-next-line
      console.warn(this.t('validation.noType'), data);

      return errors;
    }

    if ( !schema ) {
      // eslint-disable-next-line
      // console.warn(this.t('validation.noSchema'), originalType, data);

      return errors;
    }

    const fields = schema.resourceFields || {};
    const keys = Object.keys(fields);
    let field, key, val, displayKey;

    for ( let i = 0 ; i < keys.length ; i++ ) {
      const fieldErrors = [];

      key = keys[i];
      field = fields[key];
      val = get(data, key);
      displayKey = displayKeyFor(type, key, this.$rootGetters);

      const fieldType = field?.type ? normalizeType(field.type) : null;
      const valIsString = isString(val);

      if ( opt.ignoreFields && opt.ignoreFields.includes(key) ) {
        continue;
      }

      if ( val === undefined ) {
        val = null;
      }

      if (valIsString) {
        if (fieldType) {
          data[key] = coerceStringTypeToScalarType(val, fieldType);
        }

        // Empty strings on nullable string fields -> null
        if ( field.nullable && val.length === 0 && STRING_LIKE_TYPES.includes(fieldType)) {
          val = null;

          data[key] = val;
        }
      }
      if (fieldType === 'boolean') {
        validateBoolean(val, field, displayKey, this.$rootGetters, fieldErrors);
      } else {
        validateLength(val, field, displayKey, this.$rootGetters, fieldErrors);
        validateChars(val, field, displayKey, this.$rootGetters, fieldErrors);
      }

      if (fieldErrors.length > 0) {
        fieldErrors.push(this.t('validation.required', { key: displayKey }));
        errors.push(...fieldErrors);
        continue;
      }

      // IDs claim to be these but are lies...
      if ( key !== 'id' && !isEmpty(val) && DNS_LIKE_TYPES.includes(fieldType) ) {
        // DNS types should be lowercase
        const tolower = (val || '').toLowerCase();

        if ( tolower !== val ) {
          val = tolower;

          data[key] = val;
        }

        fieldErrors.push(...validateDnsLikeTypes(val, fieldType, displayKey, this.$rootGetters, fieldErrors));
      }
      errors.push(...fieldErrors);
    }

    const rootErrors = super.validationErrors(this, opt);

    return uniq([...errors, ...rootErrors]);
  }
}
