export const ENFORCEMENT_ACTION_VALUES = {
  DENY:   'deny',
  DRYRUN: 'dryrun'
};

export default {
  save() {
    return async() => {
      let constraint;

      if (this.constraint) {
        constraint = await this.findLatestConstraint();
      } else {
        constraint = await this.$dispatch('cluster/create', { type: this.kind }, { root: true });
      }

      constraint.spec = this.spec;
      constraint.metadata = this.metadata;

      await constraint.save();
    };
  },

  yamlSaveOverride() {
    return (value, originalValue) => {
      Object.assign(originalValue, value);
      console.log('sssssssssssssaaaaaa', originalValue);
      originalValue.save();
    };
  },

  remove() {
    return async() => {
      const constraint = await this.findLatestConstraint();

      return constraint.remove();
    };
  },

  findLatestConstraint() {
    return () => {
      return this.$dispatch('cluster/find', {
        type: this.constraint.type, id: this.constraint.id, opt: { force: true }
      }, { root: true });
    };
  }
};
