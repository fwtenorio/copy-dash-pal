import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Plus, 
  Trash2, 
  GripVertical,
  Package,
  AlertTriangle,
  RotateCcw,
  CreditCard,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/safeClient";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export interface EvidenceFieldOption {
  value: string;
  label: string;
}

export interface EvidenceFieldConfig {
  id: string;
  client_id: string;
  problem_type: string;
  field_key: string;
  field_label: string;
  field_type: string;
  is_predefined: boolean;
  is_visible: boolean;
  is_required: boolean;
  options: EvidenceFieldOption[] | null;
  display_order: number;
}

// Helper to parse options from Json
function parseOptions(options: unknown): EvidenceFieldOption[] | null {
  if (!options) return null;
  if (Array.isArray(options)) {
    return options as EvidenceFieldOption[];
  }
  return null;
}

// Helper to convert DB record to EvidenceFieldConfig
function toFieldConfig(record: any): EvidenceFieldConfig {
  return {
    id: record.id,
    client_id: record.client_id,
    problem_type: record.problem_type,
    field_key: record.field_key,
    field_label: record.field_label,
    field_type: record.field_type,
    is_predefined: record.is_predefined,
    is_visible: record.is_visible,
    is_required: record.is_required,
    options: parseOptions(record.options),
    display_order: record.display_order,
  };
}

// Predefined fields per category
const PREDEFINED_FIELDS: Record<string, Omit<EvidenceFieldConfig, 'id' | 'client_id'>[]> = {
  not_received: [
    { problem_type: 'not_received', field_key: 'description', field_label: 'Describe the problem in detail', field_type: 'textarea', is_predefined: true, is_visible: true, is_required: true, options: null, display_order: 0 },
    { problem_type: 'not_received', field_key: 'checked_neighbors', field_label: 'Did you check with neighbors, reception, or family members?', field_type: 'checkbox', is_predefined: true, is_visible: true, is_required: false, options: null, display_order: 1 },
    { problem_type: 'not_received', field_key: 'checked_carrier', field_label: 'Did you contact the carrier?', field_type: 'checkbox', is_predefined: true, is_visible: true, is_required: false, options: null, display_order: 2 },
    { problem_type: 'not_received', field_key: 'photos', field_label: 'Delivery area photo or carrier proof', field_type: 'file', is_predefined: true, is_visible: true, is_required: true, options: null, display_order: 3 },
  ],
  defect: [
    { problem_type: 'defect', field_key: 'description', field_label: 'Describe the problem in detail', field_type: 'textarea', is_predefined: true, is_visible: true, is_required: true, options: null, display_order: 0 },
    { problem_type: 'defect', field_key: 'defect_type', field_label: 'What is the problem?', field_type: 'select', is_predefined: true, is_visible: true, is_required: true, options: [
      { value: 'danificado', label: 'Damaged' },
      { value: 'diferente', label: 'Different from advertised' },
      { value: 'nao_funciona', label: "Doesn't work" },
      { value: 'outro', label: 'Other' },
    ], display_order: 1 },
    { problem_type: 'defect', field_key: 'photos', field_label: 'Product photos showing the issue', field_type: 'file', is_predefined: true, is_visible: true, is_required: true, options: null, display_order: 2 },
  ],
  regret: [
    { problem_type: 'regret', field_key: 'description', field_label: 'Describe the problem in detail', field_type: 'textarea', is_predefined: true, is_visible: true, is_required: true, options: null, display_order: 0 },
    { problem_type: 'regret', field_key: 'product_opened', field_label: 'Was the product opened/used?', field_type: 'radio', is_predefined: true, is_visible: true, is_required: true, options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], display_order: 1 },
    { problem_type: 'regret', field_key: 'product_packaging', field_label: 'Is the product in original packaging?', field_type: 'radio', is_predefined: true, is_visible: true, is_required: true, options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], display_order: 2 },
    { problem_type: 'regret', field_key: 'regret_reason', field_label: 'Reason for return', field_type: 'select', is_predefined: true, is_visible: true, is_required: true, options: [
      { value: 'mudei_ideia', label: 'Changed my mind' },
      { value: 'nao_serviu', label: "Didn't fit" },
      { value: 'nao_gostei', label: "Didn't like it" },
      { value: 'outro', label: 'Other' },
    ], display_order: 3 },
    { problem_type: 'regret', field_key: 'photos', field_label: 'Product photos', field_type: 'file', is_predefined: true, is_visible: true, is_required: true, options: null, display_order: 4 },
  ],
  fraud: [
    { problem_type: 'fraud', field_key: 'description', field_label: 'Describe the problem in detail', field_type: 'textarea', is_predefined: true, is_visible: true, is_required: true, options: null, display_order: 0 },
    { problem_type: 'fraud', field_key: 'recognize_address', field_label: 'Do you recognize this address?', field_type: 'text', is_predefined: true, is_visible: true, is_required: true, options: null, display_order: 1 },
    { problem_type: 'fraud', field_key: 'family_purchase', field_label: 'Was this purchase made by a family member?', field_type: 'radio', is_predefined: true, is_visible: true, is_required: true, options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], display_order: 2 },
    { problem_type: 'fraud', field_key: 'chargeback_initiated', field_label: 'Have you already disputed with your card/bank?', field_type: 'radio', is_predefined: true, is_visible: true, is_required: true, options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], display_order: 3 },
    { problem_type: 'fraud', field_key: 'chargeback_protocol', field_label: 'Dispute protocol', field_type: 'text', is_predefined: true, is_visible: true, is_required: false, options: null, display_order: 4 },
    { problem_type: 'fraud', field_key: 'photos', field_label: 'Proof (card statement, police report, etc)', field_type: 'file', is_predefined: true, is_visible: true, is_required: true, options: null, display_order: 5 },
  ],
};

