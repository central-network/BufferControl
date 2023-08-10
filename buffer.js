var defineProperties;

export var BufferEncoder = (function() {
  class BufferEncoder {
    encode(object) {
      var buffer, byte, data, encode, f32i, val, writer;
      f32i = new Array();
      data = new Array();
      byte = 0;
      encode = function(value) {
        var byteLength, c, code, i, j, k, key, l, len, len1, len2, len3, len4, len5, m, n, o, offset, ref, v;
        offset = byte + 1;
        byte = byte + 4;
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
                if (code > 255) {
                  data[byte++] = 1;
                  data[byte++] = code >>> 8 & 0xff;
                  data[byte++] = code & 0xff;
                } else {
                  data[byte++] = code;
                }
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
                byte = byte - 4;
                encode(value.id);
                data[offset] = 7;
              }
          }
        }
        byteLength = byte - offset + 1 - 4;
        data[offset - 1] = 0;
        data[offset + 1] = byteLength >> 8 & 0xff;
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

    string(value) {
      var buffer, byte, c, code, data, j, len, writer;
      data = new Array();
      byte = 0;
      for (j = 0, len = value.length; j < len; j++) {
        c = value[j];
        code = c.charCodeAt(0);
        if (code > 255) {
          data[byte++] = 1;
          data[byte++] = code >>> 8 & 0xff;
          data[byte++] = code & 0xff;
        } else {
          data[byte++] = code;
        }
      }
      buffer = new ArrayBuffer(byte);
      writer = new Uint8Array(buffer);
      while (byte--) {
        writer[byte] = data[byte];
      }
      data.length = 0;
      writer = null;
      return buffer;
    }

  };

  BufferEncoder.prototype.__proto__ = null;

  return BufferEncoder;

}).call(this);

export var BufferDecoder = (function() {
  class BufferDecoder {
    decode(buffer, offset, length) {
      var data, decode, view;
      data = (decode = function(byte, size, type) {
        var array, bytes, code, count, index, keyLength, keyOffset, object, text, valLength, valOffset;
        type = type != null ? type : this.getUint16(byte);
        size = size != null ? size : this.getUint16(byte + 2);
        byte = byte + 4;
        switch (type) {
          case 1:
            object = new Object();
            while (size) {
              keyOffset = byte;
              keyLength = this.getUint16(keyOffset + 2);
              valOffset = keyOffset + keyLength + 4;
              valLength = this.getUint16(valOffset + 2);
              object[decode.call(this, keyOffset, keyLength)] = !valLength ? null : decode.call(this, valOffset, valLength);
              length = valLength + keyLength + 8;
              byte = byte + length;
              size = size - length;
            }
            return object;
          case 2:
            array = new Array();
            while (size) {
              length = this.getUint16(byte + 2);
              length && (array[array.length] = decode.call(this, byte, length));
              byte = byte + length + 4;
              size = size - length - 4;
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
              code = this.getUint8(byte++);
              if (!(1 - code)) {
                code = this.getUint8(byte++) + this.getUint8(byte++);
                size = size - 2;
              }
              text = text + String.fromCharCode(code);
            }
            return text;
          case 6:
            text = "";
            while (size--) {
              text = text + String.fromCharCode(this.getUint8(byte++));
            }
            return Number(text);
          case 7:
            return document.getElementById(decode.call(this, byte - 4, size, 5));
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
      }).call(view = new DataView(buffer, offset, length), 0);
      view = null;
      return data;
    }

    string(buffer, offset, length) {
      var code, string, tarray;
      tarray = new Uint8Array(buffer, offset, length);
      offset = 0;
      string = "";
      while (code = tarray[offset++]) {
        if (!(code - 1)) {
          code = 255 + (tarray[offset++] + tarray[offset++]);
        }
        string = string + String.fromCharCode(code);
      }
      return string;
    }

  };

  BufferDecoder.prototype.__proto__ = null;

  return BufferDecoder;

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
