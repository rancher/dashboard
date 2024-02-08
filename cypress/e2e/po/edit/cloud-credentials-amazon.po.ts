import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import BaseCloudCredentialsPo from '@/cypress/e2e/po/edit/base-cloud-credentials.po';
export default class AmazonCloudCredentialsCreateEditPo extends BaseCloudCredentialsPo {
  accessKey(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Access Key');
  }

  secretKey(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Secret Key');
  }

  defaultRegion(): LabeledSelectPo {
    return new LabeledSelectPo('.vs__dropdown-toggle');
  }
}
