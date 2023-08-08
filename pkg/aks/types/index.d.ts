type AKSPoolMode = 'System' | 'User'

type AKSDiskType = 'Managed' | 'Ephemeral'

export interface AKSNodePool {
  availabilityZones?: String[],
  count?: Number,
  enableAutoScaling?: Boolean,
  maxPods?: Number,
  maxSurge?: String,
  minCount?: Number,
  maxCount?: Number,
  mode?: AKSPoolMode,
  name?: String,
  nodeLabels?: Object,
  nodeTaints?: String[], // TODO nb shape of node taints?
  orchestratorVersion?: String,
  osDiskSizeGB?: Number,
  osDiskType?: AKSDiskType,
  osType?: String, // TODO nb is this ever configurable?
  type?: String,
  vmSize?: String,
  _isNew?: Boolean,
  _id?: String
}
