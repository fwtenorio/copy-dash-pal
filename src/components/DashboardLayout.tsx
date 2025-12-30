import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { DateRange } from "react-day-picker";
import { useLocation } from "react-router-dom";

interface DashboardLayoutProps {
  children: React.ReactNode;
  onDateRangeChange?: (range: DateRange | undefined) => void;
}

function DashboardContent({ children, onDateRangeChange }: DashboardLayoutProps) {
  const { open } = useSidebar();
  const location = useLocation();
  
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <main className={`flex-1 p-6 lg:p-8 bg-white transition-all duration-300 ${!open ? 'ml-4 lg:ml-8' : ''}`}>
        <div className="w-full">
          {children}
        </div>
      </main>
      <footer 
        className="w-full"
        style={{ backgroundColor: "#F8F8F9" }}
      >
        <div 
          className="w-full max-w-[1280px] mx-auto px-6 lg:px-8 py-4 text-center text-[#6A7280]"
          style={{ fontSize: "10px" }}
        >
          <a 
            href="https://chargemind.io/privacy" 
            className="hover:underline focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#A1A1AA]"
          >
            Privacy Policy
          </a>
          <span className="mx-2">|</span>
          <a 
            href="https://chargemind.io/terms" 
            className="hover:underline focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#A1A1AA]"
          >
            Terms of Service
          </a>
        </div>
      </footer>
    </div>
  );
}

export function DashboardLayout({ children, onDateRangeChange }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <DashboardSidebar />
        <DashboardContent onDateRangeChange={onDateRangeChange}>
          {children}
        </DashboardContent>
      </div>
    </SidebarProvider>
  );
}
