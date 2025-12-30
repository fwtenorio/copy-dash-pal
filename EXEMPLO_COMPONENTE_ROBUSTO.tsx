/**
 * 🛡️ EXEMPLO: Componente Robusto que Lida com Edge Cases
 * 
 * Este componente demonstra as melhores práticas para lidar com dados
 * que podem estar ausentes, null ou vazios vindos da API da Shopify.
 */

import React from 'react';
import { mockDisputes } from '@/data/mockDisputesData';

interface DisputeCardProps {
  disputeIndex: number;
}

export const RobustDisputeCard: React.FC<DisputeCardProps> = ({ disputeIndex }) => {
  const dispute = mockDisputes[disputeIndex];
  
  if (!dispute) {
    return <div>Dispute não encontrado</div>;
  }

  const order = dispute.order;
  const customer = order.customer;

  // ============================================================
  // 1. NOME DO CLIENTE - Lidar com first_name e last_name vazios
  // ============================================================
  const getCustomerName = () => {
    const firstName = customer.first_name?.trim() || "";
    const lastName = customer.last_name?.trim() || "";
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else if (customer.email && customer.email.trim() !== "") {
      return customer.email;
    } else {
      return "Cliente Anônimo";
    }
  };

  // ============================================================
  // 2. EMAIL - Lidar com email vazio ou ausente
  // ============================================================
  const getCustomerEmail = () => {
    const email = order.email?.trim() || customer.email?.trim() || "";
    return email !== "" ? email : "Email não fornecido";
  };

  // ============================================================
  // 3. TELEFONE - Lidar com null vs string vazia
  // ============================================================
  const getCustomerPhone = () => {
    // Tentar múltiplas fontes
    const phone = order.phone 
      || customer.phone 
      || order.billing_address?.phone 
      || order.shipping_address?.phone;
    
    if (phone === null) {
      return "Não aplicável"; // Produto digital ou não necessário
    } else if (phone === "" || !phone) {
      return "Não fornecido"; // Cliente não forneceu
    } else {
      return phone;
    }
  };

  // ============================================================
  // 4. ENDEREÇO DE ENTREGA - Lidar com null (produto digital)
  // ============================================================
  const getShippingInfo = () => {
    const shipping = order.shipping_address;
    
    if (shipping === null) {
      // Produto digital ou sem necessidade de envio
      return {
        type: "digital",
        message: "Produto Digital - Sem envio físico",
        address: null
      };
    } else if (shipping.city === "Unknown" || shipping.address1 === "Unknown") {
      // Endereço incompleto
      return {
        type: "incomplete",
        message: "Endereço incompleto",
        address: shipping
      };
    } else {
      // Endereço completo
      return {
        type: "physical",
        message: `${shipping.city}, ${shipping.province_code}`,
        address: shipping
      };
    }
  };

  // ============================================================
  // 5. TRACKING - Lidar com array vazio de fulfillments
  // ============================================================
  const getTrackingInfo = () => {
    if (order.fulfillments.length === 0) {
      return {
        hasTracking: false,
        message: "Aguardando envio"
      };
    }

    const fulfillment = order.fulfillments[0];
    const trackingNumber = fulfillment.tracking_number;
    const trackingUrl = fulfillment.tracking_url;

    if (!trackingNumber || trackingNumber === "") {
      return {
        hasTracking: false,
        message: "Sem código de rastreio"
      };
    }

    return {
      hasTracking: true,
      trackingNumber,
      trackingUrl,
      status: fulfillment.shipment_status || "unknown",
      message: `Rastreio: ${trackingNumber}`
    };
  };

  // ============================================================
  // 6. PRODUTOS - Lidar com produto deletado
  // ============================================================
  const getProductInfo = () => {
    const lineItems = order.line_items;
    
    if (lineItems.length === 0) {
      return [];
    }

    return lineItems.map(item => {
      const exists = item.product_exists ?? true; // Default true se não especificado
      
      return {
        id: item.id,
        name: item.title || item.name || "Produto Desconhecido",
        sku: item.sku || "N/A",
        quantity: item.quantity,
        price: item.price,
        exists,
        warning: !exists ? "⚠️ Produto não existe mais no catálogo" : null,
        isDigital: !item.requires_shipping,
        weight: item.grams || 0
      };
    });
  };

  // ============================================================
  // 7. PAGAMENTO - Lidar com payment_details null
  // ============================================================
  const getPaymentInfo = () => {
    const transactions = order.transactions || [];
    
    if (transactions.length === 0) {
      return {
        hasPayment: false,
        message: "Sem transação registrada"
      };
    }

    const transaction = transactions[0];
    const paymentDetails = transaction.payment_details;

    if (paymentDetails === null) {
      return {
        hasPayment: true,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        message: "Detalhes de pagamento não disponíveis",
        securityCheck: null
      };
    }

    return {
      hasPayment: true,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      cardBin: paymentDetails.credit_card_bin || "N/A",
      cardNumber: paymentDetails.credit_card_number || "N/A",
      cardCompany: paymentDetails.credit_card_company || "N/A",
      avsCode: paymentDetails.avs_result_code || "N/A",
      cvvCode: paymentDetails.cvv_result_code || "N/A",
      securityCheck: {
        avs: paymentDetails.avs_result_code === "Y" ? "✅ Verificado" : "⚠️ Não verificado",
        cvv: paymentDetails.cvv_result_code === "M" ? "✅ Match" : "⚠️ No match"
      }
    };
  };

  // ============================================================
  // 8. COORDENADAS - Lidar com latitude/longitude null
  // ============================================================
  const getMapInfo = () => {
    const address = order.shipping_address || order.billing_address;
    
    if (!address) {
      return { canShowMap: false, message: "Sem endereço disponível" };
    }

    const lat = address.latitude;
    const lng = address.longitude;

    if (lat === null || lng === null || lat === undefined || lng === undefined) {
      return {
        canShowMap: false,
        message: "Coordenadas não disponíveis",
        address: `${address.city}, ${address.province_code}`
      };
    }

    return {
      canShowMap: true,
      lat,
      lng,
      address: `${address.city}, ${address.province_code}`,
      mapUrl: `https://maps.google.com/?q=${lat},${lng}`
    };
  };

  // ============================================================
  // 9. DESCONTOS - Lidar com arrays vazios
  // ============================================================
  const getDiscountInfo = () => {
    const discounts = order.discount_applications || [];
    const codes = order.discount_codes || [];

    if (discounts.length === 0 && codes.length === 0) {
      return {
        hasDiscount: false,
        message: "Sem descontos aplicados"
      };
    }

    return {
      hasDiscount: true,
      count: discounts.length,
      total: order.total_discounts || "0.00",
      codes: codes.map(c => c.code).filter(Boolean),
      discounts: discounts.map(d => ({
        type: d.type,
        value: d.value,
        code: d.code || null
      }))
    };
  };

  // ============================================================
  // RENDER
  // ============================================================
  const customerName = getCustomerName();
  const customerEmail = getCustomerEmail();
  const customerPhone = getCustomerPhone();
  const shippingInfo = getShippingInfo();
  const trackingInfo = getTrackingInfo();
  const products = getProductInfo();
  const paymentInfo = getPaymentInfo();
  const mapInfo = getMapInfo();
  const discountInfo = getDiscountInfo();

  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm space-y-4">
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-xl font-bold">Dispute #{dispute.id}</h2>
        <p className="text-sm text-gray-600">Pedido: {order.name}</p>
      </div>

      {/* Cliente */}
      <div>
        <h3 className="font-semibold mb-2">👤 Cliente</h3>
        <div className="space-y-1 text-sm">
          <p><strong>Nome:</strong> {customerName}</p>
          <p><strong>Email:</strong> {customerEmail}</p>
          <p><strong>Telefone:</strong> {customerPhone}</p>
        </div>
      </div>

      {/* Endereço e Entrega */}
      <div>
        <h3 className="font-semibold mb-2">📦 Entrega</h3>
        <div className="space-y-1 text-sm">
          <p><strong>Tipo:</strong> {shippingInfo.message}</p>
          {shippingInfo.type === "physical" && shippingInfo.address && (
            <>
              <p><strong>Endereço:</strong> {shippingInfo.address.address1}</p>
              <p><strong>Cidade:</strong> {shippingInfo.address.city}</p>
            </>
          )}
        </div>
      </div>

      {/* Tracking */}
      {trackingInfo.hasTracking && (
        <div>
          <h3 className="font-semibold mb-2">🚚 Rastreamento</h3>
          <div className="space-y-1 text-sm">
            <p><strong>Código:</strong> {trackingInfo.trackingNumber}</p>
            <p><strong>Status:</strong> {trackingInfo.status}</p>
            {trackingInfo.trackingUrl && (
              <a 
                href={trackingInfo.trackingUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Rastrear pedido →
              </a>
            )}
          </div>
        </div>
      )}

      {/* Produtos */}
      <div>
        <h3 className="font-semibold mb-2">🛍️ Produtos</h3>
        <div className="space-y-2">
          {products.map(product => (
            <div key={product.id} className="text-sm border-l-2 pl-3 py-1">
              <p className="font-medium">{product.name}</p>
              <p className="text-gray-600">
                SKU: {product.sku} | Qtd: {product.quantity} | ${product.price}
              </p>
              {product.isDigital && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                  Digital
                </span>
              )}
              {product.warning && (
                <p className="text-red-600 mt-1">{product.warning}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pagamento */}
      <div>
        <h3 className="font-semibold mb-2">💳 Pagamento</h3>
        <div className="space-y-1 text-sm">
          <p><strong>Valor:</strong> {paymentInfo.currency} {paymentInfo.amount}</p>
          <p><strong>Status:</strong> {paymentInfo.status}</p>
          <p><strong>Cartão:</strong> {dispute.card_brand} {dispute.card_last4}</p>
          {paymentInfo.securityCheck && (
            <>
              <p><strong>AVS:</strong> {paymentInfo.securityCheck.avs}</p>
              <p><strong>CVV:</strong> {paymentInfo.securityCheck.cvv}</p>
            </>
          )}
        </div>
      </div>

      {/* Descontos */}
      {discountInfo.hasDiscount && (
        <div>
          <h3 className="font-semibold mb-2">🎟️ Descontos</h3>
          <div className="space-y-1 text-sm">
            <p><strong>Total:</strong> ${discountInfo.total}</p>
            {discountInfo.codes.length > 0 && (
              <p><strong>Cupons:</strong> {discountInfo.codes.join(", ")}</p>
            )}
          </div>
        </div>
      )}

      {/* Mapa */}
      {mapInfo.canShowMap && (
        <div>
          <h3 className="font-semibold mb-2">🗺️ Localização</h3>
          <div className="space-y-1 text-sm">
            <p>{mapInfo.address}</p>
            <a 
              href={mapInfo.mapUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Ver no mapa →
            </a>
          </div>
        </div>
      )}

      {/* Footer com tipo de dispute */}
      <div className="border-t pt-4 text-sm text-gray-600">
        <p><strong>Tipo:</strong> {dispute.type}</p>
        <p><strong>Motivo:</strong> {dispute.reasonTranslated}</p>
        <p><strong>Status:</strong> {dispute.status}</p>
      </div>
    </div>
  );
};

// ============================================================
// EXEMPLO DE USO
// ============================================================

export const DisputeList = () => {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold mb-6">Todos os Disputes</h1>
      
      {/* Disputes completos */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Disputes Completos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockDisputes.slice(0, 8).map((_, index) => (
            <RobustDisputeCard key={index} disputeIndex={index} />
          ))}
        </div>
      </section>

      {/* Edge Cases */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold mb-4">🧪 Edge Cases (Testes)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Produto Digital - Campos NULL apropriados
            </p>
            <RobustDisputeCard disputeIndex={8} />
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Dados Mínimos - Strings vazias e ausências
            </p>
            <RobustDisputeCard disputeIndex={9} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default RobustDisputeCard;
