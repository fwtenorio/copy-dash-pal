import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FlaskConical, Database, Server, Link2 } from "lucide-react";
import { useMockDataContext } from "@/contexts/MockDataContext";
import { cn } from "@/lib/utils"; 
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
   
export default function Admin() {
  const { useMockData, setUseMockData, mockChargebackRate, setMockChargebackRate } = useMockDataContext();
  const navigate = useNavigate();

  const handleSliderChange = (value: number[]) => {
    const next = Number(value[0].toFixed(2));
    setMockChargebackRate(next);
  };

  const presets = [0.35, 0.65, 1.1, 1.8, 2.5];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title="Admin" subtitle="System configuration and data source management" />

        <div className="space-y-6">
          {/* System Data Source Section */}
          <Card className="p-0 overflow-hidden">
            <div className="px-4 py-4 bg-[#F9F9F9] border-b border-[#E5E7EB]">
              <div className="flex items-center gap-3">
                <div className="p-2 border border-[#E5E7EB] rounded-lg bg-white">
                  <Server className="h-5 w-5 text-[#9CA3AF]" />
                </div>
                <div>
                  <h3 className="text-[15px] font-medium text-[#1A1A1A]">System Data Source</h3>
                  <p className="text-[13px] font-normal mt-1 text-muted-foreground">
                    Choose between test data or live production data from your integrations
                  </p>
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Test Mode Card */}
                <button
                  onClick={() => setUseMockData(true)}
                  className={cn(
                    "p-6 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md",
                    useMockData
                      ? "border-[#19976F] bg-[#19976F]/5"
                      : "border-[#E5E7EB] bg-white hover:border-[#19976F]/50"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "p-3 rounded-lg",
                        useMockData ? "bg-[#19976F]/10" : "bg-[#F9F9F9]"
                      )}
                    >
                      <FlaskConical
                        className={cn(
                          "h-6 w-6",
                          useMockData ? "text-[#19976F]" : "text-[#9CA3AF]"
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <h4
                        className={cn(
                          "text-[15px] font-semibold mb-1",
                          useMockData ? "text-[#19976F]" : "text-[#1A1A1A]"
                        )}
                      >
                        Test Mode (Mock Data)
                      </h4>
                      <p className="text-[13px] text-muted-foreground">
                        Use static mock data for testing UI without API calls. Perfect for demos and development.
                      </p>
                    </div>
                    {useMockData && (
                      <div className="w-5 h-5 rounded-full bg-[#19976F] flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>

                {/* Production Mode Card */}
                <button
                  onClick={() => setUseMockData(false)}
                  className={cn(
                    "p-6 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md",
                    !useMockData
                      ? "border-[#19976F] bg-[#19976F]/5"
                      : "border-[#E5E7EB] bg-white hover:border-[#19976F]/50"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "p-3 rounded-lg",
                        !useMockData ? "bg-[#19976F]/10" : "bg-[#F9F9F9]"
                      )}
                    >
                      <Database
                        className={cn(
                          "h-6 w-6",
                          !useMockData ? "text-[#19976F]" : "text-[#9CA3AF]"
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <h4
                        className={cn(
                          "text-[15px] font-semibold mb-1",
                          !useMockData ? "text-[#19976F]" : "text-[#1A1A1A]"
                        )}
                      >
                        Production Mode (Real Data)
                      </h4>
                      <p className="text-[13px] text-muted-foreground">
                        Fetch real data from Shopify and other integrations configured in the Integrations page.
                      </p>
                    </div>
                    {!useMockData && (
                      <div className="w-5 h-5 rounded-full bg-[#19976F] flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-[12px] text-muted-foreground">
                  Your selection is saved automatically and persists across sessions.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/integracoes")}
                  className="text-[13px] gap-2"
                >
                  <Link2 className="h-4 w-4" />
                  Manage Integrations
                </Button>
              </div>
            </CardContent>
          </Card>

          {useMockData && (
            <Card className="p-0 overflow-hidden">
              <CardHeader className="pb-0">
                <CardTitle>Simular chargeback no dashboard</CardTitle>
                <CardDescription>
                  Ajuste a taxa de chargeback usada em <strong>AI System Monitor &gt; Account Health</strong> quando os dados mockados estão ativos.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Taxa simulada</span>
                  <span className="font-mono font-semibold text-foreground">{(mockChargebackRate ?? 0.65).toFixed(2)}%</span>
                </div>

                <Slider
                  min={0}
                  max={3}
                  step={0.05}
                  value={[mockChargebackRate ?? 0.65]}
                  onValueChange={handleSliderChange}
                />

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span className="text-emerald-600">0.5%</span>
                  <span className="text-amber-600">1%</span>
                  <span className="text-red-600">3%</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {presets.map((preset) => (
                    <Button key={preset} variant="outline" size="sm" onClick={() => setMockChargebackRate(preset)}>
                      {preset.toFixed(2)}%
                    </Button>
                  ))}
                  <Button variant="ghost" size="sm" onClick={() => setMockChargebackRate(null)}>
                    Limpar simulação
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Esta simulação só afeta a camada mockada. Dados reais continuam inalterados.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Current Status Info */}
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-3 h-3 rounded-full",
                useMockData ? "bg-amber-500" : "bg-emerald-500"
              )} />
              <p className="text-[14px] text-[#1A1A1A]">
                <span className="font-medium">Current mode:</span>{" "}
                {useMockData ? (
                  <span className="text-amber-600">Test Mode - Using mock data</span>
                ) : (
                  <span className="text-emerald-600">Production Mode - Fetching real data from APIs</span>
                )}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
