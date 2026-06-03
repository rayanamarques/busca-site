import { Badge } from "@/components/ui/badge";
import type { Ofensor, SlaStatus, StatusAtualizacao, StatusFaturamento } from "@/domain";

const SLA_TONE: Record<SlaStatus, Parameters<typeof Badge>[0]["tone"]> = {
  Estourado: "red",
  "Em risco": "amber",
  "Em acompanhamento": "blue",
  "No prazo": "green",
  "Verificar data": "purple",
  "Acionar no sistema": "purple",
  "Não acionado": "slate",
  "Serviço finalizado": "slate",
  "Sem SLA": "gray",
};

export function SlaBadge({ status }: { status: SlaStatus }) {
  return <Badge tone={SLA_TONE[status]}>{status}</Badge>;
}

const OFENSOR_TONE: Record<Ofensor, Parameters<typeof Badge>[0]["tone"]> = {
  BS: "red",
  Órgão: "blue",
  Cliente: "amber",
  "Serv. Compl.": "purple",
};

export function OfensorBadge({ ofensor }: { ofensor: Ofensor | null }) {
  if (!ofensor) return <span className="text-muted">—</span>;
  return <Badge tone={OFENSOR_TONE[ofensor]}>{ofensor}</Badge>;
}

const ATT_TONE: Record<StatusAtualizacao, Parameters<typeof Badge>[0]["tone"]> = {
  "Controle interno": "green",
  "Atualizar hoje": "amber",
  Vencida: "red",
  "Sem data": "slate",
};

export function AtualizacaoBadge({ status }: { status: StatusAtualizacao }) {
  return <Badge tone={ATT_TONE[status]}>{status}</Badge>;
}

const FAT_TONE: Record<StatusFaturamento, Parameters<typeof Badge>[0]["tone"]> = {
  "A faturar": "green",
  "Em espera (com PO)": "blue",
  "Em espera (sem PO)": "amber",
  Faturado: "slate",
  "Sem faturamento": "gray",
};

export function FaturamentoBadge({ status }: { status: StatusFaturamento }) {
  return <Badge tone={FAT_TONE[status]}>{status}</Badge>;
}
