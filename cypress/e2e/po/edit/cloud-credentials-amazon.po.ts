import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import BaseCloudCredentialsPo from '@/cypress/e2e/po/edit/base-cloud-credentials.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';
export default class AmazonCloudCredentialsCreateEditPo extends BaseCloudCredentialsPo {
  nameNsDescription() {
    return new NameNsDescription(this.self());
  }

  accessKey(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Access Key');
  }

  secretKey(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Secret Key');
  }

  defaultRegion(): LabeledSelectPo {
    return new LabeledSelectPo('.vs__dropdown-toggle');
  }

  saveCreateForm(): ResourceDetailPo {
    return new ResourceDetailPo(this.self());
  }
}
