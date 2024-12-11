const testStr = 'Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=';
const token = testStr.split(' ')[1];

const bufferObj = Buffer.from(token, 'base64');

const decodedString = bufferObj.toString('utf8');

console.log('The decoded string:', decodedString);
