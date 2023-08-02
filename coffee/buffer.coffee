export class BufferEncoder

	__proto__ 	: null
	encode 		: ( object ) ->

		data = new Array()
		byte = 0

		encode = ( value ) ->
			byte = ( offset = byte ) + 3

			unless value?

				data[ offset ] = 3
				data[ byte++ ] = 1 * (value isnt null)

			else switch value.constructor

				when Object
					for key of value
						encode key
						encode value[ key ]

				when Array
					value.forEach encode
					data[ offset ] = 1

				when Boolean
					data[ byte++ ] = value * 1
					data[ offset ] = 2

				when String
					for c in value
						data[ byte++ ] = 
							c.charCodeAt( 0 ) 
					data[ offset ] = 4

				when Number
					byte = byte - 3
					encode value.toString()
					data[ offset ] = 5

				when Float32Array
					for v, i in value
						data[ byte++ ] = v >>> 24 & 0xff
						data[ byte++ ] = v >>> 16 & 0xff
						data[ byte++ ] = v >>>  8 & 0xff
						data[ byte++ ] = v & 0xff
					data[ offset ] = 7

				else 
					if  value instanceof Node 
						byte = byte - 3
						encode value.id
						data[ offset ] = 6


			byteLength = byte - offset - 3

			data[ offset + 1 ] = byteLength >> 8
			data[ offset + 2 ] = byteLength & 0xff

			byte

		writer = new DataView(
			new ArrayBuffer(
				encode object
			)
		)

		while byte-- then writer.setUint8(
			byte, data[ byte ]
		)

		data.length = 0

		buffer = writer.buffer
		writer = null ; buffer 

export class BufferDecoder

	__proto__ 	: null
	decode 		: ( buffer ) ->
		data = ( decode = ( byte, size, type ) ->

			type = type ? @getUint8 byte
			size = size ? @getUint16 byte + 1
			byte = byte + 3

			switch type

				when 0
					object = new Object()

					while size

						keyOffset = byte
						keyLength = @getUint16 keyOffset + 1
						
						valOffset = keyOffset + keyLength + 3
						valLength = @getUint16 valOffset + 1

						object[ decode.call this, keyOffset, keyLength
						] = decode.call this, valOffset, valLength

						byte = byte + keyLength + valLength + 6
						size = size - keyLength - valLength - 6

					object

				when 1
					array = new Array()

					while size

						length = @getUint16 byte + 1
						length and array[ array.length
						] = decode.call this, byte, length
						
						byte = byte + length + 3
						size = size - length - 3

					array

				when 2
					1 is @getUint8 byte++

				when 3
					if 0 is @getUint8 byte++
					then null else undefined

				when 4
					text = ""
					while size--
						text = text + String.fromCharCode(
							@getUint8 byte++
						)
					text

				when 5
					Number decode.call this, byte-3, size, 4 
					
				when 6
					document.getElementById decode.call this, byte-3, size, 4
					
				when 7
					count = size / Float32Array.BYTES_PER_ELEMENT
					array = new Float32Array count
					index = 0

					while count--
						array[ index++ ] =
							@getFloat32 byte
						byte = byte + 4

					array

				else undefined

		).call( view = new DataView( buffer ), 0 )

		view = null ; data

export default defineProperties = ->
    Object.defineProperty Object::, "buffer", get : ->
        new BufferEncoder().encode( this )

    Object.defineProperties ArrayBuffer::, {
        buffer : value : null
        object : get : -> BufferDecoder::decode @ 
    }

    delete ArrayBuffer.buffer

