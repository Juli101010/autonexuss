const fs = require('fs');

function readJson(path) {
  const text = fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(text);
}

function flat(path) {
  const json = readJson(path);
  return Object.fromEntries(json.resultado[0].map(x => [x.columna, x.dato]));
}

const fac = flat('./out/13_factura_207_completa.json');
const lfa = flat('./out/14_factura_207_linea_completa.json');

console.log('CABECERA F_FAC campos:', Object.keys(fac).length);
console.log({
  TIPFAC: fac.TIPFAC,
  CODFAC: fac.CODFAC,
  REFFAC: fac.REFFAC,
  FECFAC: fac.FECFAC,
  CLIFAC: fac.CLIFAC,
  CNOFAC: fac.CNOFAC,
  CNIFAC: fac.CNIFAC,
  NET1FAC: fac.NET1FAC,
  BAS1FAC: fac.BAS1FAC,
  PIVA1FAC: fac.PIVA1FAC,
  IIVA1FAC: fac.IIVA1FAC,
  TOTFAC: fac.TOTFAC,
  ESTFAC: fac.ESTFAC,
  EDRFAC: fac.EDRFAC,
  ALMFAC: fac.ALMFAC,
  TRAFAC: fac.TRAFAC,
  USUFAC: fac.USUFAC,
  USMFAC: fac.USMFAC,
});

console.log('LINEA F_LFA campos:', Object.keys(lfa).length);
console.log({
  TIPLFA: lfa.TIPLFA,
  CODLFA: lfa.CODLFA,
  POSLFA: lfa.POSLFA,
  ARTLFA: lfa.ARTLFA,
  DESLFA: lfa.DESLFA,
  CANLFA: lfa.CANLFA,
  PRELFA: lfa.PRELFA,
  TOTLFA: lfa.TOTLFA,
  IVALFA: lfa.IVALFA,
  PIVLFA: lfa.PIVLFA,
  TIVLFA: lfa.TIVLFA,
  DOCLFA: lfa.DOCLFA,
  EJELFA: lfa.EJELFA,
});
