import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, FileText } from "lucide-react";
import { generateDisputePDF } from "@/utils/generateDisputePDF";
import { toast } from "sonner";

const mockScenarios = [
  {
    label: "✅ 1. Winning Case (Delivered)",
    id: "case_001",
    amount: "52.80",
    currency: "GBP",
    reason: "product_not_received",
    reasonTranslated: "Not received",
    status: "needs_response",
    initiated_at: "2025-10-28T09:14:00Z",
    order: {
      name: "#1370",
      date: "2025-10-01 05:33",
      subtotal: "49.90",
      shipping_cost: "2.90",
      shipping_method: "Royal Mail 48 (4-7 days)",
      total_tax: "0.00",
      total_price: "52.80",
      tracking_number: "WNBAA0389493044YQ",
      tracking_carrier: "Royal Mail",
      customer: { first_name: "Katarzyna", last_name: "Olszewska", email: "kasiaolszewska@me.com" },
      billing_address: { 
        full_name: "Katarzyna Olszewska",
        address1: "47 Old Meadow Walk", 
        city: "Wishaw", 
        province: "Scotland",
        zip: "ML2 7FD", 
        country: "United Kingdom" 
      },
      shipping_address: { 
        full_name: "Katarzyna Olszewska",
        address1: "47 Old Meadow Walk", 
        city: "Wishaw", 
        province: "Scotland",
        zip: "ML2 7FD", 
        country: "United Kingdom" 
      },
      client_details: { browser_ip: "94.175.122.104" },
      payment_details: { avs_result_code: "Y", cvv_result_code: "M", card_brand: "Visa", card_last4: "4242" },
      line_items: [
        { title: "Adidas® Lifestyle Duo Set - Brown / M", quantity: 1, price: "49.90" }
      ]
    },
    avs_check: "Pass",
    cvc_check: "Pass",
    trackingData: {
      trackingNumber: "WNBAA0389493044YQ",
      status: "Delivered",
      carrier: "WANBEXPRESS",
      events: [
        { date: "Oct 17, 2025, 1:10 PM UTC", status: "Delivered", location: "Glasgow Service Centre", message: "Your parcel has been delivered to a safe place (Back porch)" },
        { date: "Oct 17, 2025, 12:40 PM UTC", status: "Out for Delivery", location: "Glasgow Service Centre", message: "Your parcel is with one of our drivers for delivery" },
        { date: "Oct 17, 2025, 6:54 AM UTC", status: "In Transit", location: "Glasgow Service Centre", message: "Your parcel has arrived at your delivery depot" },
        { date: "Oct 16, 2025, 7:28 PM UTC", status: "In Transit", location: "Hatfield Terminal", message: "Your parcel is at our national hub" },
        { date: "Oct 9, 2025, 11:24 AM UTC", status: "In Transit", location: "Shenzhen, China", message: "Parcel processed" }
      ],
    },
  },
  {
    label: "⚠️ 2. Premature Dispute (In Transit)",
    id: "case_002",
    amount: "120.00",
    currency: "USD",
    reason: "product_not_received",
    reasonTranslated: "Not received",
    status: "needs_response",
    initiated_at: "2025-11-20T10:00:00Z",
    order: {
      name: "#1045",
      date: "2025-11-12 10:00",
      subtotal: "110.00",
      shipping_cost: "10.00",
      shipping_method: "Express International",
      total_tax: "0.00",
      total_price: "120.00",
      tracking_number: "LM99283746CN",
      tracking_carrier: "USPS",
      customer: { first_name: "John", last_name: "Doe", email: "john.doe@gmail.com" },
      billing_address: { full_name: "John Doe", address1: "123 Main St", city: "New York", zip: "10001", country: "US" },
      shipping_address: { full_name: "John Doe", address1: "123 Main St", city: "New York", zip: "10001", country: "US" },
      client_details: { browser_ip: "67.188.22.10" },
      payment_details: { avs_result_code: "Y", cvv_result_code: "M" },
      line_items: [
        { title: "Sony WH-1000XM5 Headphones", quantity: 1, price: "110.00" }
      ]
    },
    avs_check: "Pass",
    cvc_check: "Pass",
    trackingData: {
      trackingNumber: "LM99283746CN",
      status: "In Transit",
      carrier: "USPS",
      events: [
        { date: "Nov 19, 2025, 2:20 PM UTC", status: "In Transit", location: "Los Angeles INT Distribution Center", message: "Arrived at Facility" },
        { date: "Nov 15, 2025, 8:00 AM UTC", status: "In Transit", location: "Shanghai", message: "Processed Through Facility" }
      ],
    },
  },
  {
    label: "🚨 3. No Tracking (Digital Evidence Only)",
    id: "case_003",
    amount: "29.99",
    currency: "USD",
    reason: "product_not_received",
    reasonTranslated: "Not received",
    status: "needs_response",
    initiated_at: "2025-12-01T15:30:00Z",
    order: {
      name: "#1088",
      date: "2025-11-28 14:00",
      subtotal: "29.99",
      shipping_cost: "0.00",
      shipping_method: "Digital Delivery",
      total_tax: "0.00",
      total_price: "29.99",
      tracking_number: null,
      tracking_carrier: null,
      customer: { first_name: "Sarah", last_name: "Connor", email: "sarah@skynet.net" },
      billing_address: { full_name: "Sarah Connor", address1: "800 W Olympic Blvd", city: "Los Angeles", zip: "90015", country: "US" },
      shipping_address: { full_name: "Sarah Connor", address1: "800 W Olympic Blvd", city: "Los Angeles", zip: "90015", country: "US" },
      client_details: { browser_ip: "192.168.1.1" },
      payment_details: { avs_result_code: "Y", cvv_result_code: "M" },
      line_items: [
        { title: "Premium SaaS Subscription (Monthly)", quantity: 1, price: "29.99" }
      ]
    },
    avs_check: "Pass",
    cvc_check: "Pass",
    trackingData: null,
  },
  {
    label: "🕵️ 4. Fraud Claim (High Value)",
    id: "case_004",
    amount: "450.00",
    currency: "USD",
    reason: "fraudulent",
    reasonTranslated: "Fraudulent",
    status: "needs_response",
    initiated_at: "2025-11-10T11:00:00Z",
    order: {
      name: "#1102",
      date: "2025-11-08 09:00",
      subtotal: "420.00",
      shipping_cost: "30.00",
      shipping_method: "FedEx Priority",
      total_tax: "0.00",
      total_price: "450.00",
      tracking_number: "FedEx7728391",
      tracking_carrier: "FedEx",
      customer: { first_name: "Michael", last_name: "Scott", email: "mscott@dunder.com" },
      billing_address: { full_name: "Michael Scott", address1: "1725 Slough Ave", city: "Scranton", zip: "18505", country: "US" },
      shipping_address: { full_name: "Michael Scott", address1: "1725 Slough Ave", city: "Scranton", zip: "18505", country: "US" },
      client_details: { browser_ip: "204.12.33.11" },
      payment_details: { avs_result_code: "Y", cvv_result_code: "M" },
      line_items: [
        { title: "Limited Edition Chronograph Watch", quantity: 1, price: "420.00" }
      ]
    },
    avs_check: "Pass",
    cvc_check: "Pass",
    trackingData: {
      trackingNumber: "FedEx7728391",
      status: "Delivered",
      carrier: "FedEx",
      events: [
        { date: "Nov 12, 2025, 2:30 PM UTC", status: "Delivered", location: "Miami, FL", message: "Left at front door" }
      ],
    },
  },
  {
    label: "📍 5. Different Billing/Shipping",
    id: "case_005",
    amount: "199.99",
    currency: "USD",
    reason: "product_not_received",
    reasonTranslated: "Not received",
    status: "needs_response",
    initiated_at: "2025-11-18T12:00:00Z",
    order: {
      name: "#1450",
      date: "2025-11-15 08:30",
      subtotal: "179.99",
      shipping_cost: "20.00",
      shipping_method: "UPS Ground",
      total_tax: "0.00",
      total_price: "199.99",
      tracking_number: "UPS1Z9994440",
      tracking_carrier: "UPS",
      customer: { first_name: "Tony", last_name: "Stark", email: "tony@stark.com" },
      billing_address: { full_name: "Tony Stark", address1: "10880 Malibu Point", city: "Malibu", province: "CA", zip: "90265", country: "US" },
      shipping_address: { full_name: "Pepper Potts", address1: "200 Park Avenue", city: "New York", province: "NY", zip: "10166", country: "US" },
      client_details: { browser_ip: "72.14.204.91" },
      payment_details: { avs_result_code: "Y", cvv_result_code: "M" },
      line_items: [
        { title: "Arc Reactor Model Kit - Collector's Edition", quantity: 1, price: "179.99" }
      ]
    },
    avs_check: "Pass",
    cvc_check: "Pass",
    trackingData: {
      trackingNumber: "UPS1Z9994440",
      status: "Delivered",
      carrier: "UPS",
      events: [
        { date: "Nov 20, 2025, 9:15 AM UTC", status: "Delivered", location: "New York, NY", message: "Delivered to reception desk" },
        { date: "Nov 19, 2025, 6:30 PM UTC", status: "Out for Delivery", location: "New York, NY", message: "On vehicle for delivery" },
      ],
    },
  },
  {
    label: "🛒 6. Multi-Item Order",
    id: "case_006",
    amount: "156.75",
    currency: "EUR",
    reason: "product_not_received",
    reasonTranslated: "Not received",
    status: "needs_response",
    initiated_at: "2025-11-25T08:45:00Z",
    order: {
      name: "#1567",
      date: "2025-11-20 14:20",
      subtotal: "145.85",
      shipping_cost: "10.90",
      shipping_method: "DHL Express",
      total_tax: "0.00",
      total_price: "156.75",
      tracking_number: "DHL4829103",
      tracking_carrier: "DHL",
      customer: { first_name: "Marie", last_name: "Curie", email: "marie@science.fr" },
      billing_address: { full_name: "Marie Curie", address1: "15 Rue Cuvier", city: "Paris", zip: "75005", country: "France" },
      shipping_address: { full_name: "Marie Curie", address1: "15 Rue Cuvier", city: "Paris", zip: "75005", country: "France" },
      client_details: { browser_ip: "82.120.45.12" },
      payment_details: { avs_result_code: "Y", cvv_result_code: "M", card_brand: "Mastercard", card_last4: "8912" },
      line_items: [
        { title: "Scientific Calculator Pro X200", quantity: 2, price: "49.95" },
        { title: "Lab Notebook - Premium Edition", quantity: 3, price: "12.99" },
        { title: "Periodic Table Poster (Large)", quantity: 1, price: "6.98" }
      ]
    },
    avs_check: "Pass",
    cvc_check: "Pass",
    trackingData: {
      trackingNumber: "DHL4829103",
      status: "Delivered",
      carrier: "DHL",
      events: [
        { date: "Nov 23, 2025, 11:30 AM UTC", status: "Delivered", location: "Paris, France", message: "Delivered - Signed by M. CURIE" },
        { date: "Nov 23, 2025, 8:00 AM UTC", status: "Out for Delivery", location: "Paris, France", message: "With delivery courier" },
      ],
    },
  },
];

