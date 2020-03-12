import { stringify } from '@/utils/error';

export const state = function() {
  return {};
};

export const actions = {
  fromError({ commit }, { title, err }) {
    // @TODO actual growls...
    alert(`${ title }: ${ stringify(err) }`);
  }
};
