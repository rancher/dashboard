export default {
  details() {
    return [
      {
        label:     'Locked',
        formatter: 'Checked',
        content:   true
      },
      {
        label:     'Cluster Creator Default',
        formatter: 'Checked',
        content:   true
      },
      {
        label:   'Type',
        content: this.typeDisplay
      },
    ];
  }
};
