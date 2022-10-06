let _isRancherPrime = false;

export function isRancherPrime() {
  return _isRancherPrime;
}

export function setIsRancherPrime(v) {
  _isRancherPrime = v.RancherPrime.toLowerCase() === 'true';
}
