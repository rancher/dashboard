import SteveModel from '@shell/plugins/steve/steve-class';
import { PolicyRule } from '@shell/types/resources/rbac';

export interface SelfSubjectRulesReviewStatus {
  resourceRules: PolicyRule[];
  incomplete: boolean;
  evaluationError?: string;
}

export default class SelfSubjectRulesReview extends SteveModel {
  declare spec: { namespace: string };
  declare status?: SelfSubjectRulesReviewStatus;

  /**
   * A review isn't stored, so its response has no id and save doesn't load it. Keep the result on this model instead
   */
  processSaveResponse(res: { status?: SelfSubjectRulesReviewStatus }) {
    this.status = res?.status;
  }
}