interface PDFTestScenariosProps {
  onClose?: () => void;
}

export function PDFTestScenarios({ onClose }: PDFTestScenariosProps) {
  const [selectedScenarioId, setSelectedScenarioId] = useState(mockScenarios[0].id);

  const selectedScenario = mockScenarios.find(s => s.id === selectedScenarioId) || mockScenarios[0];

  const handleGeneratePDF = () => {
    try {
      generateDisputePDF(selectedScenario as any, selectedScenario.trackingData);
      toast.success(`PDF generated for: ${selectedScenario.label}`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Error generating PDF");
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-background">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-[#19976F]" />
        <h3 className="font-semibold">PDF Test Scenarios</h3>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">Select Scenario:</label>
        <Select value={selectedScenarioId} onValueChange={setSelectedScenarioId}>
          <SelectTrigger className="w-full bg-background">
            <SelectValue placeholder="Select a test scenario" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            {mockScenarios.map((scenario) => (
              <SelectItem key={scenario.id} value={scenario.id}>
                {scenario.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Scenario Preview */}
      <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-muted-foreground">Invoice:</span>
            <span className="ml-2 font-mono">{selectedScenario.order.name}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Amount:</span>
            <span className="ml-2">{selectedScenario.amount} {selectedScenario.currency}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Reason:</span>
            <span className="ml-2">{selectedScenario.reasonTranslated}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Tracking:</span>
            <span className="ml-2">{selectedScenario.order.tracking_number ? "Yes" : "No"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Customer:</span>
            <span className="ml-2">
              {selectedScenario.order.customer.first_name} {selectedScenario.order.customer.last_name}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Items:</span>
            <span className="ml-2">{selectedScenario.order.line_items?.length || 0}</span>
          </div>
        </div>
      </div>

      <Button 
        onClick={handleGeneratePDF} 
        className="w-full bg-[#19976F] hover:bg-[#157a58] text-white"
      >
        <Eye className="w-4 h-4 mr-2" />
        Generate PDF for This Scenario
      </Button>

      {/* Quick buttons for all scenarios */}
      <div className="pt-2 border-t">
        <p className="text-xs text-muted-foreground mb-2">Quick generate all:</p>
        <div className="flex flex-wrap gap-1">
          {mockScenarios.map((scenario, index) => (
            <Button
              key={scenario.id}
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => {
                try {
                  generateDisputePDF(scenario as any, scenario.trackingData);
                  toast.success(`PDF ${index + 1} generated`);
                } catch (error) {
                  toast.error(`PDF ${index + 1} failed`);
                }
              }}
            >
              #{index + 1}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
