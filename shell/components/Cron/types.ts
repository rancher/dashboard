export interface TooltipItem {
  value?: string;
  descKey?: string;
}

export interface TooltipSection {
  type: 'rules' | 'explanation';
  items: TooltipItem[];
}

export type CronField = 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek';

export const cronFields: CronField[] = ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'];
