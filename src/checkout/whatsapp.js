import { shopConfig } from "../config.js";
import { formatPrice } from "../catalog.js";

export function createWhatsAppMessage(items) {
  const lines = items.map(({ product, quantity }) => {
    return `• ${product.name} × ${quantity} — ${formatPrice(product.price * quantity)}`;
  });
  const total = items.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0);

  return [
    `Hello ${shopConfig.name}! I'd like to enquire about these artworks:`,
    "",
    ...lines,
    "",
    `Subtotal: ${formatPrice(total)}`,
    "",
    "Please let me know about availability and shipping. Thank you!",
  ].join("\n");
}

export function startWhatsAppCheckout(items) {
  if (!shopConfig.whatsappNumber) {
    return {
      ok: false,
      message: "WhatsApp checkout is not ready yet. The shop owner still needs to add their WhatsApp Business number.",
    };
  }

  const message = createWhatsAppMessage(items);
  const url = `https://wa.me/${shopConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
  window.location.assign(url);
  return { ok: true };
}
