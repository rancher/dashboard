import { PodContainerGeneral } from '@/cypress/e2e/po/components/workloads/pods/pod-container-general.po';
import { PodContainerResources } from '@/cypress/e2e/po/components/workloads/pods/pod-container-resources.po';

export class PodContainer {
  resources() {
    return new PodContainerResources('[data-testid="btn-resources"]');
  }

  general() {
    return new PodContainerGeneral('[data-testid="btn-general"]');
  }
}
