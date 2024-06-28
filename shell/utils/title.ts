export function updatePageTitle(...breadcrumb: (string | null | undefined | false)[]): void {
  document.title = breadcrumb.filter((s) => s).join(' - ');
}
