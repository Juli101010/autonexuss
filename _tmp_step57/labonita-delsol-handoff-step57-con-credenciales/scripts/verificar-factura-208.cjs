const { DelsolClient } = require('./delsol-client.cjs');

(async () => {
  const client = new DelsolClient();
  const cab = await client.consulta("SELECT TIPFAC, CODFAC, REFFAC, TOTFAC FROM F_FAC WHERE TIPFAC = '1' AND CODFAC = 208");
  const lin = await client.consulta("SELECT TIPLFA, CODLFA, POSLFA, DESLFA, TOTLFA FROM F_LFA WHERE TIPLFA = '1' AND CODLFA = 208");
  console.log('F_FAC 208:');
  console.log(JSON.stringify(cab, null, 2));
  console.log('F_LFA 208:');
  console.log(JSON.stringify(lin, null, 2));
})().catch(err => {
  console.error('ERROR:', err.message);
  if (err.response) console.error(JSON.stringify(err.response, null, 2));
  process.exit(1);
});
