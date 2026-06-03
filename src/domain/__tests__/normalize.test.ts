import { describe, expect, it } from "vitest";
import {
  grupoSlaDe,
  isLicenciamentoOuViabilidade,
  isSituacaoAtiva,
  normalizeClassificacao,
  normalizeSiteId,
  normalizeSituacao,
} from "@/domain";

describe("normalização de classificação (5 4.3)", () => {
  it("corrige variações ortográficas conhecidas", () => {
    expect(normalizeClassificacao("Protocolo Urbanistico")).toBe("Protocolo Urbanístico");
    expect(normalizeClassificacao("Licença Urbanistica")).toBe("Licença Urbanística");
    expect(normalizeClassificacao("Inexibilidade")).toBe("Viabilidade - Inexigibilidade");
    expect(normalizeClassificacao("Viabilidade - Inexibilidade")).toBe(
      "Viabilidade - Inexigibilidade",
    );
  });

  it("é tolerante a caixa e espaços", () => {
    expect(normalizeClassificacao("  habite se ")).toBe("Habite-se");
    expect(normalizeClassificacao("CUOS")).toBe("Viabilidade - CUOS");
  });

  it("retorna null para valores desconhecidos", () => {
    expect(normalizeClassificacao("xpto")).toBeNull();
    expect(normalizeClassificacao("")).toBeNull();
  });
});

describe("normalização de situação", () => {
  it("unifica SHARING -> Cliente (nota 5.3)", () => {
    expect(normalizeSituacao("Sharing")).toBe("Cliente");
  });
  it("reconhece situações ativas e terminais", () => {
    expect(normalizeSituacao("Iniciado (protocolado)")).toBe("Iniciado (protocolado)");
    expect(normalizeSituacao("finalizado")).toBe("Finalizado (faturar)");
  });
});

describe("normalização de Site ID (texto ou número)", () => {
  it("aceita número e texto, retornando string", () => {
    expect(normalizeSiteId(75010028)).toBe("75010028");
    expect(normalizeSiteId("TTBAVAZ0004")).toBe("TTBAVAZ0004");
    expect(normalizeSiteId("  ")).toBeNull();
    expect(normalizeSiteId(null)).toBeNull();
  });
});

describe("agrupamentos", () => {
  it("mapeia classificação -> grupo de SLA", () => {
    expect(grupoSlaDe("Protocolo Ambiental")).toBe("protocolo");
    expect(grupoSlaDe("Licença Urbanística")).toBe("licenca");
    expect(grupoSlaDe("Viabilidade - CUOS")).toBe("viabilidade");
    expect(grupoSlaDe("Aquisição - Campo")).toBe("aquisicao");
  });

  it("aquisição e complementar não são licenciamento/viabilidade (5.1)", () => {
    expect(isLicenciamentoOuViabilidade("Aquisição - Campo")).toBe(false);
    expect(isLicenciamentoOuViabilidade("Serviços Complementares")).toBe(false);
    expect(isLicenciamentoOuViabilidade("Licença Ambiental")).toBe(true);
  });

  it("reconhece situações ativas (4.4)", () => {
    expect(isSituacaoAtiva("Pendência")).toBe(true);
    expect(isSituacaoAtiva("Cliente")).toBe(true);
    expect(isSituacaoAtiva("Concluído (faturado)")).toBe(false);
    expect(isSituacaoAtiva("Em Espera")).toBe(false);
  });
});
