// *************************************************************
// import epinioRoutes from '../products/epinio/routes';

// // Note - This content needs to be in a separate file than the core `extensions` one ... otherwise all file references lose modules... which unwraps quickly
// const extensions = [
//   epinioRoutes
// ];
// *************************************************************
const extensions = [];

export default {

  routes(resolve) {
    return [].concat.apply([], extensions.map(routes => routes(resolve)));
  }
};
