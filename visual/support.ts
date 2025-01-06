import { addMatchImageSnapshotCommand } from '@emerson-eps/cypress-image-snapshot/command'
import { CypressImageSnapshotOptions } from '@emerson-eps/cypress-image-snapshot/types';

const options = {
  failureThreshold: 0,
  padding: 10,
  customSnapshotsDir: 'visual/snapshots/',
  delayBetweenTries: 0,
  timeout: 500,
  disableTimersAndAnimations: true,
} as CypressImageSnapshotOptions;
addMatchImageSnapshotCommand(options)
