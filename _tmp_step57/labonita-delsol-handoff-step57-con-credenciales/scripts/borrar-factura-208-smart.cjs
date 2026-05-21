const { DelsolClient } = require('./delsol-client.cjs');

(async () => {
  const client = new DelsolClient();

  console.log('Verificando existencia de F_LFA 208...');
  console.log(JSON.stringify(await client.consulta("SELECT TIPLFA, CODLFA, POSLFA FROM F_LFA WHERE TIPLFA = '1' AND CODLFA = 208"), null, 2));

  console.log('Intentando borrar línea F_LFA 208...');
  const delLin = await client.borrarRegistroSmart('F_LFA', "TIPLFA = '1' AND CODLFA = 208 AND POSLFA = 1");
  console.log(JSON.stringify(delLin, null, 2));

  console.log('Intentando borrar cabecera F_FAC 208...');
  const delCab = await client.borrarRegistroSmart('F_FAC', "TIPFAC = '1' AND CODFAC = 208");
  console.log(JSON.stringify(delCab, null, 2));

  console.log('Verificación final F_FAC 208:');
  console.log(JSON.stringify(await client.consulta("SELECT TIPFAC, CODFAC, REFFAC FROM F_FAC WHERE TIPFAC = '1' AND CODFAC = 208"), null, 2));

  console.log('Verificación final F_LFA 208:');
  console.log(JSON.stringify(await client.consulta("SELECT TIPLFA, CODLFA, POSLFA FROM F_LFA WHERE TIPLFA = '1' AND CODLFA = 208"), null, 2));
})().catch(err => {
  console.error('ERROR:', err.message);
  if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
  if (err.response) console.error(JSON.stringify(err.response, null, 2));
  console.error('Si todos los endpoints devuelven 404, pedir a Kiki la URL exacta de borrado exportada desde Postman.');
  process.exit(1);
});
