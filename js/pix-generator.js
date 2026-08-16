/**
 * GERADOR DE CÓDIGO PIX (PAYLOAD EMV BR CODE)
 * Padrão Oficial do Banco Central do Brasil
 */

class PixPayload {
  constructor({ key, name, city, amount = 0, txtId = 'CASAMENTO' }) {
    this.key = key;
    this.name = this.normalizeString(name).substring(0, 25);
    this.city = this.normalizeString(city).substring(0, 15);
    this.amount = amount > 0 ? parseFloat(amount).toFixed(2) : null;
    this.txtId = this.normalizeString(txtId).replace(/[^a-zA-Z0-9]/g, '').substring(0, 25) || 'CASAMENTO';

    this.ID_PAYLOAD_FORMAT_INDICATOR = '00';
    this.ID_POINT_OF_INITIATION_METHOD = '01';
    this.ID_MERCHANT_ACCOUNT_INFORMATION = '26';
    this.ID_MERCHANT_ACCOUNT_INFORMATION_GUI = '00';
    this.ID_MERCHANT_ACCOUNT_INFORMATION_KEY = '01';
    this.ID_MERCHANT_CATEGORY_CODE = '52';
    this.ID_TRANSACTION_CURRENCY = '53';
    this.ID_TRANSACTION_AMOUNT = '54';
    this.ID_COUNTRY_CODE = '58';
    this.ID_MERCHANT_NAME = '59';
    this.ID_MERCHANT_CITY = '60';
    this.ID_ADDITIONAL_DATA_FIELD_TEMPLATE = '62';
    this.ID_ADDITIONAL_DATA_FIELD_TEMPLATE_TXID = '05';
    this.ID_CRC16 = '63';
  }

  normalizeString(str) {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
  }

  formatValue(id, value) {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  }

  getMerchantAccountInfo() {
    const gui = this.formatValue(this.ID_MERCHANT_ACCOUNT_INFORMATION_GUI, 'br.gov.bcb.pix');
    const key = this.formatValue(this.ID_MERCHANT_ACCOUNT_INFORMATION_KEY, this.key);
    return this.formatValue(this.ID_MERCHANT_ACCOUNT_INFORMATION, `${gui}${key}`);
  }

  getAdditionalDataField() {
    const txid = this.formatValue(this.ID_ADDITIONAL_DATA_FIELD_TEMPLATE_TXID, this.txtId);
    return this.formatValue(this.ID_ADDITIONAL_DATA_FIELD_TEMPLATE, txid);
  }

  getPayload() {
    let payload =
      this.formatValue(this.ID_PAYLOAD_FORMAT_INDICATOR, '01') +
      this.formatValue(this.ID_POINT_OF_INITIATION_METHOD, '12') + // 12 = Dinâmico/Estático reutilizável
      this.getMerchantAccountInfo() +
      this.formatValue(this.ID_MERCHANT_CATEGORY_CODE, '0000') +
      this.formatValue(this.ID_TRANSACTION_CURRENCY, '986') + // 986 = BRL
      (this.amount ? this.formatValue(this.ID_TRANSACTION_AMOUNT, this.amount) : '') +
      this.formatValue(this.ID_COUNTRY_CODE, 'BR') +
      this.formatValue(this.ID_MERCHANT_NAME, this.name) +
      this.formatValue(this.ID_MERCHANT_CITY, this.city) +
      this.getAdditionalDataField();

    payload += `${this.ID_CRC16}04`;
    const crc = this.calculateCRC16(payload);
    return `${payload}${crc}`;
  }

  calculateCRC16(str) {
    let crc = 0xffff;
    const polynomial = 0x1021;

    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = (crc << 1) ^ polynomial;
        } else {
          crc = crc << 1;
        }
        crc &= 0xffff;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }
}

window.PixPayload = PixPayload;
