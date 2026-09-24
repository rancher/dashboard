/**
 * Table Views - exporting what the table is showing.
 *
 * The columns as the table has them, and the rows rendered into the formats the export modal
 * offers. What is exported is what the view matches, not what happens to be on screen.
 */

import jsyaml from 'js-yaml';
import { fieldValue, headerFieldId, isIgnoredColumn, stringifyValue } from '@shell/utils/table-views/fields';
import type { ExportColumn } from '@shell/types/table-views';

function csvCell(value: string): string {
  if (/["\n,]/.test(value)) {
    return `"${ value.replace(/"/g, '""') }"`;
  }

  return value;
}

/**
 * The columns an export writes, worked out from a table's headers.
 *
 * Shared so that the two ways of exporting agree: the toolbar writes the view's columns, and a
 * selection exported from a resource's own actions writes that resource's columns. Both come
 * through here, so neither can quietly grow a column set of its own.
 */
export function exportColumnsFor(headers: any[], t: (key: string) => string): ExportColumn[] {
  return (headers || [])
    .filter((header) => !isIgnoredColumn(header) && (header.label || header.labelKey))
    .map((header) => {
      const label = header.label || t(header.labelKey);

      return {
        label,
        field: {
          id: headerFieldId(header), label, isLabel: false, header
        }
      };
    });
}

export function rowsToCsv(rows: any[], columns: ExportColumn[]): string {
  const lines = [columns.map((c) => csvCell(c.label)).join(',')];

  rows.forEach((row) => {
    lines.push(columns.map((c) => csvCell(stringifyValue(fieldValue(row, c.field)))).join(','));
  });

  return lines.join('\n');
}

/**
 * The rows as plain records, one per row, keyed by the column headings on screen. What every
 * export format is built from.
 */
function rowsToRecords(rows: any[], columns: ExportColumn[]): Record<string, string>[] {
  return rows.map((row) => columns.reduce((acc: Record<string, string>, c) => {
    acc[c.label] = stringifyValue(fieldValue(row, c.field));

    return acc;
  }, {}));
}

export function rowsToYaml(rows: any[], columns: ExportColumn[]): string {
  return jsyaml.dump(rowsToRecords(rows, columns));
}

export function rowsToJson(rows: any[], columns: ExportColumn[]): string {
  return JSON.stringify(rowsToRecords(rows, columns), null, 2);
}
