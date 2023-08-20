import { extend as veeExtend } from 'vee-validate';
import * as veeRules from 'vee-validate/dist/rules';

function extend(rule) {
  const veeRule = (veeRules || [])[rule];

  veeExtend(rule, {
    ...veeRule,
    params:  ['message'],
    message: '{message}'
  });
}

extend('required');

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
