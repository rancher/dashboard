
import jsyaml from 'js-yaml';
import { fieldValue, headerFieldId, isIgnoredColumn, stringifyValue } from '@shell/utils/table-views/fields';
import { valueFor } from '@shell/utils/table-columns';
import type { TableViewColumn, TableViewExportColumn, TableViewRow } from '@shell/types/table-views';

function csvCell(value: string): string {
  if (/["\n,]/.test(value)) {
    return `"${ value.replace(/"/g, '""') }"`;
  }

  return value;
}

/**
 * A column whose cell a formatter draws on its own has no value to export. Guessing one from its sort
 * or search path could say something the cell doesn't, so it is left out
 */
function hasOwnValue(header: TableViewColumn): boolean {
  return typeof header.value === 'function' || (typeof header.value === 'string' && !!header.value) || typeof header.getValue === 'function';
}

/** What the column holds for the row, by its own value only - see hasOwnValue */
function exportValue(row: TableViewRow, column: TableViewExportColumn): unknown {
  const header = column.field.header;

  // A label, or a field with no column, has nothing to guess from
  if (!header || column.field.isLabel) {
    return fieldValue(row, column.field);
  }

  try {
    const shown = valueFor(row, header, false, { warn: false });

    if (shown !== undefined && shown !== null && shown !== '') {
      return shown;
    }

    return typeof header.getValue === 'function' ? header.getValue(row) ?? '' : '';
  } catch (e) {
    return '';
  }
}

/** Shared by the toolbar's export and the resource action's, so both write the same columns */
export function exportColumnsFor(headers: TableViewColumn[], t: (key: string) => string): TableViewExportColumn[] {
  return (headers || [])
    .filter((header) => !isIgnoredColumn(header) && hasOwnValue(header) && (header.label || header.labelKey))
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
    lines.push(columns.map((c) => csvCell(stringifyValue(exportValue(row, c)))).join(','));
  });

  return lines.join('\n');
}

function rowsToRecords(rows: TableViewRow[], columns: TableViewExportColumn[]): Record<string, string>[] {
  return rows.map((row) => columns.reduce((acc: Record<string, string>, c) => {
    acc[c.label] = stringifyValue(exportValue(row, c));

    return acc;
  }, {}));
}

export function rowsToYaml(rows: TableViewRow[], columns: TableViewExportColumn[]): string {
  return jsyaml.dump(rowsToRecords(rows, columns));
}

export function rowsToJson(rows: TableViewRow[], columns: TableViewExportColumn[]): string {
  return JSON.stringify(rowsToRecords(rows, columns), null, 2);
}