const CATEGORY_INFO: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
  not_received: {
    label: 'Product Not Received',
    icon: <Package className="h-5 w-5" />,
    description: 'Fields shown when customer reports they did not receive their order',
  },
  defect: {
    label: 'Product Defect/Quality',
    icon: <AlertTriangle className="h-5 w-5" />,
    description: 'Fields shown when customer reports a damaged or defective product',
  },
  regret: {
    label: 'Return/Exchange',
    icon: <RotateCcw className="h-5 w-5" />,
    description: 'Fields shown when customer wants to return or exchange a product',
  },
  fraud: {
    label: 'Charge Question',
    icon: <CreditCard className="h-5 w-5" />,
    description: 'Fields shown when customer questions a charge on their statement',
  },
};

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'select', label: 'Dropdown Select' },
  { value: 'file', label: 'File Upload' },
];

interface AddFieldModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (field: Partial<EvidenceFieldConfig>) => void;
  problemType: string;
}

function AddFieldModal({ open, onClose, onSave, problemType }: AddFieldModalProps) {
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState("text");
  const [isRequired, setIsRequired] = useState(false);
  const [options, setOptions] = useState<string[]>([""]);

  const handleSave = () => {
    if (!label.trim()) {
      toast.error("Field label is required");
      return;
    }

    const fieldKey = `custom_${Date.now()}`;
    const parsedOptions = (fieldType === 'select' || fieldType === 'radio')
      ? options.filter(o => o.trim()).map(o => ({ value: o.toLowerCase().replace(/\s+/g, '_'), label: o }))
      : null;

    onSave({
      problem_type: problemType,
      field_key: fieldKey,
      field_label: label.trim(),
      field_type: fieldType,
      is_predefined: false,
      is_visible: true,
      is_required: isRequired,
      options: parsedOptions,
      display_order: 999,
    });

    // Reset form
    setLabel("");
    setFieldType("text");
    setIsRequired(false);
    setOptions([""]);
    onClose();
  };

  const addOption = () => setOptions([...options, ""]);
  const removeOption = (index: number) => setOptions(options.filter((_, i) => i !== index));
  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Custom Field</DialogTitle>
          <DialogDescription>
            Create a new field for the {CATEGORY_INFO[problemType]?.label || problemType} category.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="field-label">Field Label</Label>
            <Input
              id="field-label"
              placeholder="e.g., Order confirmation screenshot"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Field Type</Label>
            <Select value={fieldType} onValueChange={setFieldType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(fieldType === 'select' || fieldType === 'radio') && (
            <div className="space-y-2">
              <Label>Options</Label>
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                  />
                  {options.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addOption}>
                <Plus className="h-4 w-4 mr-1" /> Add Option
              </Button>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-required"
              checked={isRequired}
              onCheckedChange={(checked) => setIsRequired(checked === true)}
            />
            <Label htmlFor="is-required" className="font-normal">
              This field is required
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Add Field</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper to generate local fallback fields when DB fails
function generateLocalFallbackFields(cId: string): EvidenceFieldConfig[] {
  const fallbackFields: EvidenceFieldConfig[] = [];
  for (const [, predefinedFields] of Object.entries(PREDEFINED_FIELDS)) {
    for (const field of predefinedFields) {
      fallbackFields.push({
        id: `local_${field.problem_type}_${field.field_key}`,
        client_id: cId,
        problem_type: field.problem_type,
        field_key: field.field_key,
        field_label: field.field_label,
        field_type: field.field_type,
        is_predefined: field.is_predefined,
        is_visible: field.is_visible,
        is_required: field.is_required,
        options: field.options,
        display_order: field.display_order,
      });
    }
  }
  return fallbackFields;
}

export function EvidenceFieldEditor() {
  const { t } = useTranslation();
  const [fields, setFields] = useState<EvidenceFieldConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalCategory, setAddModalCategory] = useState<string>("");
  const [usingLocalFallback, setUsingLocalFallback] = useState(false);

  const fetchFields = useCallback(async () => {
    try {
      setLoading(true);
      setUsingLocalFallback(false);
      console.log("[EvidenceFieldEditor] Starting fetchFields...");
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log("[EvidenceFieldEditor] Auth user:", user?.id, "Error:", authError);
      
      if (authError) {
        console.error("[EvidenceFieldEditor] Auth error details:", JSON.stringify(authError, null, 2));
        toast.error(`Auth error: ${authError.message}`);
        return;
      }
      
      if (!user) {
        console.log("[EvidenceFieldEditor] No user found, returning early");
        toast.error("No authenticated user found. Please log in.");
        return;
      }

      // Fetch client_id from users table
      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("client_id")
        .eq("id", user.id)
        .maybeSingle();

      console.log("[EvidenceFieldEditor] User row:", userRow, "Error:", userError);

      if (userError) {
        console.error("[EvidenceFieldEditor] User query error:", JSON.stringify(userError, null, 2));
        toast.error(`Failed to get user data: ${userError.message}`);
        return;
      }

      if (!userRow?.client_id) {
        console.log("[EvidenceFieldEditor] No client_id found");
        toast.error("User is not linked to any company");
        return;
      }
      
      setClientId(userRow.client_id);
      const currentClientId = userRow.client_id;

      const { data, error } = await supabase
        .from("evidence_field_configs")
        .select("*")
        .eq("client_id", currentClientId)
        .order("display_order", { ascending: true });

      console.log("[EvidenceFieldEditor] Evidence fields fetched:", data?.length, "Error:", error);

      if (error) {
        console.error("[EvidenceFieldEditor] Fetch error details:", JSON.stringify(error, null, 2));
        throw error;
      }

      // If no data, seed with predefined fields
      if (!data || data.length === 0) {
        console.log("[EvidenceFieldEditor] No fields found, seeding predefined fields...");
        await seedPredefinedFields(currentClientId);
      } else {
        console.log("[EvidenceFieldEditor] Setting fields:", data.length);
        setFields(data.map(toFieldConfig));
      }
    } catch (error: any) {
      console.error("[EvidenceFieldEditor] Error fetching evidence fields:", error);
      console.error("[EvidenceFieldEditor] Error details:", JSON.stringify(error, null, 2));
      
      const errorMessage = error?.message || error?.details || "Unknown error";
      toast.error(`Failed to load evidence fields: ${errorMessage}`);
      
      // Fallback: show local predefined fields so UI isn't empty
      if (clientId) {
        console.log("[EvidenceFieldEditor] Using local fallback fields");
        setFields(generateLocalFallbackFields(clientId));
        setUsingLocalFallback(true);
      }
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const seedPredefinedFields = async (cId: string) => {
    try {
      const allFieldsToInsert: any[] = [];
      
      for (const [, predefinedFields] of Object.entries(PREDEFINED_FIELDS)) {
        for (const field of predefinedFields) {
          allFieldsToInsert.push({
            client_id: cId,
            problem_type: field.problem_type,
            field_key: field.field_key,
            field_label: field.field_label,
            field_type: field.field_type,
            is_predefined: field.is_predefined,
            is_visible: field.is_visible,
            is_required: field.is_required,
            options: field.options,
            display_order: field.display_order,
          });
        }
      }

      console.log("[EvidenceFieldEditor] Seeding", allFieldsToInsert.length, "predefined fields...");

      const { data, error } = await supabase
        .from("evidence_field_configs")
        .insert(allFieldsToInsert)
        .select();

      if (error) {
        console.error("[EvidenceFieldEditor] Seed error details:", JSON.stringify(error, null, 2));
        throw error;
      }
      
      setFields((data || []).map(toFieldConfig));
      toast.success("Evidence fields initialized with defaults");
    } catch (error: any) {
      console.error("[EvidenceFieldEditor] Error seeding predefined fields:", error);
      const errorMessage = error?.message || error?.details || "Unknown error";
      toast.error(`Failed to save defaults: ${errorMessage}`);
      
      // Use local fallback so UI isn't empty
      console.log("[EvidenceFieldEditor] Seed failed, using local fallback");
      setFields(generateLocalFallbackFields(cId));
      setUsingLocalFallback(true);
    }
  };

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const toggleFieldVisibility = async (fieldId: string, isVisible: boolean) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("evidence_field_configs")
        .update({ is_visible: isVisible })
        .eq("id", fieldId);

      if (error) throw error;

      setFields(prev => prev.map(f => f.id === fieldId ? { ...f, is_visible: isVisible } : f));
      toast.success(isVisible ? "Field shown" : "Field hidden");
    } catch (error) {
      console.error("Error updating field visibility:", error);
      toast.error("Failed to update field");
    } finally {
      setSaving(false);
    }
  };

  const addCustomField = async (fieldData: Partial<EvidenceFieldConfig>) => {
    if (!clientId) return;

    try {
      setSaving(true);
      
      // Get the max display_order for this problem_type
      const existingFields = fields.filter(f => f.problem_type === fieldData.problem_type);
      const maxOrder = existingFields.length > 0 
        ? Math.max(...existingFields.map(f => f.display_order)) 
        : -1;

      const newFieldToInsert = {
        client_id: clientId,
        problem_type: fieldData.problem_type!,
        field_key: fieldData.field_key!,
        field_label: fieldData.field_label!,
        field_type: fieldData.field_type!,
        is_predefined: fieldData.is_predefined ?? false,
        is_visible: fieldData.is_visible ?? true,
        is_required: fieldData.is_required ?? false,
        options: fieldData.options,
        display_order: maxOrder + 1,
      };

      const { data, error } = await supabase
        .from("evidence_field_configs")
        .insert(newFieldToInsert as any)
        .select()
        .single();

      if (error) throw error;

      setFields(prev => [...prev, toFieldConfig(data)]);
      toast.success("Custom field added");
    } catch (error) {
      console.error("Error adding custom field:", error);
      toast.error("Failed to add custom field");
    } finally {
      setSaving(false);
    }
  };

  const deleteCustomField = async (fieldId: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("evidence_field_configs")
        .delete()
        .eq("id", fieldId);

      if (error) throw error;

      setFields(prev => prev.filter(f => f.id !== fieldId));
      toast.success("Field deleted");
    } catch (error) {
      console.error("Error deleting field:", error);
      toast.error("Failed to delete field");
    } finally {
      setSaving(false);
    }
  };

  const openAddModal = (problemType: string) => {
    setAddModalCategory(problemType);
    setAddModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const categories = Object.keys(CATEGORY_INFO);

  return (
    <div className="space-y-6">
      {usingLocalFallback && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-full bg-amber-100">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h4 className="font-medium text-amber-900">Showing Local Defaults</h4>
              <p className="text-sm text-amber-700 mt-1">
                Could not load or save configuration to the database. Showing default fields locally. 
                Changes will not persist until the connection is restored.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => fetchFields()}
              >
                <RotateCcw className="h-3 w-3 mr-1" /> Retry Connection
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-full bg-blue-100">
            <Eye className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-blue-900">Customize Evidence Collection</h4>
            <p className="text-sm text-blue-700 mt-1">
              Show or hide predefined fields and add custom questions for each problem category. 
              Changes will reflect immediately in the customer resolution portal.
            </p>
          </div>
        </div>
      </div>

      <Accordion type="multiple" className="space-y-4" defaultValue={categories}>
        {categories.map((category) => {
          const categoryInfo = CATEGORY_INFO[category];
          const categoryFields = fields
            .filter(f => f.problem_type === category)
            .sort((a, b) => a.display_order - b.display_order);
          const predefinedFields = categoryFields.filter(f => f.is_predefined);
          const customFields = categoryFields.filter(f => !f.is_predefined);

          return (
            <AccordionItem
              key={category}
              value={category}
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    {categoryInfo.icon}
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{categoryInfo.label}</p>
                    <p className="text-sm text-muted-foreground font-normal">
                      {categoryFields.filter(f => f.is_visible).length} of {categoryFields.length} fields visible
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm text-muted-foreground mb-4">{categoryInfo.description}</p>

                {/* Predefined Fields */}
                <div className="space-y-2 mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Predefined Fields
                  </h4>
                  {predefinedFields.map((field) => (
                    <div
                      key={field.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                        <div>
                          <p className="text-sm font-medium">{field.field_label}</p>
                          <p className="text-xs text-muted-foreground">
                            {FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}
                            {field.is_required && <span className="text-red-500 ml-1">• Required</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={field.is_visible}
                          onCheckedChange={(checked) => toggleFieldVisibility(field.id, checked)}
                          disabled={saving}
                        />
                        {field.is_visible ? (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Custom Fields */}
                {customFields.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Custom Fields
                    </h4>
                    {customFields.map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                          <div>
                            <p className="text-sm font-medium">{field.field_label}</p>
                            <p className="text-xs text-muted-foreground">
                              {FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}
                              {field.is_required && <span className="text-red-500 ml-1">• Required</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={field.is_visible}
                            onCheckedChange={(checked) => toggleFieldVisibility(field.id, checked)}
                            disabled={saving}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteCustomField(field.id)}
                            disabled={saving}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Custom Field Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed"
                  onClick={() => openAddModal(category)}
                  disabled={saving}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Field
                </Button>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <AddFieldModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={addCustomField}
        problemType={addModalCategory}
      />
    </div>
  );
}
