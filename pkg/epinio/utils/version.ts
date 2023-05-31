export function format(version: string) {
  const match = version.match(/^(v)(\d+\.)?(\d+\.)?(\*|\d+)/);

  return {
    full:  version,
    label: match ? match[0] : version
  };
}
