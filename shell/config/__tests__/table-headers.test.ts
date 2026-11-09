import fs from 'fs';
import path from 'path';
import jsyaml from 'js-yaml';
import { CPU, RAM } from '@shell/config/table-headers';

describe('table headers', () => {
  const { tableHeaders } = jsyaml.load(fs.readFileSync(path.resolve(__dirname, '../../assets/translations/en-us.yaml'), 'utf8')) as { tableHeaders: Record<string, string> };

  // The Nodes list only shows what the node uses, so its columns say so, in the words of the node detail and cluster dashboard cards
  it.each([
    ['CPU', CPU, 'CPU Used'],
    ['RAM', RAM, 'Memory Used'],
  ])('should name the %s column after what the node uses', (_, header, label) => {
    expect(tableHeaders[header.labelKey.replace('tableHeaders.', '')]).toStrictEqual(label);
  });
});
