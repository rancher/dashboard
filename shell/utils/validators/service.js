import isEmpty from 'lodash/isEmpty';
import { validateDnsLabel, validateHostname } from '@shell/utils/validators';

export function servicePort(spec, getters, errors, validatorArgs) {
  const { ports, type: serviceType } = spec;

  if (serviceType === 'ExternalName') {
    return errors;
  }

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

    if (!isEmpty(name)) {
      const nameErrors = validateDnsLabel(name, 'name', getters, undefined, errors);

      if (!isEmpty(nameErrors)) {
        if (errors.length && errors.length > 0) {
          errors = [...errors, ...nameErrors];
        } else {
          errors = nameErrors;
        }
      }
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
      const tpIanaDisplayKey = getters['i18n/t']('validation.service.ports.targetPort.ianaAt', { position: idx });
      const tp = parseInt(targetPort, 10);
      const tpTest = new RegExp('^\\d+$');
      const targetPortIsNumber = tpTest.test(targetPort);

      if (!targetPortIsNumber) { // not a number
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

export function clusterIp(spec, getters, errors, validatorArgs) {
  /*
    clusterIP is the IP address of the service and is usually assigned randomly by the master.
    If an address is specified manually and is not in use by others, it will be allocated to the service; otherwise, creation of the service will fail.
    This field can not be changed through updates.
    Valid values are \"None\", empty string (\"\"), or a valid IP address. \"None\" can be specified for headless services when proxying is not required.
    Only applies to types ClusterIP, NodePort, and LoadBalancer. Ignored if type is ExternalName.
    More info: https://kubernetes.io/docs/concepts/services-networking/service/#virtual-ips-and-service-proxies
  */
  const typesToCheck = ['ClusterIP', 'NodePort', 'LoadBalancer'];
  const serviceType = spec?.type;

  if (!typesToCheck.includes(serviceType)) {
    // validation only applies to services in the types to check
    return errors;
  }

  return errors;
}

export function externalName(spec, getters, errors, validatorArgs) {
  /*
  externalName is the external reference that kubedns or equivalent will return as a CNAME record for this service.
  No proxying will be involved.
  Must be a valid RFC-1123 hostname (https://tools.ietf.org/html/rfc1123) and requires Type to be ExternalName.
  */
  if (spec?.type === 'ExternalName') {
    if (isEmpty(spec?.externalName)) {
      errors.push(getters['i18n/t']('validation.service.externalName.none'));
    } else {
      const hostNameErrors = validateHostname(spec.externalName, 'ExternalName', getters, undefined, errors);

      if (!isEmpty(hostNameErrors)) {
        if (errors.length && errors.length > 0) {
          errors = [...errors, ...hostNameErrors];
        } else {
          errors = hostNameErrors;
        }
      }
    }
  }

  return errors;
}
