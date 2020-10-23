import { sortableNumericSuffix } from '@/utils/sort';

export function parse(str) {
  str = `${ str }`;

  // Trim off leading 'v'
  if ( str.substr(0, 1).toLowerCase() === 'v' ) {
    str = str.substr(1);
  }

  const parts = str.split(/[.+-]/);

  return parts;
}

export function sortable(str) {
  return parse(str).map(x => sortableNumericSuffix(x)).join('.');
}

export function compare(in1, in2) {
  if ( !in1 ) {
    return 1;
  }

  if ( !in2 ) {
    return -1;
  }

  const p1 = parse(in1);
  const p2 = parse(in2);

  const minLen = Math.min(p1.length, p2.length);

  for ( let i = 0 ; i < minLen ; i++ ) {
    const res = comparePart(p1[i], p2[i]);

    if ( res !== 0 ) {
      return res;
    }
  }

  return p1.length - p2.length;
}

function isNumeric(str) {
  return (`${ str }`).match(/^([0-9]+\.)?[0-9]*$/);
}

function comparePart(in1, in2) {
  in1 = (`${ in1 }`).toLowerCase();
  in2 = (`${ in2 }`).toLowerCase();

  if ( isNumeric(in1) && isNumeric(in2) ) {
    const num1 = parseInt(in1, 10);
    const num2 = parseInt(in2, 10);

    if ( !isNaN(num1) && !isNaN(num2) ) {
      return num1 - num2;
    }
  }

  return in1.localeCompare(in2);
}
