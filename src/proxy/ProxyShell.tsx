type ProxyData = {
  shop?: string | null;
  customerId?: string | null;
  pathPrefix?: string | null;
  locale?: string | null;
};

type Props = {
  data: ProxyData;
};

const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-slate-600">{label}</span>
    <span className="font-semibold text-slate-900">{value ?? "—"}</span>
  </div>
);

const ProxyShell = ({ data }: Props) => {
  return (
    <div className="min-h-[40vh] bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl p-6 space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Carregado via Shopify App Proxy
          </p>
          <h1 className="text-2xl font-semibold">Resolution Hub</h1>
          <p className="text-sm text-slate-600">
            Este esqueleto React monta no root isolado para não interferir no tema da loja.
          </p>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-base font-semibold text-slate-900">Contexto recebido</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              Seguro por HMAC
            </span>
          </div>

          <div className="space-y-3">
            <InfoRow label="Loja" value={data.shop ?? "desconhecida"} />
            <InfoRow label="Cliente logado" value={data.customerId} />
            <InfoRow label="Prefixo do proxy" value={data.pathPrefix} />
            <InfoRow label="Locale" value={data.locale} />
          </div>
        </section>

        <footer className="text-xs text-slate-500">
          Ajuste este componente para renderizar o Resolution Hub real (dados, rotas e UI).
        </footer>
      </div>
    </div>
  );
};

export default ProxyShell;


