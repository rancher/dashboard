import { DESCRIPTION } from '@shell/config/labels-annotations';
import HybridModel from './hybrid-class';
import { NEVER_ADD } from '@shell/utils/create-yaml';
import { deleteProperty, get } from '@shell/utils/object';
import { DNS_LIKE_TYPES } from '../dashboard-store/resource-class';

import { coerceStringTypeToScalarType } from '@shell/utils/string';
import {
  displayKeyFor,
  validateBoolean,
  validateChars,
  validateDnsLikeTypes,
  validateLength,
} from '@shell/utils/validators';
import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';
import uniq from 'lodash/uniq';
import Vue from 'vue';

import { normalizeType } from '../dashboard-store/normalize';

// Some fields that are removed for YAML (NEVER_ADD) are required via API
const STEVE_ADD = [
  'metadata.resourceVersion',
  'metadata.fields',
  'metadata.clusterName',
  'metadata.deletionGracePeriodSeconds',
  'metadata.generateName',
];
const STEVE_NEVER_SAVE = NEVER_ADD.filter((na) => !STEVE_ADD.includes(na));

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

export default class SteveModel extends HybridModel {
  get name() {
    return this.metadata?.name || this._name;
  }

  get namespace() {
    return this.metadata?.namespace;
  }

  get description() {
    return this.metadata?.annotations?.[DESCRIPTION] || this.spec?.description || this._description;
  }

  /**
   * Set description based on the type of model available with private fallback
   */
  set description(value) {
    if (this.metadata?.annotations) {
      this.metadata.annotations[DESCRIPTION] = value;
    }

    if (this.spec) {
      this.spec.description = value;
    }

    this._description = value;
  }

  cleanForSave(data, forNew) {
    const val = super.cleanForSave(data);

    for (const field of STEVE_NEVER_SAVE) {
      deleteProperty(val, field);
    }

    return val;
  }

  /**
   * Check this instance is valid against
   * - the schema's resource fields
   *   - this is done by fetching the
   * - also calls super.validationErrors
   */
  async validationErrors(data = this, opt = { // TODO: RC (re)test
    ignoreFields:      undefined,
    skipResourceField: undefined
  }) {
    const errors = [];
    const {
      type: originalType,
      schema
    } = data;
    const { ignoreFields, skipResourceField } = opt;
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

    if (!skipResourceField) {
      // Interestingly this only does the top level resourceFields (no recursion)

      await schema.fetchResourceFields();
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

        if ( ignoreFields && ignoreFields.includes(key) ) {
          continue;
        }

        if ( val === undefined ) {
          val = null;
        }

        if (valIsString) {
          if (fieldType) {
            Vue.set(data, key, coerceStringTypeToScalarType(val, fieldType));
          }

          // Empty strings on nullable string fields -> null
          if ( field.nullable && val.length === 0 && STRING_LIKE_TYPES.includes(fieldType)) {
            val = null;

            Vue.set(data, key, val);
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

            Vue.set(data, key, val);
          }

          fieldErrors.push(...validateDnsLikeTypes(val, fieldType, displayKey, this.$rootGetters, fieldErrors));
        }
        errors.push(...fieldErrors);
      }
    }

    const rootErrors = super.validationErrors(this, opt);

    return uniq([...errors, ...rootErrors]);
  }
}
