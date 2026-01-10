import React from "react";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";

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
  options: { value: string; label: string }[] | null;
  display_order: number;
}

interface DynamicEvidenceFieldProps {
  field: EvidenceFieldConfig;
  value: any;
  onChange: (value: any) => void;
  primaryColor: string;
  hexToRgba: (hex: string, alpha: number) => string;
}

export function DynamicEvidenceField({
  field,
  value,
  onChange,
  primaryColor,
  hexToRgba,
}: DynamicEvidenceFieldProps) {
  const { field_type, field_label, is_required, options, field_key } = field;

  const renderLabel = () => (
    <label className="chargemind-field-label block mb-2" style={{ fontWeight: '600' }}>
      {field_label} {is_required && <span className="text-red-600">*</span>}
    </label>
  );

  switch (field_type) {
    case 'text':
      return (
        <div>
          {renderLabel()}
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type your response"
            className="chargemind-input-field h-[60px] input-field"
            required={is_required}
          />
        </div>
      );

    case 'textarea':
      return (
        <div>
          {renderLabel()}
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Explain in detail what happened"
            className="chargemind-textarea-field w-full min-h-[120px]"
            required={is_required}
          />
          {field_key === 'description' && (
            <p className={`text-xs font-medium mt-1.5 chargemind-character-counter ${
              (value?.length || 0) < 10 ? "text-[#6B7280]" : "text-green-600"
            }`}>
              {value?.length || 0}/10 characters {(value?.length || 0) >= 10 && "✓"}
            </p>
          )}
        </div>
      );

    case 'checkbox':
      return (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <label className="flex items-start gap-2 chargemind-field-label" style={{ fontWeight: '500' }}>
            <input
              type="checkbox"
              checked={value ?? false}
              onChange={(e) => onChange(e.target.checked)}
              className="rounded"
              style={{ accentColor: primaryColor, marginTop: '2px', flexShrink: 0 }}
            />
            {field_label}
          </label>
        </div>
      );

    case 'radio':
      return (
        <div>
          <label className="chargemind-field-label block mb-2">
            {field_label} {is_required && <span className="text-red-600">*</span>}
          </label>
          <div className="flex gap-3">
            {(options || [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]).map((opt) => (
              <label key={opt.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={field_key}
                  checked={value === (opt.value === 'yes' || opt.value === 'true' ? true : opt.value === 'no' || opt.value === 'false' ? false : opt.value)}
                  onChange={() => {
                    if (opt.value === 'yes' || opt.value === 'true') {
                      onChange(true);
                    } else if (opt.value === 'no' || opt.value === 'false') {
                      onChange(false);
                    } else {
                      onChange(opt.value);
                    }
                  }}
                  style={{ accentColor: primaryColor }}
                />
                <span className="chargemind-step-subtitle">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      );

    case 'select':
      return (
        <div>
          <label className="chargemind-field-label block mb-1">
            {field_label} {is_required && <span className="text-red-600">*</span>}
          </label>
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="chargemind-select-field w-full"
            required={is_required}
          >
            <option value="">Select...</option>
            {(options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );

    case 'file':
      const files = value as File[] || [];
      return (
        <div>
          <label className="chargemind-field-label block mb-2">
            {field_label} {is_required && <span className="text-red-600">*</span>}
          </label>
          <label
            htmlFor={`upload-${field_key}`}
            className="relative flex flex-col items-center justify-center w-full min-h-[140px] border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 group"
            style={{
              borderColor: files.length > 0 ? hexToRgba(primaryColor, 0.4) : '#D1D5DB',
              backgroundColor: files.length > 0 ? hexToRgba(primaryColor, 0.03) : '#FAFAFA',
              boxShadow: files.length > 0 ? `0 1px 3px ${hexToRgba(primaryColor, 0.1)}` : 'none'
            }}
          >
            <input
              id={`upload-${field_key}`}
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={(e) => onChange(Array.from(e.target.files || []))}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center px-6 py-8">
              <div 
                className="p-4 rounded-full mb-3 transition-all"
                style={{ 
                  backgroundColor: files.length > 0 ? hexToRgba(primaryColor, 0.15) : hexToRgba(primaryColor, 0.1),
                  transform: files.length > 0 ? 'scale(1.05)' : 'scale(1)'
                }}
              >
                <Upload className="h-7 w-7" style={{ color: primaryColor }} />
              </div>
              <p className="mb-1.5 chargemind-field-label" style={{ fontWeight: '600', color: '#111827' }}>
                {files.length > 0 ? (
                  <span style={{ color: primaryColor }}>{files.length} file(s) selected</span>
                ) : (
                  <>
                    <span className="underline" style={{ color: primaryColor }}>Click to upload</span>
                    <span className="chargemind-step-subtitle"> or drag files here</span>
                  </>
                )}
              </p>
              <p className="chargemind-helper-text mt-1">PNG, JPG, GIF or PDF (max. 10MB per file)</p>
            </div>
          </label>
        </div>
      );

    default:
      return (
        <div>
          {renderLabel()}
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="chargemind-input-field h-[60px] input-field"
          />
        </div>
      );
  }
}
