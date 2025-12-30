import { ItemNotReceivedFlow } from "@/components/ItemNotReceivedFlow";
import { DashboardLayout } from "@/components/DashboardLayout";

// Mock order para teste
const mockOrder = {
  orderNumber: "1234",
  email: "teste@exemplo.com",
  customerName: "João Silva",
  status: "delivered" as const, // Altere para "in_transit" para testar o outro fluxo
  orderDate: "12/03/2024",
  totalAmount: "$125.00",
  shippingAddress: "Av. Rio Branco, 123, Apto 45 - Itapira, São Paulo - Brazil - 13970-000",
  carrier: "Loggi",
  trackingNumber: "BR123456789BR",
  deliveryDate: "12/10/2024",
  currency: "BRL",
  items: [
    { name: "Produto Teste", quantity: 1, price: "$125.00" },
  ],
};

export default function ItemNotReceivedTest() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Teste - Item Not Received Flow
          </h1>
          <p className="text-gray-600">
            Página de teste para visualizar o componente ItemNotReceivedFlow
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Status atual: <strong>{mockOrder.status}</strong> - Altere no código para testar diferentes fluxos
          </p>
        </div>
        
        <ItemNotReceivedFlow
          order={mockOrder}
          primaryColor="#1B966C"
          primaryTextColor="#FFFFFF"
          onClose={() => console.log("Fechado")}
          onComplete={() => console.log("Completo")}
        />
      </div>
    </DashboardLayout>
  );
}

