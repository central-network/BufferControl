var defineProperties,
  boundMethodCheck = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } };

export var BufferEncoder = (function() {
  class BufferEncoder {
    encode(object) {
      var buffer, byte, data, encode, f32i, val, writer;
      f32i = new Array();
      data = new Array();
      byte = 0;
      encode = function(value) {
        var byteLength, c, code, i, j, k, key, l, len, len1, len2, len3, len4, len5, m, n, o, offset, ref, v;
        byte = (offset = byte) + 3;
        if (value == null) {
          data[offset] = 4;
          data[byte++] = 1 * (value !== null);
        } else {
          switch (value.constructor) {
            case Object:
              for (key in value) {
                encode(key);
                encode(value[key]);
              }
              data[offset] = 1;
              break;
            case Array:
              value.forEach(encode);
              data[offset] = 2;
              break;
            case Boolean:
              data[byte++] = value * 1;
              data[offset] = 3;
              break;
            case String:
              for (j = 0, len = value.length; j < len; j++) {
                c = value[j];
                code = c.charCodeAt(0);
                data[byte++] = code >>> 8 & 0xff;
                data[byte++] = code & 0xff;
              }
              data[offset] = 5;
              break;
            case Number:
              ref = value.toString();
              for (k = 0, len1 = ref.length; k < len1; k++) {
                c = ref[k];
                data[byte++] = c.charCodeAt(0);
              }
              data[offset] = 6;
              break;
            case Float32Array:
              data[offset] = 8;
              for (l = 0, len2 = value.length; l < len2; l++) {
                v = value[l];
                f32i[byte] = v;
                byte = byte + 4;
              }
              break;
            case Uint32Array:
              for (i = m = 0, len3 = value.length; m < len3; i = ++m) {
                v = value[i];
                data[byte++] = v >>> 24 & 0xff;
                data[byte++] = v >>> 16 & 0xff;
                data[byte++] = v >>> 8 & 0xff;
                data[byte++] = v & 0xff;
              }
              data[offset] = 9;
              break;
            case Uint16Array:
              for (i = n = 0, len4 = value.length; n < len4; i = ++n) {
                v = value[i];
                data[byte++] = v >>> 8 & 0xff;
                data[byte++] = v & 0xff;
              }
              data[offset] = 10;
              break;
            case Uint8Array:
              for (i = o = 0, len5 = value.length; o < len5; i = ++o) {
                v = value[i];
                data[byte++] = v & 0xff;
              }
              data[offset] = 11;
              break;
            default:
              if (value instanceof Node) {
                byte = byte - 3;
                encode(value.id);
                data[offset] = 7;
              }
          }
        }
        byteLength = byte - offset - 3;
        data[offset + 1] = byteLength >> 8;
        data[offset + 2] = byteLength & 0xff;
        return byte;
      };
      writer = new DataView(new ArrayBuffer(encode(object)));
      while (byte--) {
        if (val = f32i[byte]) {
          writer.setFloat32(byte, val);
        } else if (val = data[byte]) {
          writer.setUint8(byte, val);
        }
      }
      data.length = 0;
      buffer = writer.buffer;
      writer = null;
      return buffer;
    }

  };

  BufferEncoder.prototype.__proto__ = null;

  return BufferEncoder;

}).call(this);

export var BufferDecoder = (function() {
  class BufferDecoder {
    decode(buffer) {
      var data, decode, view;
      data = (decode = function(byte, size, type) {
        var array, bytes, count, index, keyLength, keyOffset, length, object, text, valLength, valOffset;
        type = type != null ? type : this.getUint8(byte);
        size = size != null ? size : this.getUint16(byte + 1);
        byte = byte + 3;
        switch (type) {
          case 1:
            object = new Object();
            while (size) {
              keyOffset = byte;
              keyLength = this.getUint16(keyOffset + 1);
              valOffset = keyOffset + keyLength + 3;
              valLength = this.getUint16(valOffset + 1);
              object[decode.call(this, keyOffset, keyLength)] = !valLength ? null : decode.call(this, valOffset, valLength);
              byte = byte + keyLength + valLength + 6;
              size = size - keyLength - valLength - 6;
            }
            return object;
          case 2:
            array = new Array();
            while (size) {
              length = this.getUint16(byte + 1);
              length && (array[array.length] = decode.call(this, byte, length));
              byte = byte + length + 3;
              size = size - length - 3;
            }
            return array;
          case 3:
            return 1 === this.getUint8(byte++);
          case 4:
            if (0 === this.getUint8(byte++)) {
              return null;
            } else {
              return void 0;
            }
            break;
          case 5:
            text = "";
            while (size--) {
              text = text + String.fromCharCode(this.getUint16(byte++));
              byte++;
              size--;
            }
            return text;
          case 6:
            text = "";
            while (size--) {
              text = text + String.fromCharCode(this.getUint8(byte++));
            }
            return Number(text);
          case 7:
            return document.getElementById(decode.call(this, byte - 3, size, 5));
          case 8:
            bytes = Float32Array.BYTES_PER_ELEMENT;
            count = size / bytes;
            array = new Float32Array(count);
            index = 0;
            while (count--) {
              array[index++] = this.getFloat32(byte);
              byte = byte + bytes;
            }
            return array;
          case 9:
            bytes = Uint32Array.BYTES_PER_ELEMENT;
            count = size / bytes;
            array = new Uint32Array(count);
            index = 0;
            while (count--) {
              array[index++] = this.getUint32(byte);
              byte = byte + bytes;
            }
            return array;
          case 10:
            bytes = Uint16Array.BYTES_PER_ELEMENT;
            count = size / bytes;
            array = new Uint16Array(count);
            index = 0;
            while (count--) {
              array[index++] = this.getUint16(byte);
              byte = byte + bytes;
            }
            return array;
          case 11:
            bytes = Uint8Array.BYTES_PER_ELEMENT;
            count = size / bytes;
            array = new Uint8Array(count);
            index = 0;
            while (count--) {
              array[index++] = this.getUint8(byte);
              byte = byte + bytes;
            }
            return array;
          default:
            return void 0;
        }
      }).call(view = new DataView(buffer), 0);
      view = null;
      return data;
    }

  };

  BufferDecoder.prototype.__proto__ = null;

  return BufferDecoder;

}).call(this);

