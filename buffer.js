var defineProperties;

export var BufferEncoder = (function() {
  class BufferEncoder {
    encode(object) {
      var buffer, byte, data, encode, writer;
      data = new Array();
      byte = 0;
      encode = function(value) {
        var byteLength, c, i, key, len, offset;
        byte = (offset = byte) + 3;
        if (value == null) {
          data[offset] = 3;
          data[byte++] = 1 * (value !== null);
        } else {
          switch (value.constructor) {
            case Object:
              for (key in value) {
                encode(key);
                encode(value[key]);
              }
              break;
            case Array:
              value.forEach(encode);
              data[offset] = 1;
              break;
            case Boolean:
              data[byte++] = value * 1;
              data[offset] = 2;
              break;
            case String:
              for (i = 0, len = value.length; i < len; i++) {
                c = value[i];
                data[byte++] = c.charCodeAt(0);
              }
              data[offset] = 4;
              break;
            case Number:
              byte = byte - 3;
              encode(value.toString());
              data[offset] = 5;
              break;
            default:
              if (value instanceof Node) {
                byte = byte - 3;
                encode(value.id);
                data[offset] = 6;
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
        writer.setUint8(byte, data[byte]);
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
        var array, keyLength, keyOffset, length, object, text, valLength, valOffset;
        type = type != null ? type : this.getUint8(byte);
        size = size != null ? size : this.getUint16(byte + 1);
        byte = byte + 3;
        switch (type) {
          case 0:
            object = new Object();
            while (size) {
              keyOffset = byte;
              keyLength = this.getUint16(keyOffset + 1);
              valOffset = keyOffset + keyLength + 3;
              valLength = this.getUint16(valOffset + 1);
              object[decode.call(this, keyOffset, keyLength)] = decode.call(this, valOffset, valLength);
              byte = byte + keyLength + valLength + 6;
              size = size - keyLength - valLength - 6;
            }
            return object;
          case 1:
            array = new Array();
            while (size) {
              length = this.getUint16(byte + 1);
              length && (array[array.length] = decode.call(this, byte, length));
              byte = byte + length + 3;
              size = size - length - 3;
            }
            return array;
          case 2:
            return 1 === this.getUint8(byte++);
          case 3:
            if (0 === this.getUint8(byte++)) {
              return null;
            } else {
              return void 0;
            }
            break;
          case 4:
            text = "";
            while (size--) {
              text = text + String.fromCharCode(this.getUint8(byte++));
            }
            return text;
          case 5:
            return Number(decode.call(this, byte - 3, size, 4));
          case 6:
            return document.getElementById(decode.call(this, byte - 3, size, 4));
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
