import ResourceCache from './resourceCache';
import { shortenedImage, escapeHtml } from '~/shell/utils/string';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';

export default class PodCache extends ResourceCache {
  constructor(schema, opt, workerMethods) {
    super(schema, opt, workerMethods);

    this._extraFields = [ // these are all fields that'll need to be deleted prior to sending back to the UI thread
      ...this._extraFields,
      { imageNames: pod => pod.spec.containers.map(container => shortenedImage(container.image)) },
      // workloadRef: pod => '',
      // details: pod => '',
      { isRunning: pod => pod.status.phase.toLowerCase() === STATES_ENUM.RUNNING },
      {
        groupByNode: (pod) => {
          const name = pod.spec?.nodeName || 'n/a';

          return escapeHtml(name);
        }
      },
      {
        restartCount: (pod) => {
          if (pod.status.containerStatuses) {
            return pod.status?.containerStatuses[0].restartCount || 0;
          }

          return 0;
        }
      }
    ];
  }
}
