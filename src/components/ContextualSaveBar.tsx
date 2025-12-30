import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface ContextualSaveBarProps {
  isDirty: boolean;
  onSave: () => void;
  onDiscard: () => void;
  isSaving?: boolean;
  saveText?: string;
  discardText?: string;
  unsavedText?: string;
}

export function ContextualSaveBar({
  isDirty,
  onSave,
  onDiscard,
  isSaving = false,
  saveText = "Save",
  discardText = "Discard",
  unsavedText = "Unsaved changes",
}: ContextualSaveBarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isDirty) {
      // Pequeno delay para animação suave
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isDirty]);

  if (!isDirty) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      }`}
    >
      {/* Floating Dock Container */}
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-2xl rounded-full px-6 py-3 min-w-[400px]">
        <div className="flex items-center justify-between gap-6">
          {/* Texto à esquerda */}
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm font-medium text-gray-700">{unsavedText}</span>
          </div>

          {/* Botões à direita */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDiscard}
              disabled={isSaving}
              className="text-gray-500 hover:text-gray-800 hover:bg-gray-100 h-8 px-3"
            >
              {discardText}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onSave}
              disabled={isSaving}
              className="bg-black text-white hover:bg-gray-800 rounded-full h-8 px-4 font-medium"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                saveText
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
