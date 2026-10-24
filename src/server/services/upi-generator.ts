import QRCode from "qrcode";

export interface UpiQrParams {
  vpa: string; // Virtual Payment Address e.g. merchant@okaxis
  payeeName: string; // Business name
  amount: number; // Exact bill amount
  invoiceNumber: string; // Transaction reference
  notes?: string;
}

/**
 * Generates an NPCI-compliant UPI payment URL and converts it into a Base64 QR Code data URI.
 * Example format:
 * upi://pay?pa=merchant@upi&pn=Business+Name&am=1250.00&tr=INV-101&cu=INR&tn=Invoice+INV-101
 */
export async function generateDynamicUpiQr({
  vpa,
  payeeName,
  amount,
  invoiceNumber,
  notes = `Bill ${invoiceNumber}`,
}: UpiQrParams): Promise<{ upiUrl: string; qrDataUrl: string }> {
  const cleanVpa = encodeURIComponent(vpa);
  const cleanName = encodeURIComponent(payeeName.replace(/[^a-zA-Z0-9 ]/g, ""));
  const cleanAmount = amount.toFixed(2);
  const cleanRef = encodeURIComponent(invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, ""));
  const cleanNotes = encodeURIComponent(notes);

  const upiUrl = `upi://pay?pa=${cleanVpa}&pn=${cleanName}&am=${cleanAmount}&tr=${cleanRef}&cu=INR&tn=${cleanNotes}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(upiUrl, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 256,
      color: {
        dark: "#1e293b",
        light: "#ffffff",
      },
    });

    return { upiUrl, qrDataUrl };
  } catch (error) {
    console.error("Error generating UPI QR Code:", error);
    return { upiUrl, qrDataUrl: "" };
  }
}
