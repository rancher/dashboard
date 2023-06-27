/* eslint-disable cypress/no-unnecessary-waiting */
import ComponentPo from '@/cypress/e2e/po/components/component.po';
import UnitInputPo from '@/cypress/e2e/po/components/unit-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';
import ArrayList from '@/cypress/e2e/po/components/array-list.po';

function _parseArea(area:string) {
  let areaId: string;

  if (area === 'cluster') {
    areaId = 'clusteragentconfig';
  } else if (area === 'fleet') {
    areaId = 'fleetagentconfig';
  } else {
    throw new Error(`Area identifier not recognized ::: ${ area }`);
  }

  return areaId;
}

export default class AgentConfigurationRke2 extends ComponentPo {
  constructor(selector = '.dashboard-root') {
    super(selector);
  }

  title(): Cypress.Chainable<string> {
    return this.self().find('.primaryheader h1').invoke('text');
  }

  nameNsDescription() {
    return new NameNsDescription(this.self());
  }

  clickTab(selector: string) {
    new TabbedPo().clickTabWithSelector(selector);
  }

  selectAffinityOption(area: string, optionIndex: number) {
    const areaId = _parseArea(area);

    new RadioGroupInputPo(`#${ areaId } [data-testid="affinity-options"]`, this.self()).set(optionIndex);
  }

  clearOutPrefilledAffinityRules(area: string, type: string) {
    const areaId = _parseArea(area);

    cy.document().then(($document) => {
      const documentResult = $document.querySelectorAll(`#${ areaId } [data-testid="${ type }-affinity"] [data-testid^="array-list-box"]`);

      if (documentResult.length) {
        cy.get(`#${ areaId } [data-testid="${ type }-affinity"] [data-testid^="array-list-box"]`).then(($elements) => {
          for (let index = $elements.length - 1; index >= 0 ; index--) {
            new ArrayList(`#${ areaId } [data-testid="${ type }-affinity"]`).closeArrayListItem(index);
          }
        });
      }
    });
  }

  fillRequestandLimitsForm(area: string, data: any) {
    const areaId = _parseArea(area);

    new UnitInputPo(`#${ areaId } [data-testid="cpu-reservation"]`, this.self()).setValue(data.request?.cpu);
    new UnitInputPo(`#${ areaId } [data-testid="memory-reservation"]`, this.self()).setValue(data.request?.memory);
    new UnitInputPo(`#${ areaId } [data-testid="cpu-limit"]`, this.self()).setValue(data.limit?.cpu);
    new UnitInputPo(`#${ areaId } [data-testid="memory-limit"]`, this.self()).setValue(data.limit?.memory);
  }

  fillPodSelectorForm(area: string, data: any) {
    const areaId = _parseArea(area);

    if (data.length) {
      data.forEach((dataPoint:any, index: number) => {
        // add a new pod selector
        this.self().find(`#${ areaId } [data-testid="pod-affinity"] [data-testid="array-list-button"]`).click();

        // fill form
        // type
        const affinityType = new LabeledSelectPo(`#${ areaId } [data-testid="pod-affinity"] [data-testid="pod-affinity-type-index${ index }"]`, this.self());

        affinityType.toggle();
        affinityType.clickOption(dataPoint.affinityType);

        // priority
        const priority = new LabeledSelectPo(`#${ areaId } [data-testid="pod-affinity"] [data-testid="pod-affinity-priority-index${ index }"]`, this.self());

        priority.toggle();
        priority.clickOption(dataPoint.priority);

        // namespace type
        new RadioGroupInputPo(`#${ areaId } [data-testid="pod-affinity"] [data-testid="pod-affinity-namespacetype-index${ index }"]`, this.self()).set(dataPoint.namespaceType);

        if (dataPoint.namespaces) {
          // namespace input (selected namespaces)
          this.self().find(`#${ areaId } [data-testid="pod-affinity"] [data-testid="pod-affinity-namespace-input-index${ index }"]`).type(dataPoint.namespaces);
        }

        // expressions
        if (dataPoint.expressions?.length) {
          dataPoint.expressions.forEach((expression:any, i: number) => {
            // add a new expression
            this.self().find(`#${ areaId } [data-testid="pod-affinity"] [data-testid="pod-affinity-expressions-index${ index }"] [data-testid="input-match-expression-add-rule"]`).click();

            // key
            this.self().find(`#${ areaId } [data-testid="pod-affinity"] [data-testid="pod-affinity-expressions-index${ index }"] [data-testid="input-match-expression-key-control-${ i }"]`).type(expression.key);

            // operator
            const selectOperator = new LabeledSelectPo(`#${ areaId } [data-testid="pod-affinity"] [data-testid="pod-affinity-expressions-index${ index }"] [data-testid="input-match-expression-operator-control-${ i }"]`, this.self());

            selectOperator.toggle();
            selectOperator.clickOption(expression.operator);

            // value
            if (expression.value) {
              this.self().find(`#${ areaId } [data-testid="pod-affinity"] [data-testid="pod-affinity-expressions-index${ index }"] [data-testid="input-match-expression-values-control-${ i }"]`).type(expression.value);
            }
          });
        }

        // typology
        this.self().find(`#${ areaId } [data-testid="pod-affinity"] [data-testid="pod-affinity-topology-input-index${ index }"]`).type(dataPoint.topology);

        if (dataPoint.weight) {
          // this first part is to make sure we select all the prefilled data
          this.self().find(`#${ areaId } [data-testid="pod-affinity"] [data-testid="pod-affinity-weight-index${ index }"]`).type('{selectall}');
          this.self().find(`#${ areaId } [data-testid="pod-affinity"] [data-testid="pod-affinity-weight-index${ index }"]`).type(dataPoint.weight);
        }
      });
    } else {
      throw new Error(`No data passed for fillPodSelectorForm!`);
    }
  }

