import PasswordStrength from '@shell/components/PasswordStrength.vue';

describe('component: PasswordStrength', () => {
  it('should return the correct strength', () => {
    const localThis1 = { password: '' };

    expect(PasswordStrength.computed.strength.call(localThis1)).toBe(0);

    const localThis2 = {
      password:  '1234',
      minLength: 5
    };

    expect(PasswordStrength.computed.strength.call(localThis2)).toBe(1);

    const localThis3 = {
      password:  '1234',
      minLength: 2
    };

    expect(PasswordStrength.computed.strength.call(localThis3)).toBe(1);

    const localThis4 = {
      password:  '1234abc',
      minLength: 2
    };

    expect(PasswordStrength.computed.strength.call(localThis4)).toBe(2);

    const localThis5 = {
      password:  '1234abc!',
      minLength: 2
    };

    expect(PasswordStrength.computed.strength.call(localThis5)).toBe(3);

    const localThis6 = {
      password:  '1234abcABC',
      minLength: 2
    };

    expect(PasswordStrength.computed.strength.call(localThis6)).toBe(3);

    const localThis7 = {
      password:  '1234abcABC!',
      minLength: 2
    };

    expect(PasswordStrength.computed.strength.call(localThis7)).toBe(4);
  });

  it('should return the correct strength state object', () => {
    const localThis1 = { strength: 0 };

    expect(PasswordStrength.computed.strengthState.call(localThis1)).toBe('');

    const localThis2 = { strength: 1 };

    expect(PasswordStrength.computed.strengthState.call(localThis2)).toStrictEqual({
      labelKey: 'changePassword.strength.weak',
      state:    'weak'
    });

    const localThis3 = { strength: 2 };

    expect(PasswordStrength.computed.strengthState.call(localThis3)).toStrictEqual({
      textClass: 'text-warning',
      labelKey:  'changePassword.strength.good',
      state:     'good'
    });

    const localThis4 = { strength: 3 };

    expect(PasswordStrength.computed.strengthState.call(localThis4)).toStrictEqual({
      textClass: 'text-success',
      labelKey:  'changePassword.strength.best',
      state:     'best'
    });
  });
});
