import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  RefreshCw,
  ArrowLeftRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/safeClient";
import { toast } from "sonner";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQData {
  refund: FAQItem[];
  exchange: FAQItem[];
}

const DEFAULT_FAQ: FAQData = {
  refund: [
    {
      id: "refund-1",
      question: "When will I receive my refund?",
      answer: "Within 10 business days, your bank may perform a small verification transaction to confirm your account details. Afterward, the full refund will be credited within 30 days. Depending on your bank or payment provider, it may take a few additional days for the refund to appear on your statement.",
    },
    {
      id: "refund-2",
      question: "Where will the refund appear on my statement?",
      answer: "It may appear as an adjustment to the original charge or as a separate credit entry.",
    },
    {
      id: "refund-3",
      question: "Why can't I see my refund yet?",
      answer: "Each bank and card network has its own processing times. For credit cards, the refund may only be visible in the next billing cycle.",
    },
    {
      id: "refund-4",
      question: "Is the refund automatic? Do I need to take any action?",
      answer: "No action is required. Once confirmed, the refund is automatically sent to the card originally used for the purchase.",
    },
    {
      id: "refund-5",
      question: "Can I receive the refund on a different card or bank account?",
      answer: "No. For security reasons, refunds are always issued to the same card used for payment.",
    },
    {
      id: "refund-6",
      question: "What happens if my card has expired or been canceled?",
      answer: "Even if your card has expired, the refund will be credited to the account linked to that card. In some cases, your bank may transfer the credit to a new card or directly to your account.",
    },
    {
      id: "refund-7",
      question: "Does the refund include taxes and fees?",
      answer: "Yes. We refund the total amount paid, including taxes and fees, unless otherwise specified in promotional policies.",
    },
    {
      id: "refund-8",
      question: "Can I track the status of my refund?",
      answer: "Once we have processed it, tracking depends entirely on your card issuer. If the maximum timeframe has passed, we recommend contacting your bank directly.",
    },
  ],
  exchange: [
    {
      id: "exchange-1",
      question: "Can I exchange for another model or color?",
      answer: "No, exchanges are only available for different sizes of the same product. We do not currently offer exchanges for different models, colors, or styles.",
    },
    {
      id: "exchange-2",
      question: "What sizes are available for exchange?",
      answer: "Available exchange sizes are S, M, L, XL, 2XL, and 3XL, subject to stock availability. Size availability may vary depending on the specific product.",
    },
    {
      id: "exchange-3",
      question: "How long does it take to receive the exchanged item?",
      answer: "Exchange processing and shipping may take up to 30 business days, depending on logistics and stock availability. You will receive tracking information as soon as your new item is shipped.",
    },
    {
      id: "exchange-4",
      question: "Do I need to return the original item before receiving the new one?",
      answer: "This depends on each individual case. If you are not asked to return the original item during the exchange request process, you may keep the product and receive a new one. Specific instructions based on your situation will be provided with your exchange confirmation.",
    },
  ],
};

export function FAQEditor() {
  const [faqData, setFaqData] = useState<FAQData>(DEFAULT_FAQ);
  const [initialFaqData, setInitialFaqData] = useState<FAQData>(DEFAULT_FAQ);
  const [activeTab, setActiveTab] = useState<"refund" | "exchange">("refund");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFAQData();
  }, []);

  const loadFAQData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: userRow } = await supabase
        .from("users")
        .select("client_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!userRow?.client_id) {
        setIsLoading(false);
        return;
      }

      const { data: clientData } = await supabase
        .from("clients")
        .select("faq_data")
        .eq("id", userRow.client_id)
        .maybeSingle();

      if (clientData?.faq_data) {
        const parsedData = clientData.faq_data as FAQData;
        setFaqData(parsedData);
        setInitialFaqData(parsedData);
      }
    } catch (err) {
      console.error("Error loading FAQ data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: userRow } = await supabase
        .from("users")
        .select("client_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!userRow?.client_id) throw new Error("Client not found");

      const { error } = await supabase
        .from("clients")
        .update({ faq_data: faqData as any })
        .eq("id", userRow.client_id);

      if (error) throw error;

      setInitialFaqData(faqData);
      toast.success("FAQ saved successfully!");
    } catch (err: any) {
      console.error("Error saving FAQ:", err);
      toast.error(err.message || "Failed to save FAQ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setFaqData(initialFaqData);
    toast.info("Changes discarded");
  };

  const isDirty = JSON.stringify(faqData) !== JSON.stringify(initialFaqData);

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const addQuestion = (category: "refund" | "exchange") => {
    const newItem: FAQItem = {
      id: `${category}-${Date.now()}`,
      question: "",
      answer: "",
    };
    setFaqData((prev) => ({
      ...prev,
      [category]: [...prev[category], newItem],
    }));
    setExpandedItems((prev) => new Set(prev).add(newItem.id));
  };

  const removeQuestion = (category: "refund" | "exchange", id: string) => {
    setFaqData((prev) => ({
      ...prev,
      [category]: prev[category].filter((item) => item.id !== id),
    }));
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const updateQuestion = (
    category: "refund" | "exchange",
    id: string,
    field: "question" | "answer",
    value: string
  ) => {
    setFaqData((prev) => ({
      ...prev,
      [category]: prev[category].map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const renderFAQList = (category: "refund" | "exchange") => {
    const items = faqData[category];

    return (
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No questions added yet.</p>
            <p className="text-sm">Click "Add Question" to get started.</p>
          </div>
        ) : (
          items.map((item, index) => (
            <Card key={item.id} className="border-border">
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleExpand(item.id)}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Q{index + 1}
                    </Badge>
                    <span className="font-medium text-foreground truncate">
                      {item.question || "New Question"}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeQuestion(category, item.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {expandedItems.has(item.id) ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              {expandedItems.has(item.id) && (
                <CardContent className="pt-0 pb-4 px-4 space-y-4 border-t border-border">
                  <div className="space-y-2 pt-4">
                    <Label className="text-sm font-medium">Question</Label>
                    <Input
                      value={item.question}
                      onChange={(e) =>
                        updateQuestion(category, item.id, "question", e.target.value)
                      }
                      placeholder="Enter the question..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Answer</Label>
                    <Textarea
                      value={item.answer}
                      onChange={(e) =>
                        updateQuestion(category, item.id, "answer", e.target.value)
                      }
                      placeholder="Enter the answer..."
                      className="min-h-[120px]"
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}

        <Button
          variant="outline"
          className="w-full border-dashed"
          onClick={() => addQuestion(category)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <HelpCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage FAQ questions displayed in the Resolution Hub for your customers.
                </p>
              </div>
            </div>
            {isDirty && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleDiscard} disabled={isSaving}>
                  Discard
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "refund" | "exchange")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="refund" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Refund Questions
                <Badge variant="secondary" className="ml-1">
                  {faqData.refund.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="exchange" className="flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4" />
                Exchange Questions
                <Badge variant="secondary" className="ml-1">
                  {faqData.exchange.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="refund" className="mt-0">
              {renderFAQList("refund")}
            </TabsContent>

            <TabsContent value="exchange" className="mt-0">
              {renderFAQList("exchange")}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
