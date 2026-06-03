import { AlertTriangle, Building2, FileWarning, Clock, Receipt } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { KpiCard } from "@/components/kpi-card";
import { ChartLegend, DonutChart, HBarChart, type Datum } from "@/components/charts";
import { OfensorBadge, SlaBadge } from "@/components/domain-badges";
import { carregarPainel } from "@/lib/data";
import { LABEL_ETAPA, resumirPainel } from "@/lib/metrics";
import { fmtInt } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { sites, servicosInvalidos } = await carregarPainel();
  const r = resumirPainel(sites);

  const ofensorData: Datum[] = Object.entries(r.ofensores)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const etapaData: Datum[] = Object.entries(r.pendentesPorEtapa)
    .filter(([k]) => k !== "aquisicao")
    .map(([k, value]) => ({ name: LABEL_ETAPA[k as keyof typeof LABEL_ETAPA], value }));

  const cargaData: Datum[] = r.cargaPorLicenciador.map((c) => ({ name: c.nome, value: c.sites }));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard Executivo</h1>
          <p className="text-sm text-muted">
            Visão consolidada da operação de licenciamento — {fmtInt(r.totalSites)} sites na base.
          </p>
        </div>
        {servicosInvalidos > 0 && (
          <span className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700 ring-1 ring-amber-200">
            {servicosInvalidos} serviço(s) com dado não normalizado
          </span>
        )}
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard label="Sites ativos" value={r.sitesAtivos} hint={`de ${fmtInt(r.totalSites)} na base`} icon={<Building2 size={16} />} />
        <KpiCard label="SLA estourado" value={r.sla.estourado} tone="red" icon={<AlertTriangle size={16} />} />
        <KpiCard label="SLA em risco" value={r.sla.emRisco} tone="amber" icon={<FileWarning size={16} />} />
        <KpiCard label="Atualizações vencidas" value={r.atualizacoes.vencidas} tone="amber" icon={<Clock size={16} />} />
        <KpiCard label="A faturar" value={r.faturamento["A faturar"]} tone="green" icon={<Receipt size={16} />} />
      </section>

      {/* Gráficos */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Ofensor" subtitle="Quem está segurando o site" />
          <CardBody>
            <DonutChart data={ofensorData} />
            <ChartLegend data={ofensorData} />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Pendentes por etapa" subtitle="Serviços ativos por classificação" />
          <CardBody>
            <HBarChart data={etapaData} color="#2563eb" />
          </CardBody>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Carga por licenciador" subtitle="Sites ativos atribuídos (papéis válidos)" />
          <CardBody>
            <HBarChart data={cargaData} color="#7c3aed" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Faturamento" subtitle="Distribuição por situação" />
          <CardBody className="space-y-2">
            {Object.entries(r.faturamento).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-sm">
                <span>{k}</span>
                <span className="font-semibold tabular-nums">{v}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      </section>

      {/* Top prioridade */}
      <Card>
        <CardHeader
          title="Top prioridade"
          subtitle="Sites ordenados pelo score — o que atacar primeiro (seção 5.7)"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-5 py-2.5 font-medium">Site</th>
                <th className="px-5 py-2.5 font-medium">Cliente</th>
                <th className="px-5 py-2.5 font-medium">Licenciador</th>
                <th className="px-5 py-2.5 font-medium">Ofensor</th>
                <th className="px-5 py-2.5 font-medium">SLA</th>
                <th className="px-5 py-2.5 text-right font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {r.topPrioridade.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-2.5 font-medium">{s.id}</td>
                  <td className="px-5 py-2.5 text-muted">{s.cliente}</td>
                  <td className="px-5 py-2.5">{s.licenciador ?? "—"}</td>
                  <td className="px-5 py-2.5"><OfensorBadge ofensor={s.ofensorPrincipal} /></td>
                  <td className="px-5 py-2.5"><SlaBadge status={s.slaStatus} /></td>
                  <td className="px-5 py-2.5 text-right font-semibold tabular-nums">{fmtInt(s.score)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
