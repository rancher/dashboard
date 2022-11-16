import { imageUrl, fileRequired } from './vm-image';
import { vmNetworks, vmDisks } from './vm';
import { dataVolumeSize } from './vm-datavolumes';
import { backupTarget } from './setting';
import { volumeSize } from './volume';

export default {
  imageUrl,
  dataVolumeSize,
  vmNetworks,
  vmDisks,
  fileRequired,
  backupTarget,
  volumeSize
};
