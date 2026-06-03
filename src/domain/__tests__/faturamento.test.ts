import { describe, expect, it } from "vitest";
import {
  isAFaturar,
  isEmEsperaComPo,
  isFaturado,
  servicoFaturavel,
  statusFaturamentoSite,
  type Servico,
} from "@/domain";

function servico(p: Partial<Servico>): Servico {
  return {
    id: Math.random().toString(),
    siteId: "S1",
    classificacao: "Licença Urbanística",
    situacao: "Finalizado (faturar)",
    ...p,
  };
}

describe("classificadores de faturamento (5.4)", () => {
  it("a faturar = Finalizado (faturar) + Cancelado Faturável", () => {
    expect(isAFaturar("Finalizado (faturar)")).toBe(true);
    expect(isAFaturar("Cancelado Faturável")).toBe(true);
    expect(isAFaturar("Em Espera")).toBe(false);
  });
  it("faturado exige NFS-e preenchida", () => {
    expect(isFaturado({ situacao: "Concluído (faturado)", nfse: "NF123" })).toBe(true);
    expect(isFaturado({ situacao: "Concluído (faturado)", nfse: null })).toBe(false);
  });
  it("em espera com PO exige PO preenchida", () => {
    expect(isEmEsperaComPo({ situacao: "Em Espera", po: "PO9" })).toBe(true);
    expect(isEmEsperaComPo({ situacao: "Em Espera", po: "" })).toBe(false);
  });
});

describe("elegibilidade por cliente/tipo (5.4)", () => {
  it("CUOS só fatura à parte para IHS", () => {
    expect(servicoFaturavel("Viabilidade - CUOS", "IHS")).toBe(true);
    expect(servicoFaturavel("Viabilidade - CUOS", "TBSA")).toBe(false);
    expect(servicoFaturavel("Viabilidade - CUOS", "HIGHLINE")).toBe(false);
  });
  it("Inexigibilidade: TBSA no pacote, IHS não realiza, Winity à parte", () => {
    expect(servicoFaturavel("Viabilidade - Inexigibilidade", "TBSA")).toBe(false);
    expect(servicoFaturavel("Viabilidade - Inexigibilidade", "IHS")).toBe(false);
    expect(servicoFaturavel("Viabilidade - Inexigibilidade", "WINITY")).toBe(true);
  });
});

describe("status de faturamento do site (5.4)", () => {
  it("prioriza A faturar", () => {
    const s = statusFaturamentoSite(
      [servico({ situacao: "Finalizado (faturar)" }), servico({ situacao: "Em Espera", po: "PO1" })],
      "TBSA",
    );
    expect(s).toBe("A faturar");
  });
  it("Em espera (com PO) quando não há a faturar", () => {
    expect(statusFaturamentoSite([servico({ situacao: "Em Espera", po: "PO1" })], "TBSA")).toBe(
      "Em espera (com PO)",
    );
  });
  it("Em espera (sem PO)", () => {
    expect(statusFaturamentoSite([servico({ situacao: "Em Espera", po: null })], "TBSA")).toBe(
      "Em espera (sem PO)",
    );
  });
  it("Faturado quando concluído com NF", () => {
    expect(
      statusFaturamentoSite([servico({ situacao: "Concluído (faturado)", nfse: "NF1" })], "TBSA"),
    ).toBe("Faturado");
  });
  it("ignora CUOS não-faturável (TBSA) ao consolidar", () => {
    const s = statusFaturamentoSite(
      [servico({ classificacao: "Viabilidade - CUOS", situacao: "Finalizado (faturar)" })],
      "TBSA",
    );
    expect(s).toBe("Sem faturamento");
  });
});
