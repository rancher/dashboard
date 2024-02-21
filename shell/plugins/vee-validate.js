import { extend as veeExtend } from 'vee-validate';
import * as veeRules from 'vee-validate/dist/rules';
import formRulesGenerator from '@shell/utils/validators/formRules/index';
import CustomValidators from '@shell/utils/custom-validators';

export function extend(rule) {
  const veeRule = (veeRules || [])[rule];

  veeExtend(rule, {
    ...veeRule,
    params:  ['message'],
    message: '{message}'
  });
}

export function create(rule, args) {
  veeExtend(rule, {
    params:  ['message'],
    message: '{message}',
    ...args,
  });
}

extend('required');

/**
 * Define new rules using the new pattern
 */
create('test-new-validator', {
  validate: (value) => {
    return !!value;
  },
  computesRequired: true,
});

/**
 * Extend DefaultValidators rules using the old pattern
 */
Object.keys(formRulesGenerator(null, { key: 'value' })).forEach((rule) => {
  // ToDo extend default rules here
});

/**
 * Extend CustomValidators rules using the old pattern
 */
Object.keys(CustomValidators).forEach((rule) => {
  create(rule, {
    params:   ['getters'], // Could be used in validate() API ?
    validate: (value, params) => {
      const errors = [];

      // params.path is 'spec' in this case
      const _value = params?.path ? value.value[params.path] : value.value;

      if (_value !== undefined) {
        CustomValidators[rule](_value, { 'i18n/t': () => 'dummy' }, errors);
      }

      return !errors.length;
    },

    message: (_, params) => {
      const errors = [];

      // params.path is 'spec' in this case
      const _value = params._value_.value;

      if (_value !== undefined) {
        CustomValidators[rule](_value, params._value_.getters, errors);
      }

      return errors;
    },

    computesRequired: true,
  });
});

/**
 * Importing all rules (see docs)
 */
// for (const [rule, validation] of Object.entries(rules)) {
//   if (rule === 'required') {
//     extend(rule, {
//       ...validation,
//       params:  ['message'],
//       message: '{message}'
//     });
//   }
// }

// extend('example', {
//   validate(value, { min, max }) {
//     debugger;

//     return value.length >= min && value.length <= max;
//   },
//   params:  ['min', 'max'],
//   message: 'The {_field_} field must have at least {min} characters and {max} characters at most'
// });

// extend(rule, {
//   ...validation,
//   validate(value, { message }) {
//     const isValid = validation.validate(value);

//     console.log(message);

//     return isValid.valid;
//   },
//   params:  ['message'],
//   message: '{message}'
// });

/**
 * Custom Rules
 */