  fillNodeSelectorForm(area: string, data: any) {
    const areaId = _parseArea(area);

    if (data.length) {
      data.forEach((dataPoint:any, index: number) => {
        // add a new node selector
        this.self().find(`#${ areaId } [data-testid="node-affinity"] [data-testid="array-list-button"]`).click();

        // fill form
        // priority
        const priority = new LabeledSelectPo(`#${ areaId } [data-testid="node-affinity"] [data-testid="node-affinity-priority-index${ index }"]`, this.self());

        priority.toggle();
        priority.clickOption(dataPoint.priority);

        // expressions
        if (dataPoint.expressions?.length) {
          dataPoint.expressions.forEach((expression:any, i: number) => {
            // add a new expression
            this.self().find(`#${ areaId } [data-testid="node-affinity"] [data-testid="node-affinity-expressions-index${ index }"] [data-testid="input-match-expression-add-rule"]`).click();

            // matching
            if (expression.matching) {
              const selectMatching = new LabeledSelectPo(`#${ areaId } [data-testid="node-affinity"] [data-testid="node-affinity-expressions-index${ index }"] [data-testid="input-match-type-field-control-${ i }"]`, this.self());

              selectMatching.toggle();
              selectMatching.clickOption(expression.matching);
            }

            // key
            this.self().find(`#${ areaId } [data-testid="node-affinity"] [data-testid="node-affinity-expressions-index${ index }"] [data-testid="input-match-expression-key-control-${ i }"]`).type(expression.key);

            // operator
            const selectOperator = new LabeledSelectPo(`#${ areaId } [data-testid="node-affinity"] [data-testid="node-affinity-expressions-index${ index }"] [data-testid="input-match-expression-operator-control-${ i }"]`, this.self());

            selectOperator.toggle();
            selectOperator.clickOption(expression.operator);

            // value
            if (expression.value) {
              this.self().find(`#${ areaId } [data-testid="node-affinity"] [data-testid="node-affinity-expressions-index${ index }"] [data-testid="input-match-expression-values-control-${ i }"]`).type(expression.value);
            }
          });
        }

        if (dataPoint.weight) {
          // this first part is to make sure we select all the prefilled data
          this.self().find(`#${ areaId } [data-testid="node-affinity"] [data-testid="node-affinity-weight-index${ index }"]`).type('{selectall}');
          this.self().find(`#${ areaId } [data-testid="node-affinity"] [data-testid="node-affinity-weight-index${ index }"]`).type(dataPoint.weight);
        }
      });
    } else {
      throw new Error(`No data passed for fillNodeSelectorForm!`);
    }
  }

  fillTolerationsForm(area: string, data: any) {
    const areaId = _parseArea(area);

    if (data.length) {
      data.forEach((dataPoint:any, index: number) => {
        // add a new toleration
        this.self().find(`#${ areaId } [data-testid="add-toleration-btn"]`).click();

        // fill form
        // key
        this.self().find(`#${ areaId } [data-testid="toleration-key-index${ index }"]`).type(dataPoint.key);

        // operator
        const selectOperator = new LabeledSelectPo(`#${ areaId } [data-testid="toleration-operator-index${ index }"]`, this.self());

        selectOperator.toggle();
        selectOperator.clickOption(dataPoint.operator);

        // value
        if (dataPoint.value) {
          this.self().find(`#${ areaId } [data-testid="toleration-value-index${ index }"]`).type(dataPoint.value);
        }

        // effect
        const selectEffect = new LabeledSelectPo(`#${ areaId } [data-testid="toleration-effect-index${ index }"]`, this.self());

        selectEffect.toggle();
        selectEffect.clickOption(dataPoint.effect);

        // seconds
        if (dataPoint.seconds) {
          this.self().find(`#${ areaId } [data-testid="toleration-seconds-index${ index }"] input`).type(dataPoint.seconds);
        }
      });
    } else {
      throw new Error(`No data passed for fillTolerationsForm!`);
    }
  }
}
