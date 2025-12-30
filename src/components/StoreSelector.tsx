import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUserData } from "@/hooks/useUserData";

export function StoreSelector() {
  const [open, setOpen] = useState(false);
  const { storeName, loading } = useUserData();
  const navigate = useNavigate();

  const displayStoreName = loading ? "Loading..." : (storeName || "My Store");
  const storeInitial = displayStoreName.charAt(0).toUpperCase();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between bg-[#252525] border border-white/10 hover:bg-[#2a2a2a] text-white h-12 px-3"
        >
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
              {storeInitial}
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xs text-white/90 font-medium truncate max-w-[140px]">{displayStoreName}</span>
              <span className="text-[10px] text-white/50">Active store</span>
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 text-white/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[228px] p-0 bg-[#252525] border border-white/10 shadow-xl shadow-black/30"
        align="start"
        side="bottom"
        sideOffset={8}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="px-3 py-2.5 border-b border-white/10">
          <span className="text-[11px] font-medium text-white/40 uppercase tracking-wide">
            Switch Store
          </span>
        </div>

        {/* Store List */}
        <div className="py-1.5">
          {/* Active Store */}
          <button
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors bg-white/5"
          >
            <div className="h-7 w-7 rounded flex items-center justify-center text-white font-semibold text-xs bg-emerald-600">
              {storeInitial}
            </div>
            <div className="flex flex-col items-start flex-1 min-w-0">
              <span className="text-xs text-white/90 font-medium truncate w-full">
                {displayStoreName}
              </span>
              <span className="text-[10px] text-white/40">Active store</span>
            </div>
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </button>

          {/* Inactive Example Store */}
          <button
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-white/5 opacity-50 cursor-not-allowed"
            disabled
          >
            <div className="h-7 w-7 rounded flex items-center justify-center text-white font-semibold text-xs bg-gray-500">
              E
            </div>
            <div className="flex flex-col items-start flex-1 min-w-0">
              <span className="text-xs text-white/90 font-medium truncate w-full">
                Example Store
              </span>
              <span className="text-[10px] text-white/40">Inactive</span>
            </div>
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10" />

        {/* Add New Store Button */}
        <div className="p-1.5">
          <button
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-left transition-colors hover:bg-white/5 group"
            onClick={() => {
              setOpen(false);
              navigate("/integracoes");
            }}
          >
            <div className="h-7 w-7 rounded border border-dashed border-white/30 flex items-center justify-center group-hover:border-emerald-500/50 transition-colors">
              <Plus className="h-4 w-4 text-white/50 group-hover:text-emerald-500 transition-colors" />
            </div>
            <span className="text-xs text-white/70 font-medium group-hover:text-emerald-500 transition-colors">
              Add New Store
            </span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
