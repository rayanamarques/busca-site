import { SitesTable } from "@/components/sites-table";
import { carregarPainel } from "@/lib/data";
import { fmtInt } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SitesPage() {
  const { sites } = await carregarPainel();
  const ativos = sites.filter((s) => s.qtdServicosAtivos > 0).length;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Sites</h1>
        <p className="text-sm text-muted">
          Visão consolidada por site (CAMADA_SITE): licenciador, ofensor, SLA, atualização,
          faturamento e score — {fmtInt(ativos)} ativos de {fmtInt(sites.length)}.
        </p>
      </header>

      <SitesTable sites={sites} />
    </div>
  );
}
