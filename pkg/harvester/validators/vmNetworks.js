export default function vmNetworks(spec, getters, errors, validatorArgs) {
  const { domain: { devices: { interfaces } }, networks } = spec;
  const allNames = new Set();

  interfaces.map( (I, index) => {
    allNames.add(I.name);
    const N = networks.find( N => I.name === N.name);
    const prefix = (I.name || N.name) || index + 1;

    if (I.name.length > 20) {
      const message = getters['i18n/t']('harvester.validation.custom.tooLongName', { max: 20 });

      errors.push(getters['i18n/t']('harvester.validation.vm.network.error', { prefix, message }));
    }

    if (!I.name || !N.name) {
      const message = getters['i18n/t']('harvester.validation.vm.name');

      errors.push(getters['i18n/t']('harvester.validation.vm.network.error', { prefix, message }));
    }

    if (N.multus) {
      if (!N.multus.networkName) {
        const message = getters['i18n/t']('harvester.validation.vm.network.name');

        errors.push(getters['i18n/t']('harvester.validation.vm.network.error', { prefix, message }));
      }
    }

    if (I.macAddress && !isValidMac(I.macAddress) && !N.pod) {
      const message = getters['i18n/t']('harvester.validation.vm.network.macFormat');

      errors.push(getters['i18n/t']('harvester.validation.vm.network.error', { prefix, message }));
    }

    const portsName = new Set();
    const portsNumber = new Set();

    if (I.masquerade && I.ports) {
      const ports = I?.ports || [];

      ports.forEach((P) => {
        portsName.add(P.name);
        portsNumber.add(P.port);
      });

      if (portsName.size !== I.ports.length) {
        const message = getters['i18n/t']('harvester.validation.vm.network.duplicatedPortName');

        errors.push(getters['i18n/t']('harvester.validation.vm.network.error', { prefix, message }));
      }

      if (portsNumber.size !== I.ports.length) {
        const message = getters['i18n/t']('harvester.validation.vm.network.duplicatedPortNumber');

        errors.push(getters['i18n/t']('harvester.validation.vm.network.error', { prefix, message }));
      }
    }
  });

  if (allNames.size !== interfaces.length) {
    errors.push(getters['i18n/t']('harvester.validation.vm.network.duplicatedName'));
  }

  return errors;
}

function isValidMac(value) {
  return /^[A-Fa-f0-9]{2}(-[A-Fa-f0-9]{2}){5}$|^[A-Fa-f0-9]{2}(:[A-Fa-f0-9]{2}){5}$/.test(value);
}
