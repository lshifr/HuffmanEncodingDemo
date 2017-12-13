## Animation / visualization of the Huffman encoding algorithm

This app illustrates the Huffman encoding / decoding algorithm. Given an input string, it builds the Huffman tree and encodes the string. Then, one can run the animation of the decoding process. 

[Live demo](https://lshifr.github.io/HuffmanEncodingDemo/)

One can control the speed of the animation, as well as pause and resume the animation at any time, by using the animation controls.

The main didactic purpose of this small app was to illustrate how one can implement the Huffman tree traversal in an asynchronous fashion, with the help of javascript promises and ES6 generators, which help to write synchronous-looking code which is actually asynchronous. 

The main property of ES6 generators (that they can be entered and returned from more than once, and keep the state in between), made it easy to implement decoding algorithm in an asynchronous fashion, so that, in particular, the decoding process can be paused and resumed at any time, with arbitrary other actions performed in between those steps.   

