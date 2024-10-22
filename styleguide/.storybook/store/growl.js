export default  {
  namespaced: true,
  state: {
    stack: [{
      id: 1,
      color: 'success',
      icon: 'checkmark',
      timeout: 5000,
      title: 'Success',
      message: 'This is a success message'
    },
    {
      id: 2,
      color: 'info',
      icon: 'info',
      timeout: 5000,
      title: 'Info',
      message: 'This is an info message'
    },
    {
      id: 3,
      color: 'warning',
      icon: 'warning',
      timeout: 5000,
      title: 'Warning',
      message: 'This is an warning message'
    },
    {
      id: 4,
      color: 'error',
      icon: 'error',
      timeout: 5000,
      title: 'Warning',
      message: 'This is an warning message'
    },
    ],
  },
  getters: require("../../../shell/store/growl.js").getters,
  actions: require("../../../shell/store/growl.js").actions,
  mutations: require("../../../shell/store/growl.js").mutations
}
