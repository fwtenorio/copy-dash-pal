// components/SaveBar.tsx
import { Loader2 } from "lucide-react"; // ou seu icon set
import { useSidebar } from "@/components/ui/sidebar";

interface SaveBarProps {
  isOpen: boolean;
  isLoading: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

export function SaveBar({ isOpen, isLoading, onSave, onDiscard }: SaveBarProps) {
  if (!isOpen) return null;

  const { open: sidebarOpen, state } = useSidebar();
  // Ajuste para não cobrir o sidebar (largura 16rem expandido, ~3rem colapsado)
  // Adicionamos +4px de folga na esquerda para evitar sobreposição visual.
  const sidebarOffsetClass =
    state === "expanded"
      ? "md:left-[calc(16rem+4px)] md:w-[calc(100%-16rem-4px)]"
      : "md:left-[calc(3rem+4px)] md:w-[calc(100%-3rem-4px)]";

  return (
    <div
      className={`fixed bottom-0 left-0 z-50 w-full transition-transform duration-300 ease-out animate-in slide-in-from-bottom-full ${sidebarOffsetClass}`}
    >
      <div className="w-full border-t border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-6 py-3">
          <p className="text-sm font-medium text-gray-700">
            Unsaved changes
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={onDiscard}
              disabled={isLoading}
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-60"
            >
              Discard
            </button>

            <button
              onClick={onSave}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-md bg-[#19976F] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#157a58] disabled:opacity-60"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
