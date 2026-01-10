import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

interface FlowStep {
  step: number;
  name: string;
  description: string;
  functions: string[];
  transitions: string[];
}

interface ProblemType {
  key: string;
  name: string;
  description: string;
  evidenceRequired: string[];
}

interface ResolutionOption {
  type: string;
  name: string;
  description: string;
  benefits: string[];
}

const flowSteps: FlowStep[] = [
  {
    step: 1,
    name: "Order Validation",
    description: "Customer enters order number and email to locate their order in the system.",
    functions: ["renderStep1()", "handleValidation()"],
    transitions: ["→ Step 2 (if order found)", "→ Error message (if not found)"],
  },
  {
    step: 2,
    name: "Order Confirmation",
    description: "Displays order details (items, value, date, shipping address) for customer confirmation.",
    functions: ["renderStep2()", "handleOrderConfirmation()"],
    transitions: ["→ Step 3 (on confirm)", "→ Step 1 (on 'not my order')"],
  },
  {
    step: 3,
    name: "Problem Selection",
    description: "Customer selects the type of problem they're experiencing with their order.",
    functions: ["renderStep3()", "selectRoute(routeKey)"],
    transitions: ["→ Step 4 (standard flow)", "→ ItemNotReceivedFlow (if 'not_received')"],
  },
  {
    step: 4,
    name: "Resolution Choice",
    description: "Customer chooses between Store Credit (with 10% bonus) or Refund (requires evidence).",
    functions: ["renderStep4()", "selectDecision(choice)"],
    transitions: ["→ Step 6 (if credit)", "→ Step 5 (if refund)"],
  },
  {
    step: 5,
    name: "Evidence Collection",
    description: "Dynamic form collecting evidence based on problem type. Different fields for each category.",
    functions: ["renderStep5()", "handleEvidenceSubmit()"],
    transitions: ["→ Step 6 (on submit)", "→ Validation error (if incomplete)"],
  },
  {
    step: 6,
    name: "Final Confirmation",
    description: "Displays resolution outcome: credit code issued or refund protocol number.",
    functions: ["renderStep6()", "resetFlow()"],
    transitions: ["→ Step 1 (new request)", "→ Close flow"],
  },
];

const problemTypes: ProblemType[] = [
  {
    key: "not_received",
    name: "Product Not Received",
    description: "Customer claims the product was never delivered despite shipping confirmation.",
    evidenceRequired: [
      "Confirmation checked with neighbors",
      "Contacted carrier for delivery confirmation",
      "Photo of delivery area (optional)",
    ],
  },
  {
    key: "defect",
    name: "Product Defect/Quality",
    description: "Product arrived with defects, damage, or quality issues.",
    evidenceRequired: [
      "Minimum 2 photos showing the defect",
      "Selection of defect type (visual, functional, etc.)",
      "Description minimum 50 characters",
    ],
  },
  {
    key: "regret",
    name: "Return/Exchange",
    description: "Customer wants to return or exchange the product (regret purchase).",
    evidenceRequired: [
      "Product condition verification",
      "Original packaging confirmation",
      "Reason for return selection",
      "Photos of product and packaging",
    ],
  },
  {
    key: "fraud",
    name: "Charge Question",
    description: "Customer doesn't recognize the charge or suspects unauthorized use.",
    evidenceRequired: [
      "Address recognition check",
      "Family member purchase verification",
      "Chargeback status indication",
    ],
  },
  {
    key: "cancel",
    name: "Cancel Order",
    description: "Customer wants to cancel an order that hasn't shipped yet.",
    evidenceRequired: [
      "Order status verification (not yet shipped)",
      "Cancellation reason selection",
    ],
  },
];

const resolutionOptions: ResolutionOption[] = [
  {
    type: "credit",
    name: "Store Credit",
    description: "Instant credit to use in the store with a 10% bonus on value.",
    benefits: [
      "Immediate processing",
      "10% bonus on credit value",
      "No evidence required",
      "Credit code generated instantly",
    ],
  },
  {
    type: "refund",
    name: "Refund",
    description: "Full refund to original payment method after evidence review.",
    benefits: [
      "Full value returned",
      "3-5 business days processing",
      "Requires evidence submission",
      "Subject to review approval",
    ],
  },
];

