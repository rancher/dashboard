import { PaginationFilterEquality, PaginationFilterField } from '@shell/types/store/pagination.types';

describe('pagination-types', () => {
  describe('class: PaginationFilterField', () => {
    describe('constructor', () => {
      it('should set properties correctly with default values', () => {
        const field = 'testField';
        const value = 'testValue';
        const filterField = new PaginationFilterField({ field, value });

        expect(filterField.field).toBe(field);
        expect(filterField.value).toBe(value);
        expect(filterField.equals).toBe(true);
        expect(filterField.exact).toBe(true);
        expect(filterField.exists).toBe(false);
        expect(filterField.equality).toBe(PaginationFilterEquality.EQUALS);
      });

      it('should handle deprecated `equals` and `exact` to set `equality`', () => {
      // equals: true, exact: true
        let ff = new PaginationFilterField({
          field: 'f', value: 'v', equals: true, exact: true
        });

        expect(ff.equality).toBe(PaginationFilterEquality.EQUALS);

        // equals: true, exact: false
        ff = new PaginationFilterField({
          field: 'f', value: 'v', equals: true, exact: false
        });
        expect(ff.equality).toBe(PaginationFilterEquality.CONTAINS);

        // equals: false, exact: true
        ff = new PaginationFilterField({
          field: 'f', value: 'v', equals: false, exact: true
        });
        expect(ff.equality).toBe(PaginationFilterEquality.NOT_EQUALS);

        // equals: false, exact: false
        ff = new PaginationFilterField({
          field: 'f', value: 'v', equals: false, exact: false
        });
        expect(ff.equality).toBe(PaginationFilterEquality.NOT_CONTAINS);
      });

      it('should prioritize `equality` over `equals` and `exact`', () => {
        const filterField = new PaginationFilterField({
          field:    'f',
          value:    'v',
          equals:   false,
          exact:    false,
          equality: PaginationFilterEquality.GREATER_THAN
        });

        expect(filterField.equality).toBe(PaginationFilterEquality.GREATER_THAN);
      });

      it('should throw an error if no equality can be determined', () => {
        expect(() => new PaginationFilterField({
          field:  'f',
          value:  'v',
          equals: null,
          exact:  null
        })).toThrow('A pagination filter must have either equals or equality set');
      });

      it('should set `exists` property', () => {
        const filterField = new PaginationFilterField({ field: 'f', exists: true });

        expect(filterField.exists).toBe(true);
      });
    });

    describe('safeEquality', () => {
      it('should return EQUALS for equals=true, exact=true', () => {
        const equality = PaginationFilterField.safeEquality({ equals: true, exact: true });

        expect(equality).toBe(PaginationFilterEquality.EQUALS);
      });

      it('should return CONTAINS for equals=true, exact=false', () => {
        const equality = PaginationFilterField.safeEquality({ equals: true, exact: false });

        expect(equality).toBe(PaginationFilterEquality.CONTAINS);
      });

      it('should return NOT_EQUALS for equals=false, exact=true', () => {
        const equality = PaginationFilterField.safeEquality({ equals: false, exact: true });

        expect(equality).toBe(PaginationFilterEquality.NOT_EQUALS);
      });

      it('should return NOT_CONTAINS for equals=false, exact=false', () => {
        const equality = PaginationFilterField.safeEquality({ equals: false, exact: false });

        expect(equality).toBe(PaginationFilterEquality.NOT_CONTAINS);
      });

      it('should return equality if it is provided', () => {
        const equality = PaginationFilterField.safeEquality({ equality: PaginationFilterEquality.IN });

        expect(equality).toBe(PaginationFilterEquality.IN);
      });

      it('should prioritize equality over equals/exact', () => {
        const equality = PaginationFilterField.safeEquality({
          equals:   true,
          exact:    false,
          equality: PaginationFilterEquality.LESS_THAN
        });

        expect(equality).toBe(PaginationFilterEquality.LESS_THAN);
      });

      it('should return undefined if no equality can be determined', () => {
        const equality = PaginationFilterField.safeEquality({});

        expect(equality).toBeUndefined();
      });

      it('should work with an instance of PaginationFilterField', () => {
        const ff = new PaginationFilterField({
          field:    'f',
          value:    'v',
          equals:   false,
          exact:    false,
          equality: PaginationFilterEquality.GREATER_THAN
        });

        // safeEquality will prioritize the `equality` property on the instance
        const equality = PaginationFilterField.safeEquality(ff);

        expect(equality).toBe(PaginationFilterEquality.GREATER_THAN);
      });
    });
  });
});
