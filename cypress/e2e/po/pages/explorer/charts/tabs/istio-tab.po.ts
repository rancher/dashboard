import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import { MonitoringTab } from './monitoring-tab.po';

export class IstioTab extends MonitoringTab {
  tabID(): string {
    return 'istio';
  }

  enableIngressGatewayCheckbox(): CheckboxInputPo {
    return new CheckboxInputPo(cy.get('[aria-label="Enable Ingress Gateway"]').parent().parent());
  }
}
