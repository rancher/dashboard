export function compare(aa, bb) {
  const a = parse(aa);
  const b = parse(bb);

  if (!a) {
    return 1;
  }

  if (!b) {
    return -1;
  }

  let out = a.major - b.major;

  if (out === 0) {
    out = a.minor - b.minor;
    if (out === 0) {
      out = a.patch - b.patch;
    }
  }

  return Math.max(-1, Math.min(out, 1));
}

export function parse(str) {
  const match = str.match(/^v(\d+)([^\d]+)?(\d+)?$/);

  if (match) {
    const major = parseInt(match[1], 10);
    let minor;

    if (!match[2]) {
      minor = 99;
    } else if (match[2] === 'beta') {
      minor = 2;
    } else if (match[2] === 'alpha') {
      minor = 1;
    } else {
      minor = 0;
    }

    const patch = match[3] ? parseInt(match[3], 10) : 0;

    return {
      major,
      minor,
      patch
    };
  } else {
    return null;
  }
}
