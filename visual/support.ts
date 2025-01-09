import { addMatchImageSnapshotCommand } from './command'
import { CypressImageSnapshotOptions } from './types';

const options = {
  capture: 'viewport',
  failureThreshold: 0,
  failOnSnapshotDiff: true,
  padding: 10,
  customSnapshotsDir: 'visual/snapshots/',
  delayBetweenTries: 0,
  timeout: 1000,
  disableTimersAndAnimations: true,
  diffDirection: 'vertical',
} as CypressImageSnapshotOptions;
addMatchImageSnapshotCommand(options)
