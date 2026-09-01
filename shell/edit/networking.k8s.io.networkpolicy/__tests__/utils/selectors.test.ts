export class PolicyRuleTargetSelectors {
  private wrapper;

  constructor(wrapper: any) {
    this.wrapper = wrapper;
  }

  get ipBlock() {
    return this.wrapper.find('[data-testid=labeled-input-ip-block-selector]');
  }

  /**
   * Namespace selector element; matches policies in OR condition, in conjunction with the other rules
   */
  get namespace() {
    return this.wrapper.find(
      '[data-testid=match-expression-namespace-selector]'
    );
  }

  /**
   * Pod selector element; matches policies in OR condition, in conjunction with the other rules
   */
  get pod() {
    return this.wrapper.find('[data-testid=match-expression-pod-selector]');
  }

  /**
   * Namespace and pod selector elements, matching policies in AND condition, within the same rule
   */
  get namespaceAndPod() {
    return {
      namespaceRule: this.wrapper.find(
        '[data-testid=match-expression-namespace-and-pod-selector-ns-rule]'
      ),
      podRule: this.wrapper.find(
        '[data-testid=match-expression-namespace-and-pod-selector-pod-rule]'
      ),
    };
  }

  get ruleType() {
    return this.wrapper.find('[data-testid="policy-rule-target-type-labeled-select"]');
  }
}