export function generateProxyFlowDocumentation(): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = margin;

  // Helper function to add page break if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to add section title
  const addSectionTitle = (title: string, fontSize: number = 14) => {
    checkPageBreak(20);
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(33, 33, 33);
    doc.text(title, margin, yPosition);
    yPosition += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(66, 66, 66);
  };

  // Helper function to add paragraph
  const addParagraph = (text: string, maxWidth: number = pageWidth - margin * 2) => {
    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line: string) => {
      checkPageBreak(6);
      doc.text(line, margin, yPosition);
      yPosition += 5;
    });
    yPosition += 3;
  };

  // ===== PAGE 1: COVER & OVERVIEW =====
  // Title
  doc.setFillColor(74, 144, 226);
  doc.rect(0, 0, pageWidth, 60, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("Resolution Hub", pageWidth / 2, 30, { align: "center" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Complete Flow Documentation", pageWidth / 2, 42, { align: "center" });

  doc.setFontSize(10);
  doc.text(`Generated: ${format(new Date(), "MMMM dd, yyyy 'at' HH:mm")}`, pageWidth / 2, 52, { align: "center" });

  yPosition = 75;
  doc.setTextColor(33, 33, 33);

  // Overview Section
  addSectionTitle("1. Overview", 16);
  addParagraph(
    "The Resolution Hub is a customer-facing self-service portal embedded in Shopify stores via App Proxy. It allows customers to resolve order issues (refunds, returns, disputes) through a guided 6-step flow, with emphasis on store credit retention."
  );

  yPosition += 5;

  // Key Features
  addSectionTitle("Key Features:");
  const features = [
    "• 6-step guided resolution flow",
    "• Dynamic branding from merchant settings",
    "• Store Credit promotion with 10% bonus",
    "• Evidence collection per problem type",
    "• Multi-language support (EN/PT)",
    "• Special ItemNotReceivedFlow for delivery issues",
  ];
  features.forEach((feature) => {
    checkPageBreak(6);
    doc.text(feature, margin + 5, yPosition);
    yPosition += 5;
  });

  yPosition += 10;

  // Flow Diagram (Text-based)
  addSectionTitle("Flow Overview:", 12);
  checkPageBreak(50);

  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin, yPosition, pageWidth - margin * 2, 45, 3, 3, "F");

  doc.setFontSize(9);
  doc.setTextColor(66, 66, 66);
  const flowDiagram = [
    "┌─────────────┐    ┌─────────────┐    ┌─────────────┐",
    "│  Step 1     │ →  │  Step 2     │ →  │  Step 3     │",
    "│  Validation │    │ Confirmation│    │  Problem    │",
    "└─────────────┘    └─────────────┘    └─────────────┘",
    "                                              ↓",
    "┌─────────────┐    ┌─────────────┐    ┌─────────────┐",
    "│  Step 6     │ ←  │  Step 5     │ ←  │  Step 4     │",
    "│   Final     │    │  Evidence   │    │ Resolution  │",
    "└─────────────┘    └─────────────┘    └─────────────┘",
  ];

  doc.setFont("courier", "normal");
  flowDiagram.forEach((line, index) => {
    doc.text(line, margin + 10, yPosition + 5 + index * 5);
  });
  doc.setFont("helvetica", "normal");

  // ===== PAGE 2: FLOW STEPS =====
  doc.addPage();
  yPosition = margin;

  addSectionTitle("2. Flow Steps Detail", 16);
  yPosition += 5;

  autoTable(doc, {
    startY: yPosition,
    head: [["Step", "Name", "Description", "Key Functions"]],
    body: flowSteps.map((step) => [
      step.step.toString(),
      step.name,
      step.description,
      step.functions.join("\n"),
    ]),
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [74, 144, 226],
      textColor: 255,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 15, halign: "center" },
      1: { cellWidth: 35 },
      2: { cellWidth: 75 },
      3: { cellWidth: 45, font: "courier", fontSize: 8 },
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
    margin: { left: margin, right: margin },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Step Transitions
  addSectionTitle("Step Transitions:", 12);
  yPosition += 3;

  autoTable(doc, {
    startY: yPosition,
    head: [["From", "To", "Condition"]],
    body: [
      ["Step 1", "Step 2", "Order found successfully"],
      ["Step 2", "Step 3", "Customer confirms order"],
      ["Step 3", "Step 4", "Problem type selected"],
      ["Step 3", "ItemNotReceivedFlow", "If 'not_received' selected"],
      ["Step 4", "Step 5", "Refund selected (evidence required)"],
      ["Step 4", "Step 6", "Store Credit selected (direct)"],
      ["Step 5", "Step 6", "Evidence submitted"],
      ["Step 6", "Step 1", "Start new request"],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [74, 144, 226], textColor: 255 },
    margin: { left: margin, right: margin },
  });

  // ===== PAGE 3: PROBLEM TYPES =====
  doc.addPage();
  yPosition = margin;

  addSectionTitle("3. Problem Types", 16);
  yPosition += 5;

  problemTypes.forEach((problem, index) => {
    checkPageBreak(50);

    doc.setFillColor(248, 248, 248);
    doc.roundedRect(margin, yPosition, pageWidth - margin * 2, 45, 3, 3, "F");

    // Problem Title
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(33, 33, 33);
    doc.text(`${index + 1}. ${problem.name}`, margin + 5, yPosition + 8);

    // Key
    doc.setFontSize(8);
    doc.setFont("courier", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`key: "${problem.key}"`, margin + 5, yPosition + 14);

    // Description
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(66, 66, 66);
    const descLines = doc.splitTextToSize(problem.description, pageWidth - margin * 2 - 15);
    descLines.forEach((line: string, i: number) => {
      doc.text(line, margin + 5, yPosition + 20 + i * 4);
    });

    // Evidence Required
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Evidence Required:", margin + 5, yPosition + 32);
    doc.setFont("helvetica", "normal");

    problem.evidenceRequired.forEach((evidence, i) => {
      doc.text(`• ${evidence}`, margin + 10, yPosition + 37 + i * 4);
    });

    yPosition += 50;
  });

  // ===== PAGE 4: RESOLUTION OPTIONS =====
  doc.addPage();
  yPosition = margin;

  addSectionTitle("4. Resolution Options", 16);
  addParagraph(
    "The system is designed to encourage Store Credit selection through strategic UX. Store Credit is presented as the 'best choice' with a 10% bonus, while Refund requires evidence collection."
  );
  yPosition += 10;

  resolutionOptions.forEach((option) => {
    checkPageBreak(60);

    // Option Box
    const isCredit = option.type === "credit";
    if (isCredit) {
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(1);
    } else {
      doc.setFillColor(248, 248, 248);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
    }
    doc.roundedRect(margin, yPosition, pageWidth - margin * 2, 50, 3, 3, "FD");

    // Title
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(33, 33, 33);
    doc.text(option.name, margin + 5, yPosition + 10);

    if (isCredit) {
      doc.setFillColor(16, 185, 129);
      doc.roundedRect(margin + 60, yPosition + 5, 40, 7, 2, 2, "F");
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text("⭐ BEST CHOICE", margin + 64, yPosition + 10);
    }

    // Description
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(66, 66, 66);
    doc.text(option.description, margin + 5, yPosition + 18);

    // Benefits
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Benefits:", margin + 5, yPosition + 28);
    doc.setFont("helvetica", "normal");

    option.benefits.forEach((benefit, i) => {
      doc.text(`✓ ${benefit}`, margin + 10, yPosition + 34 + i * 4);
    });

    yPosition += 58;
  });

  // ===== PAGE 5: TECHNICAL REFERENCE =====
  doc.addPage();
  yPosition = margin;

  addSectionTitle("5. Technical Reference", 16);
  yPosition += 5;

  // Main States
  addSectionTitle("Main States:", 12);
  autoTable(doc, {
    startY: yPosition,
    head: [["State", "Type", "Description"]],
    body: [
      ["currentStep", "number (1-6)", "Current step in the flow"],
      ["order", "Order | null", "Order data from validation"],
      ["route", "string", "Selected problem type key"],
      ["decision", "'credit' | 'refund' | null", "Resolution choice"],
      ["description", "string", "Customer's problem description"],
      ["photos", "string[]", "Uploaded evidence photos"],
      ["creditCode", "string", "Generated store credit code"],
      ["protocol", "string", "Generated refund protocol"],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [74, 144, 226], textColor: 255 },
    columnStyles: {
      0: { font: "courier", fontSize: 8 },
      1: { font: "courier", fontSize: 8 },
    },
    margin: { left: margin, right: margin },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Key Handlers
  addSectionTitle("Key Handlers:", 12);
  autoTable(doc, {
    startY: yPosition,
    head: [["Handler", "Purpose"]],
    body: [
      ["handleValidation()", "Validates order number + email"],
      ["handleOrderConfirmation()", "Confirms order selection"],
      ["selectRoute(key)", "Sets the problem type"],
      ["selectDecision(choice)", "Sets credit or refund choice"],
      ["handleEvidenceSubmit()", "Processes evidence submission"],
      ["resetFlow()", "Resets all state to initial values"],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [74, 144, 226], textColor: 255 },
    columnStyles: { 0: { font: "courier", fontSize: 8, cellWidth: 50 } },
    margin: { left: margin, right: margin },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // File Structure
  addSectionTitle("File Structure:", 12);
  const files = [
    "src/pages/proxy/ResolutionHub.tsx    → Main component",
    "src/proxy-index.tsx                  → Entry point",
    "src/proxy.css                        → Isolated styles",
    "src/components/ItemNotReceivedFlow   → Special flow component",
    "proxy.html                           → Local development",
    "supabase/functions/app-proxy-render  → Edge function",
  ];
  files.forEach((file) => {
    checkPageBreak(6);
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.text(file, margin + 5, yPosition);
    yPosition += 5;
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Resolution Hub Documentation - Page ${i} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  // Save the PDF
  doc.save(`Resolution-Hub-Documentation-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
