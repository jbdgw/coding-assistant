// Sample file with intentional issues for testing

function testFunction() {
  var x = 1; // Should use const instead of var
  console.log(x);

  var unused = 'This variable is never used';

  // Missing semicolon
  const y = 2;

  // Inconsistent quotes
  const str1 = 'double quotes';
  const str2 = 'single quotes';
}

function veryLongFunction() {
  // This function intentionally has many lines
  const a = 1;
  const b = 2;
  const c = 3;
  const d = 4;
  const e = 5;
  const f = 6;
  const g = 7;
  const h = 8;
  const i = 9;
  const j = 10;
  const k = 11;
  const l = 12;
  const m = 13;
  const n = 14;
  const o = 15;
  const p = 16;
  const q = 17;
  const r = 18;
  const s = 19;
  const t = 20;

  return a + b + c + d + e + f + g + h + i + j + k + l + m + n + o + p + q + r + s + t;
}

// Export unused function
export { testFunction };
