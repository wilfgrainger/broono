const benchmark = () => {
  const hashBuffer = new Uint8Array(32);
  for(let i=0; i<32; i++) hashBuffer[i] = Math.floor(Math.random() * 256);

  console.time('Array.from');
  for (let i = 0; i < 100000; i++) {
    Array.from(hashBuffer, b => b.toString(16).padStart(2, '0')).join('')
  }
  console.timeEnd('Array.from');

  const hexTable = new Array(256);
  for (let i = 0; i < 256; i++) {
    hexTable[i] = i.toString(16).padStart(2, '0');
  }

  console.time('Loop with table');
  for (let i = 0; i < 100000; i++) {
    let hex = '';
    const arr = new Uint8Array(hashBuffer);
    for (let j = 0; j < arr.length; j++) {
      hex += hexTable[arr[j]];
    }
  }
  console.timeEnd('Loop with table');
}

benchmark();
