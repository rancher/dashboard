/* eslint-disable camelcase */
import { Buffer } from 'buffer';
import { isEmptyData, convertToBuffer } from './browserHashUtils';

const BLOCK_SIZE = 64;

const DIGEST_LENGTH = 32;

const KEY = new Uint32Array([
  0x428A2F98,
  0x71374491,
  0xB5C0FBCF,
  0xE9B5DBA5,
  0x3956C25B,
  0x59F111F1,
  0x923F82A4,
  0xAB1C5ED5,
  0xD807AA98,
  0x12835B01,
  0x243185BE,
  0x550C7DC3,
  0x72BE5D74,
  0x80DEB1FE,
  0x9BDC06A7,
  0xC19BF174,
  0xE49B69C1,
  0xEFBE4786,
  0x0FC19DC6,
  0x240CA1CC,
  0x2DE92C6F,
  0x4A7484AA,
  0x5CB0A9DC,
  0x76F988DA,
  0x983E5152,
  0xA831C66D,
  0xB00327C8,
  0xBF597FC7,
  0xC6E00BF3,
  0xD5A79147,
  0x06CA6351,
  0x14292967,
  0x27B70A85,
  0x2E1B2138,
  0x4D2C6DFC,
  0x53380D13,
  0x650A7354,
  0x766A0ABB,
  0x81C2C92E,
  0x92722C85,
  0xA2BFE8A1,
  0xA81A664B,
  0xC24B8B70,
  0xC76C51A3,
  0xD192E819,
  0xD6990624,
  0xF40E3585,
  0x106AA070,
  0x19A4C116,
  0x1E376C08,
  0x2748774C,
  0x34B0BCB5,
  0x391C0CB3,
  0x4ED8AA4A,
  0x5B9CCA4F,
  0x682E6FF3,
  0x748F82EE,
  0x78A5636F,
  0x84C87814,
  0x8CC70208,
  0x90BEFFFA,
  0xA4506CEB,
  0xBEF9A3F7,
  0xC67178F2
]);

const MAX_HASHABLE_LENGTH = 2 ** 53 - 1;

/**
 * @private
 */
function Sha256() {
  this.state = [
    0x6A09E667,
    0xBB67AE85,
    0x3C6EF372,
    0xA54FF53A,
    0x510E527F,
    0x9B05688C,
    0x1F83D9AB,
    0x5BE0CD19,
  ];
  this.temp = new Int32Array(64);
  this.buffer = new Uint8Array(64);
  this.bufferLength = 0;
  this.bytesHashed = 0;
  /**
     * @private
     */
  this.finished = false;
}

/**
 * @api private
 */
export default Sha256;

Sha256.BLOCK_SIZE = BLOCK_SIZE;

Sha256.prototype.update = function(data) {
  if (this.finished) {
    throw new Error('Attempted to update an already finished hash.');
  }

  if (isEmptyData(data)) {
    return this;
  }

  data = convertToBuffer(data);

  let position = 0;
  let byteLength = data.byteLength;

  this.bytesHashed += byteLength;
  if (this.bytesHashed * 8 > MAX_HASHABLE_LENGTH) {
    throw new Error('Cannot hash more than 2^53 - 1 bits');
  }

  while (byteLength > 0) {
    this.buffer[this.bufferLength++] = data[position++];
    byteLength--;
    if (this.bufferLength === BLOCK_SIZE) {
      this.hashBuffer();
      this.bufferLength = 0;
    }
  }

  return this;
};

Sha256.prototype.digest = function(encoding) {
  if (!this.finished) {
    const bitsHashed = this.bytesHashed * 8;
    const bufferView = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);
    const undecoratedLength = this.bufferLength;

    bufferView.setUint8(this.bufferLength++, 0x80);
    // Ensure the final block has enough room for the hashed length
    if (undecoratedLength % BLOCK_SIZE >= BLOCK_SIZE - 8) {
      for (let i = this.bufferLength; i < BLOCK_SIZE; i++) {
        bufferView.setUint8(i, 0);
      }
      this.hashBuffer();
      this.bufferLength = 0;
    }
    for (let i = this.bufferLength; i < BLOCK_SIZE - 8; i++) {
      bufferView.setUint8(i, 0);
    }
    bufferView.setUint32(BLOCK_SIZE - 8, Math.floor(bitsHashed / 0x100000000), true);
    bufferView.setUint32(BLOCK_SIZE - 4, bitsHashed);
    this.hashBuffer();
    this.finished = true;
  }
  // The value in state is little-endian rather than big-endian, so flip
  // each word into a new Uint8Array
  // eslint-disable-next-line node/no-deprecated-api
  const out = new Buffer(DIGEST_LENGTH);

  for (let i = 0; i < 8; i++) {
    out[i * 4] = (this.state[i] >>> 24) & 0xFF;
    out[i * 4 + 1] = (this.state[i] >>> 16) & 0xFF;
    out[i * 4 + 2] = (this.state[i] >>> 8) & 0xFF;
    out[i * 4 + 3] = (this.state[i] >>> 0) & 0xFF;
  }

  return encoding ? out.toString(encoding) : out;
};

Sha256.prototype.hashBuffer = function() {
  const _a = this;
  const buffer = _a.buffer;
  const state = _a.state;
  let state0 = state[0];
  let state1 = state[1];
  let state2 = state[2];
  let state3 = state[3];
  let state4 = state[4];
  let state5 = state[5];
  let state6 = state[6];
  let state7 = state[7];

  for (let i = 0; i < BLOCK_SIZE; i++) {
    if (i < 16) {
      this.temp[i] = (((buffer[i * 4] & 0xFF) << 24) |
                ((buffer[(i * 4) + 1] & 0xFF) << 16) |
                ((buffer[(i * 4) + 2] & 0xFF) << 8) |
                (buffer[(i * 4) + 3] & 0xFF));
    } else {
      let u = this.temp[i - 2];
      const t1_1 = (u >>> 17 | u << 15) ^
                (u >>> 19 | u << 13) ^
                (u >>> 10);

      u = this.temp[i - 15];
      const t2_1 = (u >>> 7 | u << 25) ^
                (u >>> 18 | u << 14) ^
                (u >>> 3);

      this.temp[i] = (t1_1 + this.temp[i - 7] | 0) +
                (t2_1 + this.temp[i - 16] | 0);
    }
    const t1 = (((((state4 >>> 6 | state4 << 26) ^
            (state4 >>> 11 | state4 << 21) ^
            (state4 >>> 25 | state4 << 7)) +
            ((state4 & state5) ^ (~state4 & state6))) | 0) +
            ((state7 + ((KEY[i] + this.temp[i]) | 0)) | 0)) | 0;
    const t2 = (((state0 >>> 2 | state0 << 30) ^
            (state0 >>> 13 | state0 << 19) ^
            (state0 >>> 22 | state0 << 10)) + ((state0 & state1) ^ (state0 & state2) ^ (state1 & state2))) | 0;

    state7 = state6;
    state6 = state5;
    state5 = state4;
    state4 = (state3 + t1) | 0;
    state3 = state2;
    state2 = state1;
    state1 = state0;
    state0 = (t1 + t2) | 0;
  }
  state[0] += state0;
  state[1] += state1;
  state[2] += state2;
  state[3] += state3;
  state[4] += state4;
  state[5] += state5;
  state[6] += state6;
  state[7] += state7;
};
