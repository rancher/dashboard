
import jsyaml from 'js-yaml';
import { fieldValue, headerFieldId, isIgnoredColumn, stringifyValue } from '@shell/utils/table-views/fields';
import type { TableViewColumn, TableViewExportColumn, TableViewRow } from '@shell/types/table-views';

function csvCell(value: string): string {
  if (/["\n,]/.test(value)) {
    return `"${ value.replace(/"/g, '""') }"`;
  }

  return value;
}

/** Shared by the toolbar's export and the resource action's, so both write the same columns */
export function exportColumnsFor(headers: TableViewColumn[], t: (key: string) => string): TableViewExportColumn[] {
  return (headers || [])
    .filter((header) => !isIgnoredColumn(header) && (header.label || header.labelKey))
    .map((header) => {
      const label = header.label || t(header.labelKey || '');

      return {
        label,
        field: {
          id: headerFieldId(header), label, isLabel: false, header
        }
      };
    });
}

export function rowsToCsv(rows: TableViewRow[], columns: TableViewExportColumn[]): string {
  const lines = [columns.map((c) => csvCell(c.label)).join(',')];

  rows.forEach((row) => {
    lines.push(columns.map((c) => csvCell(stringifyValue(fieldValue(row, c.field)))).join(','));
  });

  return lines.join('\n');
}

function rowsToRecords(rows: TableViewRow[], columns: TableViewExportColumn[]): Record<string, string>[] {
  return rows.map((row) => columns.reduce((acc: Record<string, string>, c) => {
    acc[c.label] = stringifyValue(fieldValue(row, c.field));

    return acc;
  }, {}));
}

export function rowsToYaml(rows: TableViewRow[], columns: TableViewExportColumn[]): string {
  return jsyaml.dump(rowsToRecords(rows, columns));
}

export function rowsToJson(rows: TableViewRow[], columns: TableViewExportColumn[]): string {
  return JSON.stringify(rowsToRecords(rows, columns), null, 2);
}
