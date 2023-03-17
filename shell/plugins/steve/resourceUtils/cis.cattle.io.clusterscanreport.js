export function _getParsedReport(resource) {
  try {
    const json = resource.spec?.reportJSON;

    const parsed = JSON.parse(json);

    return parsed;
  } catch (e) {
  }

  return null;
}

export function _getNodes(resource) {
  return resource.parsedReport ? resource.parsedReport.nodes : {};
}

export const calculatedFields = [
  { name: 'parsedReport', func: _getParsedReport },
  {
    name: 'nodes', func: _getNodes, dependsOn: ['parsedReport']
  }
];
