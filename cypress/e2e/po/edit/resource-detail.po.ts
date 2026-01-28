import ComponentPo from '@/cypress/e2e/po/components/component.po';
import CreateEditViewPo from '@/cypress/e2e/po/components/create-edit-view.po';
import CruResourcePo from '@/cypress/e2e/po/components/cru-resource.po';
import ResourceYamlPo from '@/cypress/e2e/po/components/resource-yaml.po';
import ResourceDetailMastheadPo from '@/cypress/e2e/po/components/resource-detail-masthead.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import ResourceTablePo from '@/cypress/e2e/po/components/resource-table.po';

export default class ResourceDetailPo extends ComponentPo {
  /**
   * Returns the page object for interacting with the CRU (Create, Read, Update) resource component,
   * including support for actions like selecting types and clicking save/cancel buttons.
   * @returns
   */
  cruResource() {
    return new CruResourcePo(this.self());
  }

  /**
   * Returns the page object for managing resource creation and edit views,
   * including interactions like saving, editing as YAML, and navigating form steps.
   * @returns
   */
  createEditView() {
    return new CreateEditViewPo(this.self());
  }

  /**
   * Returns the page object for interacting with the YAML editor,
   * including methods to access the editor, footer, and save/create actions.
   * @returns
   */
  resourceYaml() {
    return new ResourceYamlPo(this.self());
  }

  /**
   * Returns the page object for interacting with tabbed UI components,
   * allowing tab selection and verification of active tabs.
   * @returns
   */
  tabs() {
    return new TabbedPo('[data-testid="tabbed"]');
  }

  /**
   * @param tabId - the id of the tab
   * @param index - the index of the list (only used for 'related' tab)
   * @returns the list of the tab
   */
  tabbedList(tabId: string, index?: number) {
    const baseSelector = `#${ tabId } [data-testid="sortable-table-list-container"]`;
    const selector = tabId === 'related' ? `${ baseSelector }:nth-of-type(${ index })` : baseSelector;

    return new ResourceTablePo(selector);
  }

  title(): Cypress.Chainable<string> {
    return this.self().find('.title-bar h1.title, .primaryheader h1').invoke('text');
  }

  /**
   * Get masthead component for resource details
   * @returns
   */
  masthead() {
    return new ResourceDetailMastheadPo(this.self());
  }

  resourceGauges() {
    return this.self().find('.status-row');
  }
}
