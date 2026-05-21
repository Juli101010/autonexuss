const { DelsolClient, rec, firstDato } = require('./delsol-client.cjs');

class DelsolInvoiceService {
  constructor() {
    this.client = new DelsolClient();
  }

  async getNextInvoiceNumber() {
    const resp = await this.client.consulta("SELECT MAX(CODFAC) AS ultimaFactura FROM F_FAC WHERE TIPFAC = '1'");
    const ultima = Number(firstDato(resp, 'ultimaFactura'));
    return ultima + 1;
  }

  async createInvoiceFromPetition(petition) {
    if (petition.delsolInvoiceNumber) {
      throw new Error(`La petición ya tiene factura DELSOL ${petition.delsolInvoiceNumber}`);
    }

    const codfac = await this.getNextInvoiceNumber();
    const base = Number(petition.amountBase);
    const ivaPct = Number(petition.ivaPct ?? 21);
    const ivaAmount = Number((base * ivaPct / 100).toFixed(2));
    const total = Number((base + ivaAmount).toFixed(2));
    const fecha = new Date().toISOString().slice(0, 10) + 'T00:00:00';

    const cabecera = rec({
      TIPFAC: '1',
      CODFAC: codfac,
      REFFAC: petition.reference,
      FECFAC: fecha,
      ESTFAC: 0,
      ALMFAC: 'GEN',
      CLIFAC: petition.delsolClientCode,
      CNOFAC: petition.clientName,
      CNIFAC: petition.clientTaxId,
      NET1FAC: base,
      BAS1FAC: base,
      PIVA1FAC: ivaPct,
      IIVA1FAC: ivaAmount,
      TOTFAC: total,
      EDRFAC: 2026,
      TRAFAC: 0,
      USUFAC: 5,
      USMFAC: 5,
    });

    const linea = rec({
      TIPLFA: '1',
      CODLFA: codfac,
      POSLFA: 1,
      ARTLFA: petition.articleCode || '',
      DESLFA: petition.description,
      CANLFA: petition.quantity || 1,
      PRELFA: base,
      TOTLFA: base,
      IVALFA: 0,
      PIVLFA: 0,
      TIVLFA: 0,
      DOCLFA: '',
      EJELFA: '',
    });

    const altaCab = await this.client.escribirRegistro('F_FAC', cabecera);
    if (altaCab.respuesta !== 'OK') throw new Error(`Error F_FAC: ${JSON.stringify(altaCab)}`);

    const altaLin = await this.client.escribirRegistro('F_LFA', linea);
    if (altaLin.respuesta !== 'OK') throw new Error(`Error F_LFA: ${JSON.stringify(altaLin)}`);

    return { codfac, altaCab, altaLin };
  }
}

module.exports = { DelsolInvoiceService };
