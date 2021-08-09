import { HCI } from '@/config/types';
import { SOURCE_TYPE } from '@/config/map';

export function vmNetworks(spec, getters, errors, validatorArgs) {
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

    if (I.macAddress && !isValidMac(I.macAddress) && I.networkName !== 'management Network') {
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

    // if (this.value.isIpamStatic) {
    //   if (!this.value.cidr) {
    //     return this.getInvalidMsg('cidr');
    //   }
    // }

    // if (this.value.isIpamStatic && this.value.cidr) {
    //   this.validateCidr(this.value.cidr);
    // }
  });

  if (allNames.size !== interfaces.length) {
    errors.push(getters['i18n/t']('harvester.validation.vm.network.duplicatedName'));
  }

  return errors;
}

export function vmDisks(spec, getters, errors, validatorArgs) {
  const _volumes = spec.template.spec?.volumes || [];
  const _dataVolumeTemplates = spec?.dataVolumeTemplates || [];
  const _disks = spec.template.spec?.domain?.devices?.disks || [];
  const isVMTemplate = validatorArgs.includes('isVMTemplate');

  const allNames = new Set();

  _disks.forEach((D, idx) => {
    const prefix = D.name || _volumes[idx]?.name || idx + 1;

    if (!D.disk && !D.cdrom) {
      const message = getters['i18n/t']('harvester.validation.vm.volume.type');

      errors.push(getters['i18n/t']('harvester.validation.vm.volume.error', { prefix, message }));

      return allNames.add(D.name);
    }

    if (D.name?.length > 63) {
      const message = getters['i18n/t']('harvester.validation.custom.tooLongName', { max: 63 });

      errors.push(getters['i18n/t']('harvester.validation.vm.volume.error', { prefix, message }));
    }

    if (!D.name) {
      const message = getters['i18n/t']('harvester.validation.vm.name');

      errors.push(getters['i18n/t']('harvester.validation.vm.volume.error', { prefix, message }));
    }

    allNames.add(D.name);
  });

  if (allNames.size !== _disks.length) {
    errors.push(getters['i18n/t']('harvester.validation.vm.volume.duplicatedName'));
  }

  // volume type logic
  _volumes.forEach((V, idx) => {
    const { type, typeValue } = getVolumeType(V, _dataVolumeTemplates);
    const prefix = V.name || idx + 1;

    if (type === SOURCE_TYPE.NEW || type === SOURCE_TYPE.IMAGE) {
      if (!/([1-9]|[1-9][0-9]+)[a-zA-Z]+/.test(typeValue?.spec?.pvc?.resources?.requests?.storage)) {
        const message = getters['i18n/t']('harvester.validation.vm.volume.size');

        errors.push(getters['i18n/t']('harvester.validation.vm.volume.error', { prefix, message }));
      }

      if (type === SOURCE_TYPE.IMAGE && !typeValue?.spec?.pvc?.storageClassName && !isVMTemplate) { // type === SOURCE_TYPE.IMAGE
        if (idx === 0) {
          errors.push(getters['i18n/t']('harvester.validation.vm.volume.image'));
        } else {
          const message = getters['i18n/t']('harvester.validation.vm.volume.image');

          errors.push(getters['i18n/t']('harvester.validation.vm.volume.error', { prefix, message }));
        }
      }
    }

    if (type === SOURCE_TYPE.ATTACH_VOLUME) {
      const dvList = getters['virtual/all'](HCI.DATA_VOLUME);
      const hasExistingVolume = dvList.find(DV => DV.metadata.name === V?.dataVolume?.name);

      if (!hasExistingVolume) {
        const message = getters['i18n/t']('harvester.validation.vm.volume.volume');

        errors.push(getters['i18n/t']('harvester.validation.vm.volume.error', { prefix, message }));
      }
    }

    if (V?.containerDisk) {
      if (!V.containerDisk.image) {
        const message = getters['i18n/t']('harvester.validation.vm.volume.docker');

        errors.push(getters['i18n/t']('harvester.validation.vm.volume.error', { prefix, message }));
      }
    }
  });

  return errors;
}

export function vmMemoryUnit(spec, getters, errors, validatorArgs) {
  if (!/([1-9]|[1-9][0-9]+)[a-zA-Z]+/.test(spec)) {
    errors.push(getters['i18n/t']('harvester.validation.vm.memory'));
  }

  return errors;
}

export function isValidMac(value) {
  return /^[A-Fa-f0-9]{2}(-[A-Fa-f0-9]{2}){5}$|^[A-Fa-f0-9]{2}(:[A-Fa-f0-9]{2}){5}$/.test(value);
}

export function isValidCidr(value) {
  return !!/^(?:(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\/([1-9]|[1-2]\d|3[0-2])$/.test(value);
}

export function getVolumeType(V, DVTS) {
  let outValue = null;

  if (V.dataVolume) { // maybe is new or existing or image type, but existing type can’t find DVT
    // image type
    outValue = DVTS.find(DVT => V.dataVolume.name === DVT.metadata?.name && DVT.metadata?.annotations && Object.prototype.hasOwnProperty.call(DVT.metadata.annotations, 'harvesterhci.io/imageId'));

    if (outValue) {
      return {
        type:      SOURCE_TYPE.IMAGE,
        typeValue: outValue
      };
    }

    // new type
    outValue = DVTS.find(DVT => V.dataVolume.name === DVT.metadata?.name && DVT.spec?.source?.blank);

    if (outValue) {
      return {
        type:      SOURCE_TYPE.NEW,
        typeValue: outValue
      };
    }

    // existing, container type volume doesn't need validator
    return {
      type:      SOURCE_TYPE.ATTACH_VOLUME,
      typeValue: null
    };
  }

  return {};
}