export var BufferObject = (function() {
  class BufferObject extends DataView {
    constructor(object = {}, maxByteLength = 1e6) {
      var key, val;
      super(new ArrayBuffer(0, {maxByteLength}));
      this.write = this.write.bind(this);
      this.find = this.find.bind(this);
      for (key in object) {
        val = object[key];
        this.write(key, val);
      }
      console.error(1, this.buffer);
      return new Proxy(this, {
        set: BufferObject.__setter__,
        get: BufferObject.__getter__
      });
    }

    resize(byteLength) {
      if (!(this.buffer.maxByteLength > byteLength)) {
        throw ["Max byte length exceed!", this.buffer.maxByteLength, byteLength, this];
      }
      this.buffer.resize(byteLength);
      return this;
    }

    write(key, val, match) {
      var byteLength, diffBytes, endOffset, i, j, k, keyBuffer, l, len, len1, len2, len3, len4, m, n, o, offset, p, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, v, valBuffer, valLength, valOffset;
      boundMethodCheck(this, BufferObject);
      valBuffer = this.encoder.encode(val);
      valLength = valBuffer.byteLength;
      if (match == null) {
        keyBuffer = this.encoder.encode(key);
        byteLength = (offset = this.byteLength) + keyBuffer.byteLength + valBuffer.byteLength;
        this.resize(byteLength);
        ref = new Uint8Array(keyBuffer);
        for (j = 0, len = ref.length; j < len; j++) {
          v = ref[j];
          this.setUint8(offset++, v);
        }
        ref1 = new Uint8Array(valBuffer);
        for (k = 0, len1 = ref1.length; k < len1; k++) {
          v = ref1[k];
          this.setUint8(offset++, v);
        }
        return this;
      }
      [offset, valOffset, endOffset] = match;
      (diffBytes = valLength - (endOffset - valOffset));
      if (!diffBytes) {
        ref2 = new Uint8Array(valBuffer);
        for (l = 0, len2 = ref2.length; l < len2; l++) {
          v = ref2[l];
          this.setUint8(valOffset++, v);
        }
      } else if (diffBytes > 0) {
        this.resize(this.byteLength + diffBytes);
        for (i = m = ref3 = this.byteLength - 1, ref4 = endOffset; (ref3 <= ref4 ? m < ref4 : m > ref4); i = ref3 <= ref4 ? ++m : --m) {
          this.setUint8(i, this.getUint8(i - diffBytes));
        }
        ref5 = new Uint8Array(valBuffer);
        for (n = 0, len3 = ref5.length; n < len3; n++) {
          v = ref5[n];
          this.setUint8(valOffset++, v);
        }
      } else if (diffBytes < 0) {
        ref6 = new Uint8Array(valBuffer);
        for (o = 0, len4 = ref6.length; o < len4; o++) {
          v = ref6[o];
          this.setUint8(valOffset++, v);
        }
        for (i = p = ref7 = valOffset, ref8 = this.byteLength; (ref7 <= ref8 ? p < ref8 : p > ref8); i = ref7 <= ref8 ? ++p : --p) {
          this.setUint8(i, this.getUint8(i + diffBytes));
        }
        this.resize(this.byteLength - diffBytes);
      }
      return this;
    }

    decode(start, end) {
      return this.decoder.decode(this.buffer.slice(start, end));
    }

    find(key, offset = 0, byteLength = this.byteLength) {
      var endOffset, keyLength, keyOffset, valLength, valOffset;
      boundMethodCheck(this, BufferObject);
      if (!(offset < byteLength)) {
        return;
      }
      if (!this.getUint8(offset)) {
        return;
      }
      keyOffset = offset;
      keyLength = this.getUint16(offset + 1);
      valOffset = keyOffset + 3 + keyLength;
      valLength = this.getUint16(1 + valOffset);
      endOffset = valOffset + 3 + valLength;
      if (key === this.decode(keyOffset, valOffset)) {
        return [offset, valOffset, endOffset];
      }
      return this.find(key, endOffset);
    }

    static __setter__(view, key, value, proxy) {
      return view.write(key, value, view.find(key));
    }

    static __getter__(view, key, proxy) {
      var result;
      if (!(result = view.find(key))) {
        return;
      }
      return view.decode(result[1], result[2]);
    }

  };

  BufferObject.prototype.encoder = new BufferEncoder();

  BufferObject.prototype.decoder = new BufferDecoder();

  return BufferObject;

}).call(this);

export default defineProperties = function() {
  Object.defineProperty(Object.prototype, "buffer", {
    get: function() {
      return new BufferEncoder().encode(this);
    }
  });
  Object.defineProperties(ArrayBuffer.prototype, {
    buffer: {
      value: null
    },
    object: {
      get: function() {
        return BufferDecoder.prototype.decode(this);
      }
    }
  });
  return delete ArrayBuffer.buffer;
};
