export const approvedProductionWhatsAppNumber = "573053744560";

export function normalizeWhatsAppNumber(value: string | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

export const whatsappNumber = normalizeWhatsAppNumber(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER);

export function buildProductInquiryMessage({
  productName,
  color,
  size,
  price,
  productUrl,
}: {
  productName: string;
  color: string;
  size: string;
  price: string;
  productUrl?: string;
}) {
  return [
    "Hola, estoy interesado/a en este producto de BeDifferent:",
    "",
    `Producto: ${productName}`,
    `Color: ${color}`,
    `Talla: ${size}`,
    `Precio: ${price}`,
    "",
    "Me gustaría recibir más información sobre disponibilidad y cómo realizar mi pedido.",
    ...(productUrl ? ["", `Enlace: ${productUrl}`] : []),
  ].join("\n");
}

export function getProductInquirySelectionError({
  hasVariants,
  hasSizes,
  color,
  size,
}: {
  hasVariants: boolean;
  hasSizes: boolean;
  color: string | null;
  size: string;
}) {
  if (hasVariants && !color) return "Selecciona un color antes de continuar por WhatsApp.";
  if (hasSizes && !size) return "Selecciona una talla antes de continuar por WhatsApp.";
  return "";
}

export function buildWhatsAppUrl(number: string, message = "") {
  const normalizedNumber = normalizeWhatsAppNumber(number);
  if (!/^\d{10,15}$/.test(normalizedNumber)) return "";
  return `https://wa.me/${normalizedNumber}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}
