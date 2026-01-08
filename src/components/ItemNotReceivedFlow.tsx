import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, AlertTriangle, Clock, Package, MapPin, Truck } from "lucide-react";

// Tipo Order importado do ResolutionHub (deve ser compatível)
type OrderStatus = "delivered" | "in_transit" | "cancelled" | "refunded" | "pending";

type Order = {
  orderNumber?: string;
  email: string;
  customerName: string;
  status: OrderStatus;
  orderDate?: string;
  totalAmount?: string;
  shippingAddress?: string;
  address?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  trackingCode?: string;
  deliveryDate?: string;
  deliveryTime?: string; // Timestamp ISO completo com hora (formato 17track)
  items: Array<{
    name: string;
    quantity: number;
    price?: string | number;
    image?: string;
  }>;
  id?: string;
  createdAt?: string;
  total?: number;
  currency?: string;
  subtotal?: number;
  shippingCost?: number;
  discount?: number;
};

type Step = 1 | 2;

interface ItemNotReceivedFlowProps {
  order: Order; // Recebe o order do ResolutionHub
  onClose?: () => void;
  onComplete?: () => void;
  primaryColor?: string;
  primaryTextColor?: string;
}

export const ItemNotReceivedFlow: React.FC<ItemNotReceivedFlowProps> = ({
  order,
  onClose,
  onComplete,
  primaryColor = "#1B966C",
  primaryTextColor = "#FFFFFF",
}) => {
  const [step, setStep] = useState<Step>(1);
  const [checkboxes, setCheckboxes] = useState({
    neighbors: false,
    reception: false,
    mailbox: false,
  });

  // Verificar se todos os checkboxes estão marcados
  const allCheckboxesChecked = checkboxes.neighbors && checkboxes.reception && checkboxes.mailbox;

  const handleCheckboxChange = (key: keyof typeof checkboxes) => {
    setCheckboxes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Helper function to format delivery date/time (17track format)
  const formatDeliveryDateTime = (): string => {
    // Priority: deliveryTime (full timestamp) > deliveryDate (date only)
    if (order.deliveryTime) {
      // Format ISO timestamp to readable English format
      try {
        const date = new Date(order.deliveryTime);
        const formattedDate = date.toLocaleDateString("en-US", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        const formattedTime = date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
        return `${formattedDate} at ${formattedTime}`;
      } catch (e) {
        // Fallback if parsing fails
        return order.deliveryTime;
      }
    }
    if (order.deliveryDate) {
      return order.deliveryDate;
    }
    if (order.orderDate) {
      return order.orderDate;
    }
    return "Date not available";
  };

  // Helper function to get delivery location
  const getDeliveryLocation = (): string => {
    // Try to extract city/state from shipping address
    if (order.shippingAddress) {
      const parts = order.shippingAddress.split(" - ");
      if (parts.length >= 2) {
        return parts[parts.length - 2] || "Delivery address";
      }
      return order.shippingAddress;
    }
    if (order.address) {
      return order.address;
    }
    return "Delivery address";
  };

  // SCREEN: Expectation Management (for in_transit status)
  const renderExpectationManagement = () => (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div className="flex items-center justify-center">
        <div className="rounded-full p-4 bg-blue-100">
          <Truck className="h-12 w-12 text-blue-600" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">Your order is on the way.</h2>
        <p className="text-gray-600">
          The original estimate is still valid. Sometimes there are small delays in sorting.
        </p>
      </div>

      <Button
        className="w-full h-11 shadow-sm hover:shadow-md transition-all"
        style={{
          backgroundColor: primaryColor,
          color: primaryTextColor,
        }}
        onClick={() => {
          if (onClose) onClose();
        }}
      >
        Got it, I'll wait
      </Button>
    </div>
  );

  // STEP 1: Authority Check (refatorado com nova UI)
  const renderAuthorityCheck = () => null;

  // STEP 2: Friction Modal
  const renderStep2 = () => (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Header - mesmo padrão visual das outras etapas */}
      <div className="text-center">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 animate-in zoom-in duration-300"
          style={{
            backgroundColor: "#F59E0B",
            boxShadow: "0 4px 12px rgba(245, 158, 11, 0.15)",
          }}
        >
          <AlertTriangle className="h-8 w-8 text-white" />
        </div>
        <h2 className="chargemind-step-title">Before continuing</h2>
        <p className="chargemind-step-subtitle">Please check the following locations before proceeding:</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        {/* Usa px (não rem) porque no proxy o font-size pode ser sobrescrito pelo tema da loja */}
        <div className="space-y-[16px]">
          <label className="flex items-start gap-3 cursor-pointer group">
            <Checkbox
              checked={checkboxes.neighbors}
              onCheckedChange={() => handleCheckboxChange("neighbors")}
              className="mt-[12px] h-[16px] w-[16px] min-h-[16px] min-w-[16px]"
            />
            <div className="flex-1">
              <p className="text-[13px] font-bold text-gray-900">I checked with neighbors</p>
              <p className="text-[13px] font-normal text-gray-600 mt-0">
                The product may have been delivered to a nearby address
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <Checkbox
              checked={checkboxes.reception}
              onCheckedChange={() => handleCheckboxChange("reception")}
              className="mt-[1px] h-[16px] w-[16px] min-h-[16px] min-w-[16px]"
            />
            <div className="flex-1">
              <p className="text-[13px] font-bold text-gray-900">I checked at reception/concierge</p>
              <p className="text-[13px] font-normal text-gray-600 mt-0">
                The product may be stored at the building's reception
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <Checkbox
              checked={checkboxes.mailbox}
              onCheckedChange={() => handleCheckboxChange("mailbox")}
              className="mt-[1px] h-[16px] w-[16px] min-h-[16px] min-w-[16px]"
            />
            <div className="flex-1">
              <p className="text-[13px] font-bold text-gray-900">I checked the mailbox</p>
              <p className="text-[13px] font-normal text-gray-600 mt-0">
                Small products may have been left in the mailbox
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <Button
          className="chargemind-primary-button w-[85%] shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: primaryColor,
            color: primaryTextColor,
          }}
          disabled={!allCheckboxesChecked}
          onClick={() => {
            // When completing Step 2, closes component and returns to original Step 4
            if (onComplete) onComplete();
          }}
        >
          Continue
        </Button>
      </div>
    </div>
  );

  // LÓGICA DE RENDERIZAÇÃO AUTOMÁTICA baseada no status do order
  // Se in_transit, retorna IMEDIATAMENTE a tela de Gestão de Expectativa
  if (order.status === "in_transit") {
    return (
      <div className="space-y-6">
        <Card className="border-gray-200 shadow-sm rounded-lg p-6 md:p-8">{renderExpectationManagement()}</Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {step === 1 && (
        <>
          {/* Header - mesmo padrão visual do Step "We found your order!" */}
          <div className="text-center">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 animate-in zoom-in duration-300"
              style={{
                backgroundColor: "#25B079",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)",
              }}
            >
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="chargemind-step-title">Delivered</h2>
            <p className="chargemind-step-subtitle">The carrier confirms delivery.</p>
          </div>

          {/* Card de informações - reaproveita o mesmo layout do "We found your order!" */}
          <div className="order-tracking-card-wrapper">
            <div className="order-tracking-card">
              {/* Header Section */}
              <div className="order-tracking-header">
                <div className="order-tracking-header-left">
                  <p className="order-tracking-label">ORDER</p>
                  <p className="order-tracking-number">#{order.orderNumber || order.id?.replace("#", "") || "N/A"}</p>
                  <p className="order-tracking-customer">{order.customerName}</p>
                </div>
                <span className="order-tracking-status order-tracking-status-delivered">Delivered</span>
              </div>

              {/* Details */}
              <div className="relative py-5">
                <div className="order-tracking-divider-line"></div>
              </div>
              <div className="order-tracking-details">
                {order.carrier && (
                  <div className="order-tracking-detail-row">
                    <span className="order-tracking-detail-label">Carrier:</span>
                    <span className="order-tracking-detail-value">{order.carrier}</span>
                  </div>
                )}
                {(order.deliveryDate || order.deliveryTime) && (
                  <div className="order-tracking-detail-row">
                    <span className="order-tracking-detail-label">
                      {order.deliveryTime ? "Delivery date and time:" : "Delivery date:"}
                    </span>
                    <span className="order-tracking-detail-value">{formatDeliveryDateTime()}</span>
                  </div>
                )}
                <div className="order-tracking-detail-row">
                  <span className="order-tracking-detail-label">Location:</span>
                  <span className="order-tracking-detail-value">{getDeliveryLocation()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Alert/Tip - mesma largura do card de informações */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <p className="chargemind-tip-text text-amber-800 font-medium">
              ⚠️ 85% of customers find the package at reception or with a neighbor who received it by mistake.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-center gap-3">
            <Button
              className="chargemind-primary-button w-[85%] shadow-sm hover:shadow-md transition-all"
              style={{ backgroundColor: primaryColor, color: primaryTextColor }}
              onClick={() => {
                if (onClose) onClose();
                else setStep(1);
              }}
            >
              I'll check again
            </Button>

            <button type="button" className="chargemind-text-link-not-order" onClick={() => setStep(2)}>
              I didn't receive it, I need help
            </button>
          </div>
        </>
      )}
      {step === 2 && <Card className="border-gray-200 shadow-sm rounded-lg p-6 md:p-8">{renderStep2()}</Card>}
    </div>
  );
};
