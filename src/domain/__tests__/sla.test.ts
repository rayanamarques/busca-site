import { describe, expect, it } from "vitest";
import { calcularSlaStatus, diasEntre, severidadeSla } from "@/domain";

const HOJE = new Date("2026-06-03T12:00:00Z");

function diasAtras(n: number): string {
  const d = new Date(HOJE);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString();
}

describe("diasEntre", () => {
  it("conta dias inteiros ignorando hora", () => {
    expect(diasEntre(diasAtras(7), HOJE)).toBe(7);
    expect(diasEntre(diasAtras(0), HOJE)).toBe(0);
  });
  it("retorna null sem data", () => {
    expect(diasEntre(null, HOJE)).toBeNull();
  });
});

describe("régua de SLA por classificação (5.5)", () => {
  it("Protocolo: ≤5 no prazo, ≤7 risco, >7 estourado (sem acompanhamento)", () => {
    const c = "Protocolo Urbanístico" as const;
    expect(calcularSlaStatus(c, 5, true)).toBe("No prazo");
    expect(calcularSlaStatus(c, 6, true)).toBe("Em risco");
    expect(calcularSlaStatus(c, 7, true)).toBe("Em risco");
    expect(calcularSlaStatus(c, 8, true)).toBe("Estourado");
  });

  it("Licença: 35 / 36–50 / 51–60 / >60", () => {
    const c = "Licença Ambiental" as const;
    expect(calcularSlaStatus(c, 35, true)).toBe("No prazo");
    expect(calcularSlaStatus(c, 36, true)).toBe("Em acompanhamento");
    expect(calcularSlaStatus(c, 50, true)).toBe("Em acompanhamento");
    expect(calcularSlaStatus(c, 51, true)).toBe("Em risco");
    expect(calcularSlaStatus(c, 60, true)).toBe("Em risco");
    expect(calcularSlaStatus(c, 61, true)).toBe("Estourado");
  });

  it("CUOS/Inexigibilidade: 7 / 8–15 / 16–30 / >30", () => {
    const c = "Viabilidade - CUOS" as const;
    expect(calcularSlaStatus(c, 7, true)).toBe("No prazo");
    expect(calcularSlaStatus(c, 15, true)).toBe("Em acompanhamento");
    expect(calcularSlaStatus(c, 30, true)).toBe("Em risco");
    expect(calcularSlaStatus(c, 31, true)).toBe("Estourado");
  });

  it("Habite-se: 30 / 31–45 / 46–60 / >60", () => {
    const c = "Habite-se" as const;
    expect(calcularSlaStatus(c, 30, true)).toBe("No prazo");
    expect(calcularSlaStatus(c, 45, true)).toBe("Em acompanhamento");
    expect(calcularSlaStatus(c, 60, true)).toBe("Em risco");
    expect(calcularSlaStatus(c, 61, true)).toBe("Estourado");
  });

  it("Complementar: ≤2 no prazo, 3–5 risco, >5 estourado", () => {
    const c = "Serviços Complementares" as const;
    expect(calcularSlaStatus(c, 2, true)).toBe("No prazo");
    expect(calcularSlaStatus(c, 3, true)).toBe("Em risco");
    expect(calcularSlaStatus(c, 5, true)).toBe("Em risco");
    expect(calcularSlaStatus(c, 6, true)).toBe("Estourado");
  });
});

describe("estados especiais de SLA (5.5)", () => {
  it("serviço não-ativo não tem SLA de andamento", () => {
    expect(calcularSlaStatus("Licença Ambiental", 100, false)).toBe("Serviço finalizado");
  });
  it("ativo sem data de acionamento -> acionar no sistema", () => {
    expect(calcularSlaStatus("Licença Ambiental", null, true)).toBe("Acionar no sistema");
  });
  it("data futura -> verificar data", () => {
    expect(calcularSlaStatus("Licença Ambiental", -3, true)).toBe("Verificar data");
  });
  it("aquisição não tem SLA", () => {
    expect(calcularSlaStatus("Aquisição - Campo", 10, true)).toBe("Sem SLA");
  });
});

describe("severidade para SLA mais crítico do site (5.5)", () => {
  it("ordena Protocolo estourado > Licença estourada > CUOS estourada", () => {
    const protoEst = severidadeSla("Protocolo Urbanístico", "Estourado");
    const licEst = severidadeSla("Licença Ambiental", "Estourado");
    const cuosEst = severidadeSla("Viabilidade - CUOS", "Estourado");
    expect(protoEst).toBeGreaterThan(licEst);
    expect(licEst).toBeGreaterThan(cuosEst);
  });

  it("qualquer estourado supera qualquer em risco", () => {
    const compEst = severidadeSla("Serviços Complementares", "Estourado");
    const licRisco = severidadeSla("Licença Ambiental", "Em risco");
    expect(compEst).toBeGreaterThan(licRisco);
  });

  it("em risco supera acompanhamento e no prazo", () => {
    expect(severidadeSla("Viabilidade - CUOS", "Em risco")).toBeGreaterThan(
      severidadeSla("Protocolo Urbanístico", "Em acompanhamento"),
    );
    expect(severidadeSla("Viabilidade - CUOS", "Em acompanhamento")).toBeGreaterThan(
      severidadeSla("Protocolo Urbanístico", "No prazo"),
    );
  });
});
