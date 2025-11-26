import { Status } from '@rc/utils/status';

export type Shape = 'disc' | 'horizontal-bar' | 'vertical-bar';

export interface RcStatusIndicatorProps {
  shape: Shape;
  status: Status;
}
