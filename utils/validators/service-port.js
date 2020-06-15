import { isEmpty } from 'lodash';
import { validateDnsLabel } from '@/utils/validators';

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
        /* [rfc6335](https://tools.ietf.org/rfc/rfc6335.txt) port name (IANA_SVC_NAME)
          An alphanumeric (a-z, and 0-9) string, with a maximum length of 15 characters,
          with the '-' character allowed anywhere except the first or the last character or adjacent to another '-' character,
          it must contain at least a(a - z) character
          validateChars(str, { validChars: 'A-Za-z0-9_.-' }, displayKey, intl, errors); */
        const opts = {
          ianaServiceName: true,
          maxLength:       15,
          validChars:      'A-Za-z0-9-',
        };
        const isIanaServiceNameErrors = validateDnsLabel(targetPort, tpIanaDisplayKey, getters, opts, errors);

        if (!isEmpty(isIanaServiceNameErrors)) {
          errors.push(...isIanaServiceNameErrors);
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
