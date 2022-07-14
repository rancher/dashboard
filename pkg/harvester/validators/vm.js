import { PVC } from '@shell/config/types';
import { SOURCE_TYPE } from '../config/harvester-map';
import { HCI as HCI_ANNOTATIONS } from '@shell/config/labels-annotations';

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

export function vmDisks(spec, getters, errors, validatorArgs, displayKey, value) {
  const isVMTemplate = validatorArgs.includes('isVMTemplate');
  const data = isVMTemplate ? this.value.spec.vm : value;

  let _volumeClaimTemplates = [];
  const volumeClaimTemplateString = data.metadata.annotations[HCI_ANNOTATIONS.VOLUME_CLAIM_TEMPLATE];

  try {
    _volumeClaimTemplates = JSON.parse(volumeClaimTemplateString);
  } catch (e) {}

  const _volumes = spec.template.spec.volumes || [];
  const _disks = spec.template.spec.domain.devices.disks || [];

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

  if (_volumes.length === 0) {
    errors.push(getters['i18n/t']('harvester.validation.vm.volume.needImageOrExisting'));
  }

  let requiredVolume = false;

  _volumes.forEach((V, idx) => {
    const { type, typeValue } = getVolumeType(V, _volumeClaimTemplates);
    const prefix = V.name || idx + 1;

    if ([SOURCE_TYPE.IMAGE, SOURCE_TYPE.ATTACH_VOLUME, SOURCE_TYPE.CONTAINER].includes(type)) { // root image
      // const message = getters['i18n/t']('harvester.validation.vm.volume.needImageOrExisting');
      requiredVolume = true;
      // errors.push(message);
    }

    if (type === SOURCE_TYPE.NEW || type === SOURCE_TYPE.IMAGE) {
      if (!/([1-9]|[1-9][0-9]+)[a-zA-Z]+/.test(typeValue?.spec?.resources?.requests?.storage)) {
        const message = getters['i18n/t']('harvester.validation.vm.volume.size');

        errors.push(getters['i18n/t']('harvester.validation.vm.volume.error', { prefix, message }));
      }

      if (type === SOURCE_TYPE.IMAGE && !typeValue?.spec?.storageClassName && !isVMTemplate) { // type === SOURCE_TYPE.IMAGE
        const message = getters['i18n/t']('harvester.validation.vm.volume.image');

        if (idx === 0) {
          errors.push(message);
        } else {
          errors.push(getters['i18n/t']('harvester.validation.vm.volume.error', { prefix, message }));
        }
      }
    }

    if (type === SOURCE_TYPE.ATTACH_VOLUME) {
      const allPVCs = getters['harvester/all'](PVC);
      const hasExistingVolume = allPVCs.find(P => P.metadata.name === V?.persistentVolumeClaim?.claimName);

      if (!hasExistingVolume) {
        const message = getters['i18n/t']('harvester.validation.vm.volume.volume');

        errors.push(getters['i18n/t']('harvester.validation.vm.volume.error', { prefix, message }));
      }
    }

    if (type === SOURCE_TYPE.CONTAINER && !V.containerDisk.image) {
      const message = getters['i18n/t']('harvester.validation.vm.volume.docker');

      errors.push(getters['i18n/t']('harvester.validation.vm.volume.error', { prefix, message }));
    }
  });

  if (!requiredVolume && !value.links) {
    const message = getters['i18n/t']('harvester.validation.vm.volume.needImageOrExisting');

    errors.push(message);
  }

  return errors;
}

export function isValidMac(value) {
  return /^[A-Fa-f0-9]{2}(-[A-Fa-f0-9]{2}){5}$|^[A-Fa-f0-9]{2}(:[A-Fa-f0-9]{2}){5}$/.test(value);
}

export function getVolumeType(V, DVTS) {
  let outValue = null;

  if (V.persistentVolumeClaim) {
    outValue = DVTS.find(DVT => V.persistentVolumeClaim.claimName === DVT.metadata.name && DVT.metadata?.annotations && Object.prototype.hasOwnProperty.call(DVT.metadata.annotations, 'harvesterhci.io/imageId'));

    if (outValue) {
      return {
        type:      SOURCE_TYPE.IMAGE,
        typeValue: outValue
      };
    }

    // new type
    outValue = DVTS.find(DVT => V.persistentVolumeClaim.claimName === DVT.metadata.name);

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

  if (V.containerDisk) {
    return {
      type:      SOURCE_TYPE.CONTAINER,
      typeValue: null
    };
  }

  return {};
}
