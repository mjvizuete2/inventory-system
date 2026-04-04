import crypto from "crypto";
import { DOMParser } from "@xmldom/xmldom";
import { create } from "xmlbuilder2";
import { SignedXml } from "xml-crypto";
import soap from "soap";
import { AppDataSource } from "../config/data-source";
import { env } from "../config/env";
import { Client } from "../entities/Client";
import { Product } from "../entities/Product";
import { SRIInvoice } from "../entities/SRIInvoice";
import { Sale } from "../entities/Sale";
import { HttpError } from "../utils/http-error";
import { money } from "../utils/math";
import { toSRIFormatDate } from "../utils/date";
import { DocumentSequenceService } from "./document-sequence.service";

type SRIResponseState = {
  receiptStatus: string;
  receiptMessage: string | null;
  authorizationStatus: string;
  authorizationNumber: string | null;
  authorizationDate: Date | null;
  rawResponse: string | null;
};

export class SRIService {
  private readonly invoiceRepository = AppDataSource.getRepository(SRIInvoice);
  private readonly sequenceService = new DocumentSequenceService();

  private mod11(input: string): number {
    const factors = [2, 3, 4, 5, 6, 7];
    let factorIndex = 0;
    let total = 0;

    for (let index = input.length - 1; index >= 0; index -= 1) {
      total += Number(input[index]) * factors[factorIndex];
      factorIndex = (factorIndex + 1) % factors.length;
    }

    const remainder = total % 11;
    const verifier = 11 - remainder;

    if (verifier === 11) {
      return 0;
    }
    if (verifier === 10) {
      return 1;
    }

    return verifier;
  }

  private generateAccessKey(
    date: Date,
    sequential: string,
    establishmentCode: string,
    emissionPointCode: string
  ): string {
    const datePart = `${String(date.getDate()).padStart(2, "0")}${String(date.getMonth() + 1).padStart(2, "0")}${date.getFullYear()}`;
    const numericCode = crypto.randomInt(10000000, 99999999).toString();
    const base = [
      datePart,
      "01",
      env.sri.ruc,
      env.sri.environment,
      establishmentCode,
      emissionPointCode,
      sequential,
      numericCode,
      env.sri.emissionType
    ].join("");

    return `${base}${this.mod11(base)}`;
  }

  private mapPaymentMethod(method: string): string {
    const map: Record<string, string> = {
      CASH: "01",
      CARD: "19",
      CREDIT_CARD: "19",
      DEBIT_CARD: "16",
      TRANSFER: "20",
      MOBILE: "21"
    };

    return map[method.toUpperCase()] ?? "01";
  }

