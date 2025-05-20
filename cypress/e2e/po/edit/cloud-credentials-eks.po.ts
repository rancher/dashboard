import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import AmazonCloudCredentialsCreateEditPo from '@/cypress/e2e/po/edit/cloud-credentials-amazon.po';

export default class EKSCloudCredentialsCreateEditPo extends AmazonCloudCredentialsCreateEditPo {
  region(): LabeledSelectPo {
    return new LabeledSelectPo('[.vs__dropdown-toggl]');
  }

  defaultRegion(): LabeledSelectPo {
    return new LabeledSelectPo('[.vs__dropdown-toggle]');
  }
}
