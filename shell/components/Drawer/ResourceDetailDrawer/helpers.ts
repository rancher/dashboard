export async function getYaml(resource: any): Promise<string> {
  let yaml;
  const opt = { headers: { accept: 'application/yaml' } };

  if (resource.hasLink('view')) {
    yaml = (await resource.followLink('view', opt)).data;
  }

  return resource.cleanForDownload(yaml);
}
