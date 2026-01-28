import { StateColor } from '@shell/utils/style';
import { RouteLocationRaw } from 'vue-router';

export interface Count {
  label: string;
  count: number;
}

export interface Props {
  label: string;
  to?: RouteLocationRaw;
  color?: StateColor;
  counts?: Count[];
}
