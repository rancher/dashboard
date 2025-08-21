import { Status } from '@components/Pill/types';
export type Shape = 'disc' | 'horizontal-bar' | 'vertical-bar';

export interface RcStatusIndicatorProps {
  shape: Shape;
  status: Status;
}
