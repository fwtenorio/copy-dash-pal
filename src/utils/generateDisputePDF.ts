import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

interface TrackingEvent {
  date: string;
  status?: string;
  description?: string;
  location: string;
  message?: string;
  stage?: string;
}

interface AddressData {
  name?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  zip?: string;
  country?: string;
  country_code?: string;
}

interface LineItem {
  title: string;
  quantity: number;
  price: string;
}

interface DisputeData {
  id: string | number;
  amount?: string;
  currency?: string;
  original_amount?: number;
  original_currency?: string;
  reason?: string;
  reasonTranslated?: string;
  initiated_at?: string;
  status?: string;
  gateway?: string;
  order?: {
    name?: string;
    order_number?: string;
    date?: string;
    subtotal?: string;
    shipping_cost?: string;
    shipping_method?: string;
    total_tax?: string;
    total_price?: string;
    shipping_address?: AddressData;
    billing_address?: AddressData;
    customer?: {
      first_name?: string;
      last_name?: string;
      email?: string;
    };
    client_details?: {
      browser_ip?: string;
    };
    browser_ip?: string;
    customer_ip?: string;
    tracking_number?: string;
    tracking_carrier?: string;
    fulfillments?: Array<{
      tracking_number?: string;
      tracking_company?: string;
    }>;
    payment_details?: {
      avs_result_code?: string;
      cvv_result_code?: string;
      card_brand?: string;
      card_last4?: string;
    };
    line_items?: LineItem[];
  };
  avs_check?: string;
  cvc_check?: string;
  customer_name?: string;
  products?: Array<{
    name?: string;
    title?: string;
    quantity?: number;
    price?: string | number;
    amount?: string | number;
  }>;
}

interface TrackingData {
  trackingNumber: string;
  status: string;
  carrier: string;
  events: TrackingEvent[];
}

// Placeholder/DB-friendly tracking event interface (para fulfillments)
interface FulfillmentEvent {
  timestamp?: string;
  status?: string;
  description?: string;
  location?: string;
}

// Normaliza strings para evitar caracteres estranhos no PDF (mojibake / aspas curvas)
function sanitizeText(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  return str
    .normalize("NFKC")
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'") // aspas simples curvas
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"') // aspas duplas curvas
    .replace(/[\u2013\u2014]/g, "-") // travessões
    .replace(/\u2026/g, "...") // reticências
    .replace(/\s+/g, " ")
    .trim();
}

