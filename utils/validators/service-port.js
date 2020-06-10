import { isEmpty } from 'lodash';
import {
  validateLength,
  validateChars,
} from '@/utils/validators';

export function servicePort(ports, getters, errors, validatorArgs) {
  if (isEmpty(ports)) {
    errors.push(getters['i18n/t']('validation.required', { key: 'Port Rules' }));

    return errors;
  }

  ports.forEach((port, ind, ary) => {
    const {
      name,
      nodePort,
      port: pPort,
      targetPort,
    } = port;
    const idx = ind + 1;

    if (ary.length > 1 && isEmpty(name)) {
      errors.push(getters['i18n/t']('validation.service.ports.name.required', { position: idx }));
    }

    if (nodePort) {
      const np = parseInt(nodePort, 10);

      if (isNaN(np)) {
        errors.push(getters['i18n/t']('validation.service.ports.nodePort.requiredInt', { position: idx }));
      }
    }

    if (pPort) {
      const p = parseInt(pPort, 10);

      if (isNaN(p)) {
        errors.push(getters['i18n/t']('validation.service.ports.port.requiredInt', { position: idx }));
      }
    } else {
      errors.push(getters['i18n/t']('validation.service.ports.port.required', { position: idx }));
    }

    if (targetPort) {
      const tp = parseInt(targetPort, 10);

      if (isNaN(tp)) {
        const tpIanaDisplayKey = getters['i18n/t']('validation.service.ports.targetPort.ianaAt', { position: idx });
        const isIanaServiceName = validateIanaServiceName(targetPort, tpIanaDisplayKey, getters, errors);

        if (!isIanaServiceName) {
          errors.push(getters['i18n/t']('validation.service.ports.targetPort.iana', { position: idx }));
        }
      } else if (tp < 1 || tp > 65535) {
        errors.push(getters['i18n/t']('validation.service.ports.targetPort.between', { position: idx }));
      }
    } else {
      errors.push(getters['i18n/t']('validation.service.ports.targetPort.required', { position: idx }));
    }
  });

  return errors;
}

export function validateIanaServiceName(val, displayKey, getters, errors) {
  /* [rfc6335](https://tools.ietf.org/rfc/rfc6335.txt) port name (IANA_SVC_NAME)
  An alphanumeric (a-z, and 0-9) string, with a maximum length of 15 characters,
  with the '-' character allowed anywhere except the first or the last character or adjacent to another '-' character,
  it must contain at least a(a - z) character
  validateChars(str, { validChars: 'A-Za-z0-9_.-' }, displayKey, intl, errors); */
  const field = {
    maxLength:  15,
    validChars: 'A-Za-z0-9-',
  };

  validateLength(val, field, displayKey, getters, errors);
  validateChars(val, field, displayKey, getters, errors);

  // can't start or end with a hyphen or have more then a single consecutive hyphen
  const testDashesBackToBack = new RegExp(/^(?!-)[a-z]*[^-\n]$/, 'gi');

  if (!val.match(testDashesBackToBack)) {
    errors.push(getters['i18n/t']('validation.service.ports.targetPort.ianaDoubleDashError', { displayKey }));
  }

  return errors;
}
