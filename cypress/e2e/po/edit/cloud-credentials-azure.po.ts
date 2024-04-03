import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import BaseCloudCredentialsPo from '@/cypress/e2e/po/edit/base-cloud-credentials.po';

export default class AzureCloudCredentialsCreateEditPo extends BaseCloudCredentialsPo {
  environment(): LabeledSelectPo {
    return new LabeledSelectPo('.vs__dropdown-toggle');
  }

  subscriptionId(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Subscription ID');
  }

  clientId(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Client ID');
  }

  clientSecret(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Client Secret');
  }
}
