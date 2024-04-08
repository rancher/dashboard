import ComponentPo from '@/cypress/e2e/po/components/component.po';
import { WorkspaceSwitcherPo } from '@/cypress/e2e/po/components/workspace-switcher.po';
import { ImportYamlPo } from '@/cypress/e2e/po/components/import-yaml.po';
export class HeaderPo extends ComponentPo {
  constructor() {
    super('[data-testid="header"]');
  }

  selectWorkspace(name: string) {
    const wsFilter = new WorkspaceSwitcherPo();

    wsFilter.toggle();

    return wsFilter.clickOptionWithLabel(name);
  }

  importYamlHeaderAction() {
    return this.self().find('[data-testid="header-action-import-yaml"]');
  }

  importYaml() {
    return new ImportYamlPo();
  }

  clusterIcon() {
    return this.self().find('.cluster-icon');
  }

  clusterName() {
    return this.self().find('.cluster-name');
  }

  customBadge() {
    return this.self().find('.cluster-badge');
  }
}
