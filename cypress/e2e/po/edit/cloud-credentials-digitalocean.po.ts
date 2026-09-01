import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import BaseCloudCredentialsPo from '@/cypress/e2e/po/edit/base-cloud-credentials.po';

export default class DigitalOceanCloudCredentialsCreateEditPo extends BaseCloudCredentialsPo {
  credentialName(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Credential Name');
  }

  accessToken(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Access Token');
  }
}
