import PagePo from '@/cypress/e2e/po/pages/page.po';
import UnitInputPo from '~/cypress/e2e/po/components/unit-input.po';
import SelectPo from '~/cypress/e2e/po/components/select.po';

export default class AgentConfigurationRke2 extends PagePo {
  static url: string = '/c/_/manager/provisioning.cattle.io.cluster/create?type=custom#clusteragentconfig'
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(AgentConfigurationRke2.url);
  }

  constructor() {
    super(AgentConfigurationRke2.url);
  }

  title(): Cypress.Chainable<string> {
    return this.self().find('.primaryheader h1').invoke('text');
  }

  fillRequestandLimitsForm(area: string, data: any) {
    let areaId: string;

    if (area === 'cluster') {
      areaId = 'clusteragentconfig';
    } else if (area === 'fleet') {
      areaId = 'fleetagentconfig';
    } else {
      throw new Error(`Area for fillRequestandLimitsForm not recognized ::: ${ area }`);
    }

    new UnitInputPo(this.self().find(`#${ areaId } [data-testid="cpu-reservation"]`)).setValue(data.request?.cpu);
    new UnitInputPo(this.self().find(`#${ areaId } [data-testid="memory-reservation"]`)).setValue(data.request?.memory);
    new UnitInputPo(this.self().find(`#${ areaId } [data-testid="cpu-limit"]`)).setValue(data.limit?.cpu);
    new UnitInputPo(this.self().find(`#${ areaId } [data-testid="memory-limit"]`)).setValue(data.limit?.memory);
  }

  fillTolerationsForm(area: string, data: any) {
    let areaId: string;

    if (area === 'cluster') {
      areaId = 'clusteragentconfig';
    } else if (area === 'fleet') {
      areaId = 'fleetagentconfig';
    } else {
      throw new Error(`Area for fillRequestandLimitsForm not recognized ::: ${ area }`);
    }

    if (data.length) {
      data.forEach((dataPoint:any, index: number) => {
        // add a new toleration
        this.self().find(`#${ areaId } [data-testid="add-toleration-btn"]`).click();

        // fill form
        // key
        this.self().find(`#${ areaId } [data-testid="toleration-key-index${ index }"]`).type(dataPoint.key);

        // operator
        const selectOperator = new SelectPo(this.self().find(`#${ areaId } [data-testid="toleration-operator-index${ index }"]`));

        selectOperator.toggle();
        selectOperator.clickOption(dataPoint.operator);

        // value
        this.self().find(`#${ areaId } [data-testid="toleration-value-index${ index }"]`).type(dataPoint.value);

        // effect
        const selectEffect = new SelectPo(this.self().find(`#${ areaId } [data-testid="toleration-effect-index${ index }"]`));

        selectEffect.toggle();
        selectEffect.clickOption(dataPoint.effect);
      });

    // fill toleration 1
    } else {
      throw new Error(`No data passed for fillTolerationsForm!`);
    }
  }
}
