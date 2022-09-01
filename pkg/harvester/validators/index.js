import { imageUrl, fileRequired } from './vm-image';
import { vmNetworks, vmDisks } from './vm';
import { dataVolumeSize } from './vm-datavolumes';
import { backupTarget } from './setting';

export default {
  imageUrl,
  dataVolumeSize,
  vmNetworks,
  vmDisks,
  fileRequired,
  backupTarget
};
