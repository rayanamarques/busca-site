"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Cliente, Ofensor, SiteCalculado, SlaStatus } from "@/domain";
import {
  AtualizacaoBadge,
  FaturamentoBadge,
  OfensorBadge,
  SlaBadge,
} from "@/components/domain-badges";
import { fmtData, fmtInt } from "@/lib/utils";

const CLIENTES: Cliente[] = ["TBSA", "WINITY", "IHS", "HIGHLINE", "SBA"];
const OFENSORES: Ofensor[] = ["BS", "Órgão", "Cliente", "Serv. Compl."];
const SLAS: SlaStatus[] = ["Estourado", "Em risco", "Em acompanhamento", "No prazo"];

export function SitesTable({ sites }: { sites: SiteCalculado[] }) {
  const [busca, setBusca] = useState("");
  const [cliente, setCliente] = useState<string>("");
  const [ofensor, setOfensor] = useState<string>("");
  const [sla, setSla] = useState<string>("");
  const [soAtivos, setSoAtivos] = useState(true);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return sites.filter((s) => {
      if (soAtivos && s.qtdServicosAtivos === 0) return false;
      if (cliente && s.cliente !== cliente) return false;
      if (ofensor && s.ofensorPrincipal !== ofensor) return false;
      if (sla && s.slaStatus !== sla) return false;
      if (q) {
        const hay = `${s.id} ${s.siteIdCliente ?? ""} ${s.municipio ?? ""} ${s.uf ?? ""} ${s.licenciador ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [sites, busca, cliente, ofensor, sla, soAtivos]);

  return (
    <div className="space-y-3">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar site, município, licenciador…"
            className="w-72 rounded-lg border border-border bg-card py-2 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
        <Select value={cliente} onChange={setCliente} placeholder="Cliente" options={CLIENTES} />
        <Select value={ofensor} onChange={setOfensor} placeholder="Ofensor" options={OFENSORES} />
        <Select value={sla} onChange={setSla} placeholder="SLA" options={SLAS} />
        <label className="flex items-center gap-1.5 text-sm text-muted">
          <input
            type="checkbox"
            checked={soAtivos}
            onChange={(e) => setSoAtivos(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          Só ativos
        </label>
        <span className="ml-auto text-sm text-muted">{fmtInt(filtrados.length)} site(s)</span>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <Th>Site</Th>
              <Th>Cliente</Th>
              <Th>Local</Th>
              <Th>Licenciador</Th>
              <Th>Ofensor</Th>
              <Th>SLA</Th>
              <Th>Atualização</Th>
              <Th>Faturamento</Th>
              <Th right>Score</Th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium">{s.id}</td>
                <td className="px-4 py-2.5 text-muted">{s.cliente}</td>
                <td className="px-4 py-2.5 text-muted">
                  {s.municipio ? `${s.municipio}/${s.uf ?? ""}` : "—"}
                </td>
                <td className="px-4 py-2.5">
                  {s.licenciador ? (
                    <span className={s.licenciador.startsWith("⚠") ? "text-amber-600" : ""}>
                      {s.licenciador}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <OfensorBadge ofensor={s.ofensorPrincipal} />
                </td>
                <td className="px-4 py-2.5">
                  <SlaBadge status={s.slaStatus} />
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <AtualizacaoBadge status={s.statusAtualizacao} />
                    {s.diasSemAtualizacao !== null && (
                      <span className="text-xs text-muted">{s.diasSemAtualizacao}d</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <FaturamentoBadge status={s.statusFaturamento} />
                </td>
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                  {fmtInt(s.score)}
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-muted">
                  Nenhum site corresponde aos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted">
        Última atualização exibida por site: data mais recente entre os serviços ativos (seção 5.6).
        {filtrados[0]?.ultimaAtualizacao &&
          ` Ex.: ${fmtData(filtrados[0].ultimaAtualizacao)}.`}
      </p>
    </div>
  );
}

function Select({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
    >
      <option value="">{placeholder}: todos</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th className={`px-4 py-2.5 font-medium ${right ? "text-right" : ""}`}>{children}</th>
  );
}
