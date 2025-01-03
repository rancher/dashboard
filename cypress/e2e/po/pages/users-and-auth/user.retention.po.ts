
import PagePo from '@/cypress/e2e/po/pages/page.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import ToggleSwitchPo from '@/cypress/e2e/po/components/toggle-switch.po';

export default class UserRetentionPo extends PagePo {
  constructor(private clusterId = '_') {
    super(UserRetentionPo.createPath(clusterId));
  }

  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/auth/user.retention`;
  }

  saveButton() {
    return new AsyncButtonPo('[data-testid="action-button-async-button"]');
  }

  enableRegistryCheckbox(): CheckboxInputPo {
    return new CheckboxInputPo('[data-testid="registries-enable-checkbox"]');
  }

  disableAfterPeriodCheckbox(): CheckboxInputPo {
    return new CheckboxInputPo('[data-testid="disableAfterPeriod"]');
  }

  disableAfterPeriodInput() {
    return new LabeledInputPo('[data-testid="disableAfterPeriodInput"]');
  }

  deleteAfterPeriodCheckbox(): CheckboxInputPo {
    return new CheckboxInputPo('[data-testid="deleteAfterPeriod"]');
  }

  deleteAfterPeriodInput() {
    return new LabeledInputPo('[data-testid="deleteAfterPeriodInput"]');
  }

  userRetentionCron() {
    return new LabeledInputPo('[data-testid="userRetentionCron"]');
  }

  userRetentionDryRun() {
    return new ToggleSwitchPo('[data-testid="userRetentionDryRun"]');
  }

  userLastLoginDefault() {
    return new LabeledInputPo('[data-testid="userLastLoginDefault"]');
  }
}
