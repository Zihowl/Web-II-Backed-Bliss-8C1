// Generador de CFDI 4.0 simulado (sin timbrar: sin sello ni PAC).
// Construye un XML con la estructura legal de facturacion mexicana (SAT CFDI 4.0)
// a partir de los items de un pedido. El precio de cada producto ya incluye IVA 16%,
// por lo que se desglosa hacia atras: valorUnitario = precio / 1.16.

const IVA_RATE = 0.16;

// Datos genericos del emisor (la pasteleria).
const EMISOR = {
  rfc: 'BBL010101AAA',
  nombre: 'Backed Bliss SA de CV',
  regimenFiscal: '601', // General de Ley Personas Morales
};

// Receptor generico: "PUBLICO EN GENERAL" (RFC generico del SAT).
const RECEPTOR = {
  rfc: 'XAXX010101000',
  nombre: 'PUBLICO EN GENERAL',
  domicilioFiscalReceptor: '00000',
  regimenFiscalReceptor: '616', // Sin obligaciones fiscales
  usoCFDI: 'S01', // Sin efectos fiscales
};

const escapeXml = (value) =>
  String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// Construye el XML CFDI 4.0 simulado. `items` son los productos del pedido:
// { id, name, quantity, price, ... } donde price incluye IVA.
const buildCfdiXml = (items, options = {}) => {
  const receptor = { ...RECEPTOR, ...(options.receptor || {}) };
  const fecha = (options.fecha || new Date()).toISOString().slice(0, 19);

  let subTotal = 0;
  let totalImpuestos = 0;
  const conceptos = [];

  for (const item of items) {
    const quantity = Number(item.quantity) || 1;
    const price = Number(item.price) || 0; // precio unitario con IVA incluido
    const valorUnitario = round2(price / (1 + IVA_RATE));
    const lineTotal = round2(price * quantity); // lo realmente pagado por la linea
    const importe = round2(lineTotal / (1 + IVA_RATE));
    // IVA como diferencia para que importe + IVA == lineTotal (sin desfase de centavos)
    const ivaImporte = round2(lineTotal - importe);

    subTotal = round2(subTotal + importe);
    totalImpuestos = round2(totalImpuestos + ivaImporte);

    conceptos.push(
      `    <cfdi:Concepto ClaveProdServ="50161800" Cantidad="${quantity}" ` +
        `ClaveUnidad="H87" Descripcion="${escapeXml(item.name)}" ` +
        `ValorUnitario="${valorUnitario.toFixed(2)}" Importe="${importe.toFixed(2)}" ObjetoImp="02">\n` +
        `      <cfdi:Impuestos>\n` +
        `        <cfdi:Traslados>\n` +
        `          <cfdi:Traslado Base="${importe.toFixed(2)}" Impuesto="002" TipoFactor="Tasa" ` +
        `TasaOCuota="0.160000" Importe="${ivaImporte.toFixed(2)}"/>\n` +
        `        </cfdi:Traslados>\n` +
        `      </cfdi:Impuestos>\n` +
        `    </cfdi:Concepto>`
    );
  }

  const total = round2(subTotal + totalImpuestos);

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Version="4.0" ` +
    `Fecha="${fecha}" SubTotal="${subTotal.toFixed(2)}" Moneda="MXN" ` +
    `Total="${total.toFixed(2)}" TipoDeComprobante="I" Exportacion="01" ` +
    `MetodoPago="PUE" FormaPago="03" LugarExpedicion="00000">\n` +
    `  <cfdi:Emisor Rfc="${EMISOR.rfc}" Nombre="${escapeXml(EMISOR.nombre)}" ` +
    `RegimenFiscal="${EMISOR.regimenFiscal}"/>\n` +
    `  <cfdi:Receptor Rfc="${receptor.rfc}" Nombre="${escapeXml(receptor.nombre)}" ` +
    `DomicilioFiscalReceptor="${receptor.domicilioFiscalReceptor}" ` +
    `RegimenFiscalReceptor="${receptor.regimenFiscalReceptor}" UsoCFDI="${receptor.usoCFDI}"/>\n` +
    `  <cfdi:Conceptos>\n` +
    `${conceptos.join('\n')}\n` +
    `  </cfdi:Conceptos>\n` +
    `  <cfdi:Impuestos TotalImpuestosTrasladados="${totalImpuestos.toFixed(2)}">\n` +
    `    <cfdi:Traslados>\n` +
    `      <cfdi:Traslado Base="${subTotal.toFixed(2)}" Impuesto="002" TipoFactor="Tasa" ` +
    `TasaOCuota="0.160000" Importe="${totalImpuestos.toFixed(2)}"/>\n` +
    `    </cfdi:Traslados>\n` +
    `  </cfdi:Impuestos>\n` +
    `</cfdi:Comprobante>`
  );
};

// Extrae datos del CFDI XML para devolverlos al frontend (total e items).
// Parser ligero por regex, suficiente para el CFDI simulado generado aqui.
const parseCfdiXml = (xml) => {
  if (!xml || typeof xml !== 'string') {
    return { total: 0, items: [] };
  }

  const totalMatch = xml.match(/<cfdi:Comprobante[^>]*\sTotal="([^"]+)"/);
  const total = totalMatch ? Number(totalMatch[1]) : 0;

  const items = [];
  const conceptoRegex = /<cfdi:Concepto\b([^>]*)\/?>/g;
  let m;
  while ((m = conceptoRegex.exec(xml)) !== null) {
    const attrs = m[1];
    const get = (name) => {
      const r = attrs.match(new RegExp(`\\s${name}="([^"]*)"`));
      return r ? r[1] : '';
    };
    const cantidad = Number(get('Cantidad')) || 1;
    const valorUnitario = Number(get('ValorUnitario')) || 0;
    // price con IVA incluido, para mostrar consistente con la tienda
    const price = round2(valorUnitario * (1 + IVA_RATE));
    items.push({
      name: unescapeXml(get('Descripcion')),
      quantity: cantidad,
      price,
      subtotal: round2(price * cantidad),
    });
  }

  return { total, items };
};

const unescapeXml = (value) =>
  String(value == null ? '' : value)
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');

module.exports = {
  buildCfdiXml,
  parseCfdiXml,
  EMISOR,
  RECEPTOR,
};