  private buildInvoiceXml(
    sale: Sale,
    sequential: string,
    accessKey: string,
    establishmentCode: string,
    emissionPointCode: string
  ): string {
    const client = sale.client as Client | null;

    const root = create({ version: "1.0", encoding: "UTF-8" })
      .ele("factura", { id: "comprobante", version: "1.1.0" });

    const infoTributaria = root.ele("infoTributaria");
    infoTributaria.ele("ambiente").txt(env.sri.environment);
    infoTributaria.ele("tipoEmision").txt(env.sri.emissionType);
    infoTributaria.ele("razonSocial").txt(env.sri.businessName);
    infoTributaria.ele("nombreComercial").txt(env.sri.commercialName);
    infoTributaria.ele("ruc").txt(env.sri.ruc);
    infoTributaria.ele("claveAcceso").txt(accessKey);
    infoTributaria.ele("codDoc").txt("01");
    infoTributaria.ele("estab").txt(establishmentCode);
    infoTributaria.ele("ptoEmi").txt(emissionPointCode);
    infoTributaria.ele("secuencial").txt(sequential);
    infoTributaria.ele("dirMatriz").txt(env.sri.headquartersAddress);

    const infoFactura = root.ele("infoFactura");
    infoFactura.ele("fechaEmision").txt(toSRIFormatDate(sale.soldAt));
    infoFactura.ele("dirEstablecimiento").txt(env.sri.establishmentAddress);
    infoFactura.ele("obligadoContabilidad").txt("NO");
    infoFactura
      .ele("tipoIdentificacionComprador")
      .txt(client?.documentType === "RUC" ? "04" : client?.documentType === "CEDULA" ? "05" : "07");
    infoFactura.ele("razonSocialComprador").txt(client?.name ?? "CONSUMIDOR FINAL");
    infoFactura.ele("identificacionComprador").txt(client?.identification ?? "9999999999999");
    infoFactura.ele("totalSinImpuestos").txt(sale.subtotal);
    infoFactura.ele("totalDescuento").txt("0.00");

    const totalConImpuestos = infoFactura.ele("totalConImpuestos");
    const totalImpuesto = totalConImpuestos.ele("totalImpuesto");
    totalImpuesto.ele("codigo").txt("2");
    totalImpuesto.ele("codigoPorcentaje").txt("2");
    totalImpuesto.ele("baseImponible").txt(sale.subtotal);
    totalImpuesto.ele("valor").txt(sale.ivaAmount);

    infoFactura.ele("propina").txt("0.00");
    infoFactura.ele("importeTotal").txt(sale.total);
    infoFactura.ele("moneda").txt("DOLAR");

    const pagos = infoFactura.ele("pagos");
    for (const payment of sale.payments) {
      const pago = pagos.ele("pago");
      pago.ele("formaPago").txt(this.mapPaymentMethod(payment.paymentMethod));
      pago.ele("total").txt(payment.amount);
    }

    const detalles = root.ele("detalles");
    for (const item of sale.items) {
      const product = item.product as Product;
      const detalle = detalles.ele("detalle");
      detalle.ele("codigoPrincipal").txt(product.sku);
      detalle.ele("descripcion").txt(product.name);
      detalle.ele("cantidad").txt(String(item.quantity));
      detalle.ele("precioUnitario").txt(item.unitPrice);
      detalle.ele("descuento").txt("0.00");
      detalle.ele("precioTotalSinImpuesto").txt(item.subtotal);

      const impuesto = detalle.ele("impuestos").ele("impuesto");
      impuesto.ele("codigo").txt("2");
      impuesto.ele("codigoPorcentaje").txt(Number(product.ivaRate) > 0 ? "2" : "0");
      impuesto.ele("tarifa").txt(money(Number(product.ivaRate)));
      impuesto.ele("baseImponible").txt(item.subtotal);
      impuesto.ele("valor").txt(item.ivaAmount);
    }

    return root.end({ prettyPrint: false });
  }

  private signXml(xml: string): string {
    if (!env.sri.certificatePemBase64 || !env.sri.privateKeyPemBase64) {
      return xml;
    }

    const certificate = Buffer.from(env.sri.certificatePemBase64, "base64").toString("utf-8");
    const privateKey = Buffer.from(env.sri.privateKeyPemBase64, "base64").toString("utf-8");

    const signature = new SignedXml();
    signature.privateKey = privateKey;
    signature.publicCert = certificate;
    signature.canonicalizationAlgorithm = "http://www.w3.org/TR/2001/REC-xml-c14n-20010315";
    signature.signatureAlgorithm = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256";
    signature.addReference({
      xpath: "/*",
      transforms: [
        "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
        "http://www.w3.org/TR/2001/REC-xml-c14n-20010315"
      ],
      digestAlgorithm: "http://www.w3.org/2001/04/xmlenc#sha256"
    });
    signature.computeSignature(xml, {
      location: {
        reference: "/*",
        action: "append"
      }
    });

    new DOMParser().parseFromString(signature.getSignedXml(), "text/xml");
    return signature.getSignedXml();
  }