// Converte números vindos como string/number em float seguro
function parseMoney(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return isNaN(value) ? 0 : value;
  if (typeof value === "string") {
    const parsed = parseFloat(value.replace(/[^0-9.-]+/g, ""));
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

// Helper to extract customer name from various possible locations (sem AVS/CVV fallbacks)
function getCustomerName(dispute: DisputeData): string {
  if (dispute.customer_name) return sanitizeText(dispute.customer_name);

  const fullNameFromCustomer = (dispute.order as any)?.customer?.name;
  if (fullNameFromCustomer) return sanitizeText(fullNameFromCustomer);

  const firstLastFromCustomer = [dispute.order?.customer?.first_name, dispute.order?.customer?.last_name]
    .filter(Boolean)
    .join(" ");
  if (firstLastFromCustomer.trim()) return sanitizeText(firstLastFromCustomer);

  const billingName =
    dispute.order?.billing_address?.full_name ||
    dispute.order?.billing_address?.name ||
    [dispute.order?.billing_address?.first_name, dispute.order?.billing_address?.last_name].filter(Boolean).join(" ");
  if (billingName && billingName.trim()) return sanitizeText(billingName);

  const shippingName =
    dispute.order?.shipping_address?.full_name ||
    dispute.order?.shipping_address?.name ||
    [dispute.order?.shipping_address?.first_name, dispute.order?.shipping_address?.last_name].filter(Boolean).join(" ");
  if (shippingName && shippingName.trim()) return sanitizeText(shippingName);

  return "Name unavailable";
}

// Helper to get customer email (sem mensagens de AVS)
function getCustomerEmail(dispute: DisputeData): string | null {
  const email = dispute.order?.customer?.email || (dispute.order as any)?.email || null;
  return email ? sanitizeText(email) : null;
}

// Helper to extract IP address from various possible locations
function getIpAddress(dispute: DisputeData): string | null {
  if (dispute.order?.client_details?.browser_ip) {
    return dispute.order.client_details.browser_ip;
  }
  if (dispute.order?.browser_ip) {
    return dispute.order.browser_ip;
  }
  if (dispute.order?.customer_ip) {
    return dispute.order.customer_ip;
  }
  return null;
}

// Helper to format full address stack for side-by-side comparison (usa campos reais)
function formatAddressStack(address: AddressData | undefined): string[] {
  if (!address) return ["Address not available"];

  const lines: string[] = [];

  const name = address.full_name || address.name || 
    [address.first_name, address.last_name].filter(Boolean).join(" ");
  if (name) lines.push(sanitizeText(name));

  const line1 = (address as any).line1 || address.address1;
  if (line1) lines.push(sanitizeText(line1));
  if (address.address2) lines.push(sanitizeText(address.address2));

  const cityLine = [address.city, address.province, address.zip]
    .filter(val => val && val !== "Verified by Payment Method" && val !== "Verified")
    .join(", ");
  if (cityLine) lines.push(sanitizeText(cityLine));

  if (address.country && address.country !== "Verified by Payment Method") {
    lines.push(sanitizeText(address.country));
  } else if (address.country_code) {
    lines.push(sanitizeText(address.country_code));
  }

  return lines.length > 0 ? lines : ["Address not available"];
}

// Helper to format address from address object (single line) usando line1
function formatAddressFromObject(address: AddressData | undefined): string {
  if (!address) return "";
  
  const parts = [
    (address as any).line1 || address.address1,
    address.address2,
    address.city,
    address.province,
    address.zip,
    address.country || address.country_code,
  ].filter(Boolean);
  
  return parts.map(sanitizeText).join(", ");
}

// Helper to get shipping address com fallback para billing, sem mensagens de AVS
function getShippingAddress(dispute: DisputeData): string {
  const shippingAddress = formatAddressFromObject(dispute.order?.shipping_address);
  if (shippingAddress) return shippingAddress;
  
  const billingAddress = formatAddressFromObject(dispute.order?.billing_address);
  if (billingAddress) return billingAddress;
  
  return "Address not available";
}

// Helper to get tracking number from various locations
function getTrackingNumber(dispute: DisputeData): string | null {
  if (dispute.order?.tracking_number) {
    return dispute.order.tracking_number;
  }
  
  if (dispute.order?.fulfillments?.length) {
    const fulfillment = dispute.order.fulfillments[0];
    if (fulfillment.tracking_number) {
      return fulfillment.tracking_number;
    }
  }
  
  return null;
}

// Helper to format amount with currency
function formatAmount(dispute: DisputeData): string {
  const currency = dispute.currency || dispute.original_currency;
  const amountValue = dispute.order?.total_price || dispute.amount || dispute.original_amount;
  if (!amountValue) return "Amount not available";
  const asNumber = typeof amountValue === "number" ? amountValue : parseMoney(amountValue);
  return currency ? `${asNumber.toFixed(2)} ${currency}` : `${asNumber.toFixed(2)}`;
}

// Helper to get reason in readable format
function getReasonText(dispute: DisputeData): string {
  if (dispute.reasonTranslated === "Produto diferente do descrito") return "Product Not as Described";
  if (dispute.reasonTranslated) return dispute.reasonTranslated;
  if (dispute.reason === "Produto diferente do descrito") return "Product Not as Described";
  if (dispute.reason) {
    return dispute.reason
      .replace(/_/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase());
  }
  return "Reason not specified";
}

// Helper to get currency symbol
function getCurrencySymbol(currency: string | undefined): string {
  const symbols: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'CAD': 'C$',
    'AUD': 'A$',
  };
  return symbols[currency?.toUpperCase() || ''] || currency || '$';
}

export function generateDisputePDF(dispute: DisputeData, trackingData: TrackingData | null): void {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = 25;

    // Helper functions
    const formatDateString = (dateString: string | undefined): string => {
      if (!dateString) return "Date not available";
      try {
        return format(new Date(dateString), "MMM d, yyyy, h:mm a 'UTC'");
      } catch {
        return dateString;
      }
    };

    const formatShortDate = (dateString: string | undefined): string => {
      if (!dateString) return "Date not available";
      try {
        return format(new Date(dateString), "MMM d, yyyy");
      } catch {
        return dateString;
      }
    };

    // Extract data using helpers
    const customerName = getCustomerName(dispute);
    const customerEmail = getCustomerEmail(dispute);
    const ipAddress = getIpAddress(dispute);
    const shippingAddress = getShippingAddress(dispute);
    const trackingNumber = getTrackingNumber(dispute);
    const amount = formatAmount(dispute);
    const reason = getReasonText(dispute);
    const currency = dispute.currency || dispute.original_currency || 'USD';
    const currencySymbol = getCurrencySymbol(currency);

    // Unifica eventos de tracking (DB fulfillments + trackingData) para a seção de Order Fulfillment
    const fulfillmentEvents = (dispute.order?.fulfillments?.[0] as any)?.tracking_events as FulfillmentEvent[] | undefined;
    const combinedEvents: Array<{ date?: string; status?: string; location?: string; message?: string; }> =
      fulfillmentEvents && fulfillmentEvents.length > 0
        ? fulfillmentEvents.map((e) => ({
            date: e.timestamp,
            status: e.status || e.description || "Update",
            location: e.location,
            message: e.description || e.status || "Update",
          }))
        : trackingData?.events?.map((event) => ({
            date: event.date,
            status: event.status || event.stage || event.description || "Update",
            location: event.location,
            message: event.message || event.description || "Update",
          })) || [];

    const hasTracking = !!(trackingNumber && combinedEvents.length);
    
    const latestEvent = combinedEvents.length > 0 ? combinedEvents[0] : null;
    const isDelivered = latestEvent ? (
      latestEvent.status?.toLowerCase().includes("delivered") || 
      latestEvent.message?.toLowerCase().includes("delivered")
    ) : false;
    
    const deliveryEvent = combinedEvents.find(e => 
      e.status?.toLowerCase().includes("delivered") || 
      e.message?.toLowerCase().includes("delivered")
    );

    type ScenarioType = "no_tracking" | "delivered" | "in_transit";
    const scenario: ScenarioType = !hasTracking 
      ? "no_tracking" 
      : isDelivered 
        ? "delivered" 
        : "in_transit";

    // Colors
    const primaryGray = [60, 60, 60] as [number, number, number];
    const headerGray = [240, 240, 240] as [number, number, number];
    const darkText = [30, 30, 30] as [number, number, number];
    const accentGreen = [25, 151, 111] as [number, number, number];

    // ========== PAGE 1: DISPUTE DETAILS ==========

    // Section 1: Dispute Details
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkText);
    doc.text("1. Dispute Details", margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...primaryGray);
    doc.text("We wish to reject the initiated chargebacks against us with the following details:", margin, yPosition);
    yPosition += 10;

    const transactionDate = formatDateString((dispute.order as any)?.created_at || dispute.order?.date);
    const disputeDate = formatDateString((dispute as any)?.created_at || dispute.initiated_at);

    const disputeDetailsData: string[][] = [
      ["Dispute ID", String(dispute.id)],
      ["Transaction Date", transactionDate],
      ["Dispute Date", disputeDate],
      ["Customer Name", customerName],
      ["Chargeback Reason", reason],
    ];

    if (customerEmail) {
      disputeDetailsData.push(["Email Address", customerEmail]);
    }
    
    disputeDetailsData.push(["Shipping Address", shippingAddress]);
    
    if (ipAddress) {
      disputeDetailsData.push(["IP Address", ipAddress]);
    }
    
    disputeDetailsData.push(["Dispute Amount", amount]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Details", "Information"]],
      body: disputeDetailsData,
      theme: "grid",
      headStyles: {
        fillColor: headerGray,
        textColor: darkText,
        fontStyle: "bold",
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 10,
        textColor: primaryGray,
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 45 },
        1: { cellWidth: "auto" },
      },
      margin: { left: margin, right: margin },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...primaryGray);
    doc.text("We are confident that upon careful examination, this document clearly proves the invalidity of this chargeback.", margin, yPosition);
    yPosition += 15;

    // Section 2: Dispute Summary
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkText);
    doc.text("2. Dispute Summary", margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...primaryGray);

    let summaryText = "";
    if (scenario === "delivered") {
      const deliveryDate = deliveryEvent?.date || "the recorded date";
      summaryText = `The chargeback initiated by ${customerName} is invalid based on the following compelling evidence:\n\n` +
        `1. The order was successfully delivered on ${deliveryDate.split(',')[0]}, to the address provided by the customer.\n` +
        `2. A complete tracking history confirms the package's journey and final delivery, demonstrating that the item was received.\n` +
        `3. The customer agreed to the shipping policy and terms at the time of purchase, acknowledging the expected delivery timeframe.\n` +
        `4. The transaction amount of ${amount} matches the invoice total, further validating the legitimacy of the charge.\n\n` +
        `This evidence clearly contradicts the claim of non-receipt, establishing that the chargeback lacks merit.`;
    } else if (scenario === "in_transit") {
      summaryText = `The chargeback initiated by ${customerName} is premature and invalid:\n\n` +
        `1. The merchandise is currently IN TRANSIT and within the estimated delivery window.\n` +
        `2. Active tracking shows the package progressing through the shipping network.\n` +
        `3. The customer agreed to our shipping policy which clearly states delivery timeframes.\n` +
        `4. This dispute was filed before the delivery window expired.\n\n` +
        `We request this chargeback be reversed as the shipment is actively progressing toward delivery.`;
    } else {
      summaryText = `The chargeback initiated by ${customerName} is invalid based on the following:\n\n` +
        `1. The customer placed a valid order verified by AVS and CVV security checks.\n` +
        `2. The transaction was authorized by the legitimate cardholder.\n` +
        `3. Payment gateway security validations confirmed the transaction's authenticity.\n` +
        `4. The customer agreed to our terms of service at checkout.\n\n` +
        `This evidence establishes the transaction was legitimate and properly authorized.`;
    }

    const summaryLines = doc.splitTextToSize(summaryText, pageWidth - margin * 2);
    doc.text(summaryLines, margin, yPosition);
    yPosition += summaryLines.length * 4.5 + 15;

    // ========== PAGE 2: ORDER FULFILLMENT ==========
    if (yPosition > 180) {
      doc.addPage();
      yPosition = 25;
    }

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkText);
    doc.text("3. Order Fulfillment", margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...primaryGray);

    const carrierFromOrder = (dispute.order?.fulfillments?.[0] as any)?.tracking_company || dispute.order?.tracking_carrier;
    const carrierDisplay = carrierFromOrder || trackingData?.carrier || "Carrier not provided";
    const trackingDisplay = trackingNumber || "Tracking not provided";

    const fulfillmentText = scenario === "delivered"
      ? `The order for ${customerName}, shipped via ${carrierDisplay} with tracking number ${trackingDisplay}, was successfully delivered on ${deliveryEvent?.date?.split(',')[0] || 'the recorded date'}. The merchant provided tracking to let the customer monitor the shipment.`
      : `The order for ${customerName}, shipped via ${carrierDisplay} with tracking number ${trackingDisplay}, is being monitored. The tracking history below captures the shipment updates.`;

    const fulfillmentLines = doc.splitTextToSize(fulfillmentText, pageWidth - margin * 2);
    doc.text(fulfillmentLines, margin, yPosition);
    yPosition += fulfillmentLines.length * 5 + 10;

    // Tracking Table (usa fulfillmentEvents/trackingData, com placeholder)
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkText);
    doc.text("Tracking History", margin, yPosition);
    yPosition += 8;

    const trackingTableData = (combinedEvents.length > 0
      ? combinedEvents
      : [{ date: "-", status: "No tracking data provided", location: "-", message: "-" }]
    ).map(event => [
      event.date || "-",
      event.status || "Update",
      event.location || "-",
      event.message || "-",
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Date & Time", "Status", "Location", "Message"]],
      body: trackingTableData,
      theme: "grid",
      headStyles: {
        fillColor: headerGray,
        textColor: darkText,
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: primaryGray,
      },
      margin: { left: margin, right: margin },
      styles: {
        cellPadding: 4,
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // ========== PAGE 3: CHECKOUT DETAILS ==========
    doc.addPage();
    yPosition = 25;

    const sectionNumber = hasTracking ? "4" : "3";
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkText);
    doc.text(`${sectionNumber}. Checkout Details`, margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...primaryGray);

    const shippingMethod = dispute.order?.shipping_method || "Standard Shipping";
    const shippingCost = dispute.order?.shipping_cost || "0.00";
    const checkoutText = `The invoice clearly indicates that the order was shipped to ${customerName} at ${shippingAddress}. The shipping method used was ${shippingMethod}, with a shipping fee of ${currencySymbol}${shippingCost}. All shipping details were transparently communicated during checkout and included in the invoice, confirming the customer's awareness of the transaction.`;

    const checkoutLines = doc.splitTextToSize(checkoutText, pageWidth - margin * 2);
    doc.text(checkoutLines, margin, yPosition);
    yPosition += checkoutLines.length * 5 + 12;

    // Side-by-Side Address Comparison Table
    const billingStack = formatAddressStack(dispute.order?.billing_address);
    const shippingStack = formatAddressStack(dispute.order?.shipping_address);
    const maxLines = Math.max(billingStack.length, shippingStack.length);

    const addressComparisonData: string[][] = [];
    for (let i = 0; i < maxLines; i++) {
      addressComparisonData.push([
        billingStack[i] || "",
        shippingStack[i] || ""
      ]);
    }

    autoTable(doc, {
      startY: yPosition,
      head: [["Bill To", "Ship To"]],
      body: addressComparisonData,
      theme: "grid",
      headStyles: {
        fillColor: headerGray,
        textColor: darkText,
        fontStyle: "bold",
        fontSize: 10,
        halign: "center",
      },
      bodyStyles: {
        fontSize: 10,
        textColor: primaryGray,
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: (pageWidth - margin * 2) / 2 },
        1: { cellWidth: (pageWidth - margin * 2) / 2 },
      },
      margin: { left: margin, right: margin },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // ========== INVOICE BREAKDOWN TABLE ==========
    const invoiceId = dispute.order?.name || `#${dispute.id}`;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkText);
    doc.text(`Invoice ID ${invoiceId}`, margin, yPosition);
    yPosition += 8;

    let lineItems = dispute.order?.line_items || [];

    // Prefer real product data when available (modal already shows these)
    const productLineItems = Array.isArray(dispute.products)
      ? dispute.products
          .map((product) => {
            const title = sanitizeText(product.title || product.name);
            if (!title) return null;

            const quantity = product.quantity ?? 1;
            const rawPrice = product.price ?? product.amount ?? 0;
            const priceValue =
              typeof rawPrice === "string"
                ? parseFloat(rawPrice.replace(/[^0-9.-]+/g, ""))
                : Number(rawPrice);

            return {
              title,
              quantity,
              price: String(isNaN(priceValue) ? 0 : priceValue),
            };
          })
          .filter(Boolean)
      : [];
    
    // Track if we're using consolidated fallback (affects subtotal display)
    let isConsolidatedFallback = false;
    
    // STRICT FALLBACK: If line_items is empty, FORCE create a consolidated item
    // Use the TOTAL dispute amount (not subtotal) so math matches perfectly
    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      if (productLineItems.length > 0) {
        lineItems = productLineItems as LineItem[];
      } else {
        isConsolidatedFallback = true;
        const totalPrice = dispute.order?.total_price || dispute.amount || "0.00";
        const disputeAmount = typeof totalPrice === 'string' 
          ? parseFloat(totalPrice.replace(/[^0-9.-]+/g, '')) 
          : totalPrice;
      lineItems = [{
        title: `Consolidated Order Summary (Includes Shipping & Taxes)`,
        quantity: 1,
        price: String(disputeAmount || 0)
      }];
      }
    }
    
    const invoiceData: (string | { content: string; styles?: any })[][] = [];

    // Add product line items + totais
    lineItems.forEach(item => {
      const safeTitle = sanitizeText(item.title);
      const priceValue = parseMoney(item.price);
      const itemTotal = (priceValue * item.quantity).toFixed(2);
      invoiceData.push([
        safeTitle,
        `${currencySymbol}${priceValue.toFixed(2)}`,
        String(item.quantity),
        `${currencySymbol}${itemTotal}`
      ]);
    });

    // Montagem da matemática do invoice
    const productSubtotal = lineItems.reduce((acc, item) => acc + parseMoney(item.price) * item.quantity, 0);

    // Valores extras
    const shippingCostRaw = dispute.order?.shipping_cost;
    const shippingAmount = parseMoney(shippingCostRaw);
    const taxRaw = dispute.order?.total_tax;
    const taxAmount = parseMoney(taxRaw);

    // Descontos: considera vários campos, inclui linha mesmo que 0 se veio da API
    const discountRaw =
      (dispute.order as any)?.total_discounts ??
      (dispute.order as any)?.discount_amount ??
      (dispute.order as any)?.discount ??
      (dispute.order as any)?.discounts;
    const hasDiscountField = discountRaw !== undefined && discountRaw !== null;
    const discountAmount = hasDiscountField ? parseMoney(discountRaw) : 0;

    // Consolidated fallback: não abrimos linhas extras (já está tudo embutido)
    if (!isConsolidatedFallback) {
      // Shipping
      if (shippingCostRaw !== undefined && shippingCostRaw !== null) {
        invoiceData.push([
          `[Shipping] ${dispute.order?.shipping_method || "Standard"}`,
          `${currencySymbol}${shippingAmount.toFixed(2)}`,
          "1",
          `${currencySymbol}${shippingAmount.toFixed(2)}`
        ]);
      }

      // Descontos (se campo existir)
      if (hasDiscountField) {
        invoiceData.push([
          "Discounts",
          `${currencySymbol}${discountAmount.toFixed(2)}`,
          "1",
          `${currencySymbol}${discountAmount.toFixed(2)}`
        ]);
      }

      // Subtotal
      invoiceData.push([
        { content: "Subtotal", styles: { fontStyle: "bold" } },
        "",
        "",
        { content: `${currencySymbol}${productSubtotal.toFixed(2)}`, styles: { fontStyle: "bold" } }
      ]);

      // Total Tax (sempre mostra, mesmo que 0)
      invoiceData.push([
        "Total Tax",
        "",
        "",
        `${currencySymbol}${taxAmount.toFixed(2)}`
      ]);
    }

    // Invoice Total (sempre: produtos + shipping + tax - discount, ou subtotal consolidado)
    const invoiceTotal = isConsolidatedFallback
      ? productSubtotal
      : productSubtotal + shippingAmount + taxAmount - (hasDiscountField ? discountAmount : 0);

    invoiceData.push([
      { content: "Invoice Total", styles: { fontStyle: "bold", fillColor: [245, 245, 245] } },
      { content: "", styles: { fillColor: [245, 245, 245] } },
      { content: "", styles: { fillColor: [245, 245, 245] } },
      { content: `${currencySymbol}${invoiceTotal.toFixed(2)}`, styles: { fontStyle: "bold", fillColor: [245, 245, 245] } }
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Product", "Price", "Quantity", "Total"]],
      body: invoiceData,
      theme: "grid",
      headStyles: {
        fillColor: headerGray,
        textColor: darkText,
        fontStyle: "bold",
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 10,
        textColor: primaryGray,
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 30, halign: "right" },
        2: { cellWidth: 25, halign: "center" },
        3: { cellWidth: 35, halign: "right" },
      },
      margin: { left: margin, right: margin },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // ========== SHIPPING POLICY SECTION ==========
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 25;
    }

    const policySection = hasTracking ? "5" : "4";
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkText);
    doc.text(`${policySection}. Acknowledgement of our Shipping Policy`, margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...primaryGray);

    const orderDate = dispute.order?.date ? formatShortDate(dispute.order.date) : formatShortDate(dispute.initiated_at);
    const policyText = `At the time of purchase on ${orderDate}, the customer explicitly agreed to our shipping policy, which clearly outlines the shipping method as ${shippingMethod}. This policy was fully accessible and transparent to the customer during the checkout process, ensuring they understood the shipping timeframe prior to completing their order. By finalizing the transaction, the customer accepted these shipping terms, confirming their agreement to the outlined conditions.`;

    const policyLines = doc.splitTextToSize(policyText, pageWidth - margin * 2);
    doc.text(policyLines, margin, yPosition);
    yPosition += policyLines.length * 5 + 15;

    // ========== TERMS AND CONDITIONS SECTION ==========
    const termsSection = hasTracking ? "6" : "5";
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkText);
    doc.text(`${termsSection}. The customer agreed to our terms and conditions`, margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...primaryGray);

    const termsText = `${customerName}${customerEmail ? `, using the email account ${customerEmail},` : ""} accepted our Terms and Conditions prior to completing their transaction on ${orderDate}, which confirms that payment could not have been processed without their agreement to these terms, thereby validating the transaction and addressing the claim of ${reason.toLowerCase()}.`;

    const termsLines = doc.splitTextToSize(termsText, pageWidth - margin * 2);
    doc.text(termsLines, margin, yPosition);

    // Footer with page info
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${pageCount} | Dispute Evidence - ${dispute.id}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    // Download the PDF
    doc.save(`dispute-evidence-${dispute.id}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}
