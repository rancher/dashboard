import SelfSubjectRulesReview from '@shell/models/authorization.k8s.io.selfsubjectrulesreview';

describe('class SelfSubjectRulesReview', () => {
  it('should keep the response status on the model', () => {
    const review = new SelfSubjectRulesReview({ type: 'authorization.k8s.io.selfsubjectrulesreview', spec: { namespace: 'default' } });
    const status = {
      resourceRules: [{
        verbs: ['get'], apiGroups: [''], resources: ['pods']
      }],
      incomplete: false
    };

    review.processSaveResponse({ status });

    expect(review.status).toStrictEqual(status);
  });
});
