# BufferControl
 Operating buffers with encoder and decoder.

This package has two class and they are like standart javascript objects: TextEncoder/TextDecoder.

Main purpose of these methods is performance gaining for conversion between objects and ArrayBuffers (vice versa). Because of the easy method to make this process is based on the JSON.stringify/parse and these processes are consumping too much CPU sources.

The BufferEncoder method is a recursive function which encodes defined kind of object constructors and each of constructor has unique encoding algorithm to being more effective then JSON.stringify. For example, bufferizing a string value in the chain of given object has only one loop which pushes charCode value at index to buffer.

Usage of these methods is similar with TextEncoder and TextDecoder too. Bufferizing any kind of object could be done with code:

```
import { BufferEncoder } from "BufferControl"

encoder = new BufferEncoder()

_..._

myText = "Lorem ipsum dolor sit amet!"
myTextBuffer = encoder.encode( myText )
```