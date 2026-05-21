const fs = require('fs');
const { DelsolClient, rec, firstDato } = require('./delsol-client.cjs');

(async () => {
  if (process.env.CONFIRMAR_CREACION !== 'SI') {
    throw new Error('Bloqueado. Para crear una factura de prueba ejecutar con CONFIRMAR_CREACION=SI');
  }

  const client = new DelsolClient();
  const lastResp = await client.consulta("SELECT MAX(CODFAC) AS ultimaFactura FROM F_FAC WHERE TIPFAC = '1'");
  const ultima = Number(firstDato(lastResp, 'ultimaFactura'));
  const nueva = ultima + 1;

  const existe = await client.consulta(`SELECT CODFAC FROM F_FAC WHERE TIPFAC = '1' AND CODFAC = ${nueva}`);
  if (existe.resultado && existe.resultado.length > 0) {
    throw new Error(`Ya existe la factura ${nueva}. No sigo.`);
  }

  const fecha = new Date().toISOString().slice(0, 10) + 'T00:00:00';

  const cabecera = rec({
    TIPFAC: '1',
    CODFAC: nueva,
    REFFAC: 'PRUEBA INTEGRACION LA BONITA',
    FECFAC: fecha,
    ESTFAC: 0,
    ALMFAC: 'GEN',
    CLIFAC: 3207,
    CNOFAC: 'AYUNTAMIENTO DE BENIARBEIG',
    CNIFAC: 'P0302600B',
    NET1FAC: 1,
    BAS1FAC: 1,
    PIVA1FAC: 21,
    IIVA1FAC: 0.21,
    TOTFAC: 1.21,
    EDRFAC: 2026,
    TRAFAC: 0,
    USUFAC: 5,
    USMFAC: 5,
  });

  const linea = rec({
    TIPLFA: '1',
    CODLFA: nueva,
    POSLFA: 1,
    ARTLFA: '',
    DESLFA: 'PRUEBA INTEGRACION LA BONITA - BORRAR',
    CANLFA: 1,
    PRELFA: 1,
    TOTLFA: 1,
    IVALFA: 0,
    PIVLFA: 0,
    TIVLFA: 0,
    DOCLFA: '',
    EJELFA: '',
  });

  console.log('Creando F_FAC', nueva);
  console.log(await client.escribirRegistro('F_FAC', cabecera));
  console.log('Creando F_LFA', nueva);
  console.log(await client.escribirRegistro('F_LFA', linea));

  const leerCab = await client.consulta(`SELECT TIPFAC, CODFAC, REFFAC, TOTFAC FROM F_FAC WHERE TIPFAC = '1' AND CODFAC = ${nueva}`);
  const leerLin = await client.consulta(`SELECT TIPLFA, CODLFA, POSLFA, DESLFA, TOTLFA FROM F_LFA WHERE TIPLFA = '1' AND CODLFA = ${nueva}`);
  fs.mkdirSync('./out', { recursive: true });
  fs.writeFileSync(`./out/prueba_factura_${nueva}_cabecera.json`, JSON.stringify(leerCab, null, 2));
  fs.writeFileSync(`./out/prueba_factura_${nueva}_lineas.json`, JSON.stringify(leerLin, null, 2));
  console.log('Factura creada:', nueva);
})().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