  private async sendToSRI(accessKey: string, signedXml: string): Promise<SRIResponseState> {
    if (!env.sri.receiptWsdl || !env.sri.authorizationWsdl) {
      return {
        receiptStatus: "PENDING",
        receiptMessage: "SRI endpoints not configured",
        authorizationStatus: "PENDING",
        authorizationNumber: null,
        authorizationDate: null,
        rawResponse: null
      };
    }

    try {
      const receiptClient = await soap.createClientAsync(env.sri.receiptWsdl);
      const [receiptResponse] = await receiptClient.validarComprobanteAsync({
        xml: Buffer.from(signedXml, "utf-8").toString("base64")
      });

      const receiptStatus = receiptResponse?.RespuestaRecepcionComprobante?.estado ?? "UNKNOWN";
      const receiptMessage = JSON.stringify(receiptResponse?.RespuestaRecepcionComprobante?.comprobantes ?? null);

      if (receiptStatus !== "RECIBIDA") {
        return {
          receiptStatus,
          receiptMessage,
          authorizationStatus: "REJECTED",
          authorizationNumber: null,
          authorizationDate: null,
          rawResponse: JSON.stringify(receiptResponse)
        };
      }

      const authClient = await soap.createClientAsync(env.sri.authorizationWsdl);
      const [authResponse] = await authClient.autorizacionComprobanteAsync({
        claveAccesoComprobante: accessKey
      });

      const authorization =
        authResponse?.RespuestaAutorizacionComprobante?.autorizaciones?.autorizacion?.[0] ??
        authResponse?.RespuestaAutorizacionComprobante?.autorizaciones?.autorizacion;

      return {
        receiptStatus,
        receiptMessage,
        authorizationStatus: authorization?.estado ?? "PENDING",
        authorizationNumber: authorization?.numeroAutorizacion ?? null,
        authorizationDate: authorization?.fechaAutorizacion
          ? new Date(authorization.fechaAutorizacion)
          : null,
        rawResponse: JSON.stringify({ receiptResponse, authResponse })
      };
    } catch (error) {
      return {
        receiptStatus: "ERROR",
        receiptMessage: error instanceof Error ? error.message : "SRI communication error",
        authorizationStatus: "ERROR",
        authorizationNumber: null,
        authorizationDate: null,
        rawResponse: error instanceof Error ? error.stack ?? error.message : JSON.stringify(error)
      };
    }
  }

  async generateAndSendInvoice(
    sale: Sale,
    establishmentCode?: string,
    emissionPointCode?: string
  ): Promise<SRIInvoice> {
    const existing = await this.invoiceRepository.findOne({
      where: { saleId: sale.id }
    });
    if (existing) {
      return existing;
    }

    const estab = establishmentCode ?? env.sri.establishmentCode;
    const emission = emissionPointCode ?? env.sri.emissionPoint;
    const sequential = await this.sequenceService.next("01", estab, emission);
    const accessKey = this.generateAccessKey(sale.soldAt, sequential, estab, emission);
    const xmlUnsigned = this.buildInvoiceXml(sale, sequential, accessKey, estab, emission);
    const xmlSigned = this.signXml(xmlUnsigned);
    const state = await this.sendToSRI(accessKey, xmlSigned);

    const invoice = this.invoiceRepository.create();
    invoice.sale = sale;
    invoice.saleId = sale.id;
    invoice.documentCode = "01";
    invoice.environment = env.sri.environment;
    invoice.emissionType = env.sri.emissionType;
    invoice.establishmentCode = estab;
    invoice.emissionPointCode = emission;
    invoice.sequential = sequential;
    invoice.accessKey = accessKey;
    invoice.xmlUnsigned = xmlUnsigned;
    invoice.xmlSigned = xmlSigned;
    invoice.receiptStatus = state.receiptStatus;
    invoice.receiptMessage = (state.receiptMessage ?? null) as unknown as string;
    invoice.authorizationStatus = state.authorizationStatus;
    invoice.authorizationNumber = (state.authorizationNumber ?? null) as unknown as string;
    invoice.authorizationDate = (state.authorizationDate ?? null) as unknown as Date;
    invoice.rawResponse = (state.rawResponse ?? null) as unknown as string;

    return this.invoiceRepository.save(invoice);
  }

  async list(): Promise<SRIInvoice[]> {
    return this.invoiceRepository.find({
      relations: { sale: true },
      order: { id: "DESC" }
    });
  }

  async getById(id: number): Promise<SRIInvoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: { sale: true }
    });

    if (!invoice) {
      throw new HttpError(404, "Invoice not found");
    }

    return invoice;
  }
}
