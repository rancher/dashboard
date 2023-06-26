/* eslint-disable node/no-deprecated-api */
import { Buffer } from 'buffer';
import Md5 from './browserMd5';
import Sha256 from './browserSha256';
import Sha1 from './browserSha1';

// lib/util.js
const NORMAL = 'normal';
const URL = 'url';

export function base64Encode(string, alphabet = NORMAL) {
  let buf;

  if (string === null || typeof string === 'undefined') {
    return string;
  }

  if ( typeof Buffer.from === 'function' && Buffer.from !== Uint8Array.from ) {
    buf = Buffer.from(string);
  } else {
    buf = new Buffer(string);
  }
  if (alphabet === URL) {
    const m = {
      '+': '-',
      '/': '_',
    };

    return buf.toString('base64').replace(/[+/]|=+$/g, (char) => m[char] || '');
  }

  return buf.toString('base64');
}

export function base64DecodeToBuffer(string) {
  if (string === null || typeof string === 'undefined') {
    return string;
  }

  if ( typeof Buffer.from === 'function' && Buffer.from !== Uint8Array.from ) {
    return Buffer.from(string, 'base64');
  } else {
    return new Buffer(string, 'base64');
  }
}

export function base64Decode(string) {
  return !string ? string : base64DecodeToBuffer(string.replace(/[-_]/g, (char) => char === '-' ? '+' : '/')).toString();
}

export function md5(data, digest, callback) {
  return hash('md5', data, digest, callback);
}

export function sha256(data, digest, callback) {
  return hash('sha256', data, digest, callback);
}

export function binarySize(val) {
  const size = `${ val }`.length;

  // It is base64 encoded, so adjust size
  let realSize = (3 * size / 4) ;

  // Might be one or two padding characters
  if (val.length > 0 && val[val.length - 1] === '=') {
    realSize--;
    if (val.length > 1 && val[val.length - 2] === '=') {
      realSize--;
    }
  }

  return realSize;
}

// *****************************
// Below here be dragons
// *****************************

function hash(algorithm, data, digest, callback) {
  const hash = createHash(algorithm);

  if ( !digest ) {
    digest = 'binary';
  }

  if ( digest === 'buffer' ) {
    digest = undefined;
  }

  if ( typeof data === 'string' ) {
    data = new Buffer(data);
  }

  const sliceFn = arraySliceFn(data);
  let isBuffer = Buffer.isBuffer(data);

  // Identifying objects with an ArrayBuffer as buffers
  if ( typeof ArrayBuffer !== 'undefined' && data && data.buffer instanceof ArrayBuffer) {
    isBuffer = true;
  }

  if ( callback && typeof data === 'object' && typeof data.on === 'function' && !isBuffer ) {
    data.on('data', (chunk) => {
      hash.update(chunk);
    });

    data.on('error', (err) => {
      callback(err);
    });

    data.on('end', () => {
      callback(null, hash.digest(digest));
    });
  } else if (callback && sliceFn && !isBuffer && typeof FileReader !== 'undefined') {
    // this might be a File/Blob
    let index = 0; const size = 1024 * 512;
    const reader = new FileReader();

    reader.onerror = function() {
      callback(new Error('Failed to read data.'));
    };

    reader.onload = function() {
      const buf = new Buffer(new Uint8Array(reader.result));

      hash.update(buf);
      index += buf.length;
      reader._continueReading();
    };

    reader._continueReading = function() {
      if (index >= data.size) {
        callback(null, hash.digest(digest));

        return;
      }

      let back = index + size;

      if (back > data.size) {
        back = data.size;
      }

      reader.readAsArrayBuffer(sliceFn.call(data, index, back));
    };

    reader._continueReading();
  } else {
    if ( typeof data === 'object' && !isBuffer ) {
      data = new Buffer(new Uint8Array(data));
    }

    const out = hash.update(data).digest(digest);

    if (callback) {
      callback(null, out);
    }

    return out;
  }
}

function createHash(alg) {
  alg = alg.toLowerCase();
  if (alg === 'md5') {
    return new Md5();
  } else if (alg === 'sha256') {
    return new Sha256();
  } else if (alg === 'sha1') {
    return new Sha1();
  }

  throw new Error(`Hash algorithm ${ alg } is not supported`);
}

function arraySliceFn(obj) {
  const fn = obj.slice || obj.webkitSlice || obj.mozSlice;

  return typeof fn === 'function' ? fn : null;
}
