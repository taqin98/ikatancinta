/**
 * Payment Methods API
 *
 * Fetches available payment methods from the backend Express API.
 * Uses VITE_PAYMENT_METHODS_API_URL (e.g. https://example.com/api/payment-methods).
 * Falls back to hardcoded defaults when the URL is not set or the API fails.
 */

const DEFAULT_PAYMENT_METHODS = [
  { methodId: "default_bca", type: "bank_transfer", label: "BCA", accountNumber: "7480584506", accountName: "Moh Taqin", description: "", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Bank_Central_Asia.svg/200px-Bank_Central_Asia.svg.png", urlContent: "", sortOrder: 1 },
  { methodId: "default_bri", type: "bank_transfer", label: "BRI", accountNumber: "330201015780507", accountName: "Moh Taqin", description: "", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/BANK_BRI_logo.svg/200px-BANK_BRI_logo.svg.png", urlContent: "", sortOrder: 2 },
  { methodId: "default_shopeepay", type: "e_wallet", label: "ShopeePay", accountNumber: "", accountName: "", description: "Hubungi admin via WhatsApp untuk pembayaran e-wallet.", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Shopee.svg/120px-Shopee.svg.png", urlContent: "", sortOrder: 3 },
  { methodId: "default_qris", type: "e_wallet", label: "QRIS", accountNumber: "", accountName: "", description: "Scan QR code berikut untuk pembayaran.", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Logo_QRIS.svg/200px-Logo_QRIS.svg.png", urlContent: "", sortOrder: 4 },
  { methodId: "default_dana", type: "e_wallet", label: "DANA", accountNumber: "", accountName: "", description: "Hubungi admin via WhatsApp untuk pembayaran e-wallet.", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Dana_logo.svg/200px-Dana_logo.svg.png", urlContent: "", sortOrder: 5 },
];

function getPaymentMethodsApiUrl() {
  return import.meta.env.VITE_PAYMENT_METHODS_API_URL || "";
}

/**
 * Fetch enabled payment methods from the backend REST API.
 * GET /api/payment-methods
 * Returns DEFAULT_PAYMENT_METHODS when the API URL is not configured or on failure.
 */
export async function fetchPaymentMethods() {
  const apiUrl = getPaymentMethodsApiUrl();

  if (!apiUrl) {
    return DEFAULT_PAYMENT_METHODS;
  }

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      console.warn("PAYMENT_METHODS_FETCH_FAILED", response.status);
      return DEFAULT_PAYMENT_METHODS;
    }

    const json = await response.json();
    const methods = json?.data;

    if (!Array.isArray(methods) || methods.length === 0) {
      return DEFAULT_PAYMENT_METHODS;
    }

    return methods;
  } catch (error) {
    console.warn("PAYMENT_METHODS_FETCH_ERROR", error);
    return DEFAULT_PAYMENT_METHODS;
  }
}

export { DEFAULT_PAYMENT_METHODS };
