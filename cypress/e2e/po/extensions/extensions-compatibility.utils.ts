import PagePo from '@/cypress/e2e/po/pages/page.po';
import { InstallChartPage } from '@/cypress/e2e/po/pages/explorer/charts/install-charts.po';
import ChartInstalledAppsPagePo from '@/cypress/e2e/po/pages/chart-installed-apps.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import NameNsDescriptionPo from '@/cypress/e2e/po/components/name-ns-description.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';
import CodeMirrorPo from '~/cypress/e2e/po/components/code-mirror.po';

const installChartPage = new InstallChartPage();
const appsPage = new ChartInstalledAppsPagePo('local', 'apps');
const root = '.dashboard-root';

export default class ExtensionsCompatibilityUtils {
  appsPage() {
    return appsPage;
  }

  chartInstallPage() {
    return installChartPage;
  }

  genericPage(path: string) {
    return new PagePo(path);
  }

  genericResourceList(): BaseResourceList {
    return new BaseResourceList(cy.get(root));
  }

  genericNameNsDescription(): NameNsDescriptionPo {
    return new NameNsDescriptionPo(cy.get(root));
  }

  genericResourceDetail() {
    return new ResourceDetailPo(cy.get(root));
  }

  genericCodeMirror() {
    return CodeMirrorPo.bySelector(cy.get(root), '[data-testid="yaml-editor-code-mirror"]');
  }
}
