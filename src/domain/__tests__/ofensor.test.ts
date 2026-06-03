import { describe, expect, it } from "vitest";
import { ofensorDoServico, ofensorPrincipal } from "@/domain";

describe("ofensor por serviço (5.3)", () => {
  it("Cliente quando situação é Cliente (Sharing)", () => {
    expect(ofensorDoServico("Licença Urbanística", "Cliente")).toBe("Cliente");
  });
  it("Órgão quando protocolado", () => {
    expect(ofensorDoServico("Protocolo Ambiental", "Iniciado (protocolado)")).toBe("Órgão");
  });
  it("BS quando aberto/pendência/não acionado", () => {
    expect(ofensorDoServico("Licença Ambiental", "Aberto/Acionado")).toBe("BS");
    expect(ofensorDoServico("Licença Ambiental", "Pendência")).toBe("BS");
    expect(ofensorDoServico("Licença Ambiental", "Não Acionado")).toBe("BS");
  });
  it("Serv. Compl. para complementar interno", () => {
    expect(ofensorDoServico("Serviços Complementares", "Pendência")).toBe("Serv. Compl.");
  });
  it("sem ofensor em situações terminais", () => {
    expect(ofensorDoServico("Licença Ambiental", "Concluído (faturado)")).toBeNull();
    expect(ofensorDoServico("Licença Ambiental", "Em Espera")).toBeNull();
  });
});

describe("ofensor principal do site (hierarquia Cliente → Órgão → BS, 5.3)", () => {
  it("Cliente vence Órgão e BS", () => {
    expect(ofensorPrincipal(["BS", "Órgão", "Cliente"])).toBe("Cliente");
  });
  it("Órgão vence BS", () => {
    expect(ofensorPrincipal(["BS", "Órgão"])).toBe("Órgão");
  });
  it("BS quando só há BS", () => {
    expect(ofensorPrincipal(["BS", "BS"])).toBe("BS");
  });
  it("Serv. Compl. só quando não há outros", () => {
    expect(ofensorPrincipal(["Serv. Compl."])).toBe("Serv. Compl.");
    expect(ofensorPrincipal(["Serv. Compl.", "BS"])).toBe("BS");
  });
  it("null quando não há ofensores", () => {
    expect(ofensorPrincipal([null, null])).toBeNull();
    expect(ofensorPrincipal([])).toBeNull();
  });
});
