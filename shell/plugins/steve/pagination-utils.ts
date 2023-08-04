import projectAndNamespaceFilteringUtils, { FindAllOpt } from 'plugins/steve/projectAndNamespaceFiltering.utils';

class StevePaginationUtils {
  checkAndCreateParam(opt: FindAllOpt): string | undefined {
    if (!opt.pagination) {
      return;
    }

    console.warn('steve page utils', 'checkAndCreateParam', opt.pagination);

    const params: string[] = [];

    const namespaceParam = this.createNamespacesParam(opt);

    if (namespaceParam) {
      params.push(namespaceParam);
    }

    if (opt.pagination.page) { // TODO: RC what if not here?
      params.push(`page=${ opt.pagination.page }`);
    }

    if (opt.pagination.pageSize) {
      params.push(`pagesize=${ opt.pagination.pageSize }`);
    }

    debugger;
    if (opt.pagination.sort?.length) {
      const joined = opt.pagination.sort
        .map((s) => `${ s.asc ? '' : '-' }${ s.field }`)
        .join(',');

      params.push(`sort=${ joined }`);
    }

    // TODO: RC if not force... add revision

    console.warn('steve page utils', 'checkAndCreateParam', 'res', params);

    return params.join('&');
  }

  private createNamespacesParam(opt: FindAllOpt): string | undefined {
    if (!opt.pagination?.namespaces) {
      return '';
    }

    // TODO: RC do this at the moment, but in future need to handle NOT cases (aka all not system = user)
    return projectAndNamespaceFilteringUtils.createParam(opt.pagination?.namespaces);
  }
}

export default new StevePaginationUtils();
