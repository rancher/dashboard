export const SEARCH_QUERY = 'q';
export const SORT_BY = 'sort';
export const DESCENDING = 'desc';
export const PAGE = 'page';

export default {
  methods: {
    updateQueryString(params) {
      const query = qpFor(this.$route.query, params);

      this.$router.replace({ query });
    },

  }
};

export function qpFor(current, input) {
  const out = Object.assign({}, current);

  if ( Object.prototype.hasOwnProperty.call(input, SEARCH_QUERY) ) {
    out[SEARCH_QUERY] = input[SEARCH_QUERY];
  }

  if ( Object.prototype.hasOwnProperty.call(input, SORT_BY) ) {
    if ( input[SORT_BY] ) {
      if ( input[SORT_BY] === input._defaultSortBy ) {
        delete out[SORT_BY];
      } else {
        out[SORT_BY] = input[SORT_BY];
      }
    }
  }

  if ( Object.prototype.hasOwnProperty.call(input, DESCENDING) ) {
    // Null adds the key, but with no value, undefined removes it
    out[DESCENDING] = (input[DESCENDING] ? null : undefined);
  }

  if ( Object.prototype.hasOwnProperty.call(input, PAGE) ) {
    if ( input[PAGE] > 1 ) {
      out[PAGE] = input[PAGE];
    } else {
      delete out[PAGE];
    }
  }

  return out;
}
