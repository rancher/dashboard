export default {
  details() {
    return [
      {
        label:     'Locked',
        formatter: 'Checked',
        content:   true
      },
      {
        label:     'New User Default',
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
