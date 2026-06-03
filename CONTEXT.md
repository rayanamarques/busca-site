# Sistema de Gestão de Licenciamento — Busca Site Marques Engenharia
## Documento de Discovery e Contexto para Desenvolvimento com Claude Code

> **Como usar este documento:** Coloque-o na raiz do projeto (ex.: `CONTEXT.md` ou `docs/discovery.md`). Ele serve como fonte de verdade sobre o negócio, as regras e o escopo. Ao iniciar uma sessão no Claude Code, peça que ele leia este arquivo antes de gerar qualquer código. Atualize-o conforme as decisões evoluírem.
>
> **Fonte de verdade das regras:** as regras de negócio, a régua de SLA e os parâmetros deste documento foram extraídos da planilha de produção `ROLLOUT_LICENCIAMENTO_BS` (versão "5 blocos / licenciador"), que é a referência funcional validada da operação. Onde houver dúvida de implementação, a planilha é o critério de desempate.

---

## 1. Visão geral do negócio

A **Busca Site Marques Engenharia** atua no setor de telecomunicações com aquisição, regularização e licenciamento de imóveis para instalação de estruturas de telefonia móvel (torres, rooftops, SLS, DAS, colocation). A empresa é o elo entre as operadoras/tower companies (clientes) e os órgãos públicos que emitem as licenças necessárias para instalar e operar as estruturas.

O fluxo central do negócio é: receber a demanda de um cliente para um determinado **site** (local físico identificado por um código), conduzir a viabilidade, protocolar e obter as licenças junto aos órgãos competentes, manter o cliente atualizado e, ao final de cada serviço, faturar.

A operação gira em torno de uma carteira de aproximadamente **680 sites únicos** e **4.600+ serviços** registrados, dos quais cerca de **150 sites estão ativos** a qualquer momento. O trabalho é distribuído entre uma equipe de licenciadores, com forte componente de prazo (SLA) e de comunicação com cliente.

**Empresa irmã:** a **Triad Engenharia** atua em obras civis e infraestrutura de telecom (construção, manutenção, inspeções e zeladoria de torres). Não é o foco deste sistema, mas pode haver integração futura (ex.: quando um site licenciado vira obra).

---

## 2. Glossário do domínio

Termos que aparecem na operação e devem ser preservados na modelagem e na interface:

| Termo | Significado |
|---|---|
| **Site** | Local físico onde a estrutura será instalada. Identificado por um Site ID (ex.: `TTBAVAZ0004`) ou código numérico (ex.: `75010028`). |
| **Site ID Cliente / Site Operadora** | Cada site pode ter um identificador do lado do cliente e outro do lado da operadora. |
| **CUOS** | Certidão de Uso e Ocupação do Solo — etapa de viabilidade. |
| **Inexigibilidade** | Documento de viabilidade alternativo ao CUOS, quando o licenciamento não é exigível. |
| **Protocolo (Urbanístico / Ambiental)** | Entrada do pedido de licença no órgão. |
| **Licença (Urbanística / Ambiental)** | Emissão da licença pelo órgão. |
| **Habite-se** | Documento final que atesta conformidade da construção. |
| **Alvará** | Autorização de funcionamento/obra. |
| **COMAR** | Comando Aéreo Regional — análise para estruturas que afetam espaço aéreo. |
| **Serviços Complementares** | Serviços terceirizados executados por fornecedor externo (não licenciamento puro). |
| **Sharing** | Quando a pendência depende do cliente (ex.: documento ou decisão do cliente). |
| **Ofensor** | Quem está "segurando" o andamento de um site: a Busca Site (BS), o Órgão público, ou o cliente (Sharing). |
| **SLA** | Prazo-limite de cada etapa; pode estar dentro do prazo, em risco ou estourado. |
| **LPU** | Lista de Preços Unitários — referência usada para faturamento e datas de atualização. |
| **P.O.** | Purchase Order (ordem de compra) emitida pelo cliente; pré-requisito para faturar. |
| **NFS-e** | Nota fiscal de serviço eletrônica. |
| **Licenciador** | Profissional da equipe responsável por conduzir os serviços de um site. |

---

## 3. Clientes e equipe

### 3.1 Clientes (tower companies / operadoras)

A carteira atende cinco clientes, com forte concentração em TBSA:

- **TBSA** — maior cliente, ~60% dos serviços
- **WINITY**
- **IHS** — atenção especial: muitos sites com Site ID numérico
- **HIGHLINE**
- **SBA**

### 3.2 Equipe de licenciamento e papéis

A modelagem de usuários/responsáveis precisa respeitar a divisão real de trabalho:

| Pessoa | Papel | Observação |
|---|---|---|
| **Vanessa Santana** | Gerente de licenciamento | Não é licenciadora — não deve entrar no rateio de carteira. |
| **Carol Martins** | Licenciadora — Nordeste | Carteira regional. |
| **Keila Santos** | Licenciadora — Bahia | Carteira regional. |
| **Juliana Sena** | Licenciadora — demais regiões + IHS | Maior carteira; candidata a redistribuição. |
| **Pedro Assis** | Viabilidade (CUOS / inexigibilidade) | Só atua na etapa de viabilidade. |
| **Stephany Rodrigues** | Viabilidade (CUOS / inexigibilidade) | Só atua na etapa de viabilidade. |
| **Andre Tiburtino** | Atuação pontual | Casos esporádicos. |
| **Rayana Marques** | Sócia-diretora | Atuação pontual + visão executiva. |
| **Rose Castro** | Projetista | Não conta como licenciadora — excluir do cálculo. |
| **Guilherme Soares, Marcelly Cristine, Erilane Marinho** | Serviços complementares | Só atuam em complementares — excluir do cálculo de licenciador. |
| **Juliana Marques** | Saiu da empresa | Manter histórico, mas sinalizar e não atribuir. |

**Regra de negócio central sobre responsável:** um site ativo costuma ter **dois responsáveis simultâneos** — um da viabilidade (Pedro ou Stephany) e um do licenciamento da região (Carol, Keila ou Juliana). A interface deve mostrar os dois quando coexistem (ex.: "Pedro Assis / Keila Santos").

---

## 4. Modelo de dados do domínio

### 4.1 Granularidade

O dado primário é a **linha de serviço**: cada site tem várias linhas, uma por serviço/etapa. A visão gerencial precisa de duas camadas:

1. **Serviço** (linha bruta) — cada etapa de cada site, com sua situação, responsável, datas, PO e NF. **É nesta camada que se calcula primeiro**: dias em aberto, status de SLA, ofensor do serviço e status de atualização. Calcular no nível do serviço e depois agregar é mais robusto do que recalcular tudo no nível do site.
2. **Site** (visão consolidada) — agrega todos os serviços de um site, derivando licenciador(es), ofensor principal, SLA mais crítico, última atualização, status de faturamento e score de prioridade.

### 4.2 Entidades sugeridas

```
Cliente (TBSA, WINITY, IHS, HIGHLINE, SBA)
Site
  - site_id_cliente, site_operadora, município, UF, cliente
Servico (linha)
  - site_id, classificação, situação, responsável_técnico
  - tipo (L. Urbanístico / L. Ambiental / Aquisição / Complementar)
  - data_acionamento, data_entrega, data_atualizacao_lpu
  - po, nfse
Pessoa (equipe)
  - nome, papel (gerente / licenciador / viabilidade / projetista / complementar / sócio)
  - região, ativo (bool)
```

### 4.3 Classificações de serviço (valores reais)

`Viabilidade - CUOS`, `Viabilidade - Inexigibilidade`, `Protocolo Urbanístico`, `Licença Urbanística`, `Protocolo Ambiental`, `Licença Ambiental`, `Habite-se`, `Serviços Complementares`, `Aquisição - Campo`.

> Atenção a variações ortográficas presentes na base legada (ex.: "Urbanistico" sem acento, "Inexibilidade"). O sistema novo deve **normalizar** esses valores na entrada.

### 4.4 Situações de serviço (valores reais)

**Ativas** (serviço em andamento): `Aberto/Acionado`, `Pendência`, `Iniciado (protocolado)`, `Cliente`.
**Terminais**: `Concluído (faturado)`, `Finalizado (faturar)`, `Cancelado Não Faturável`, `Cancelado Faturável`, `Em Espera`, `Não Acionado`, `RC`, `Não Qualificado`.

---

## 5. Regras de negócio críticas

Estas regras são o coração do sistema. Foram refinadas ao longo de meses de trabalho com a base real e precisam ser implementadas com fidelidade.

### 5.1 Site ativo

Um site é considerado ativo quando tem **pelo menos um serviço de licenciamento ou viabilidade** em situação ativa. Serviços de Aquisição-Campo e Complementares **não contam** para "serviços ativos" do site (complementares têm contagem própria).

### 5.2 Licenciador do site

- Sem serviços ativos → sem licenciador.
- Com viabilidade ativa **e** licenciamento ativo → mostrar os dois: `responsável_viab / responsável_licenc`.
- Só viabilidade ativa → responsável da viabilidade.
- Só licenciamento ativo → responsável do licenciamento.
- Excluir sempre do cálculo: Rose Castro (projetista) e quem só atua em complementares.
- Sem nenhum responsável preenchido → sinalizar "⚠ Sem responsável" (é um dado a corrigir na origem, não erro do sistema).

### 5.3 Ofensor (quem está segurando o site)

Hierarquia de prioridade: **Sharing (cliente) → Órgão → BS**.

- **Sharing**: existe serviço de licenciamento/viabilidade com situação `Cliente`.
- **Órgão**: existe serviço com situação `Iniciado (protocolado)`.
- **BS** (responsabilidade interna): situação `Aberto/Acionado`, `Pendência` ou `Não Acionado`.
- **Serv. Compl.**: só há complementar ativo.

> Nota de nomenclatura: no nível do **serviço**, a planilha rotula o ofensor-cliente como `SHARING`; no nível do **site** (ofensor principal) aparece como `CLIENTE`. São o mesmo conceito (pendência do lado do cliente). Padronizar um único rótulo no sistema novo.

### 5.4 Faturamento

- **A faturar** = situações `Finalizado (faturar)` + `Cancelado Faturável`.
- **Faturado** = `Concluído (faturado)` com NFS-e preenchida.
- **Em espera com PO** = `Em Espera` com P.O. preenchida.
- Regras específicas por cliente e tipo de serviço:
  - **CUOS**: só IHS fatura à parte; TBSA/Winity/Highline já vão no pacote de aquisição.
  - **Inexigibilidade**: TBSA vai no pacote; IHS não realiza; Winity/demais faturam à parte.
  - **Serviços Complementares**: são de fornecedor terceiro (ofensor "Serv. Compl.").

### 5.5 SLA por serviço (régua exata)

O SLA é calculado **por serviço**, a partir dos **dias em aberto** (hoje − data de acionamento da LPU), e só vale para serviços em situação ativa. Cada classificação tem sua própria régua de faixas. Esta é a régua de produção:

| Classificação | No prazo | Em acompanhamento | Em risco | Estourado |
|---|---|---|---|---|
| **Protocolo** (Urb./Amb.) | ≤ 5 d ("Protocolar") | — | ≤ 7 d | > 7 d |
| **Licença** (Urb./Amb.) | ≤ 35 d | 36–50 d | 51–60 d | > 60 d |
| **CUOS** (viabilidade) | ≤ 7 d | 8–15 d | 16–30 d | > 30 d |
| **Inexigibilidade** (viabilidade) | ≤ 7 d | 8–15 d | 16–30 d | > 30 d |
| **Habite-se** | ≤ 30 d | 31–45 d | 46–60 d | > 60 d |
| **Serviços Complementares** | ≤ 2 d | — | 3–5 d | > 5 d |

Estados especiais de serviço: `SERVIÇO FINALIZADO`, `NÃO ACIONADO`, `ACIONAR SERVIÇO NO SISTEMA` (sem data de acionamento), `VERIFICAR DATA`, `VERIFICAR STATUS`.

> Esses limites são **parametrizáveis** (ver seção 6.3 / aba CONFIG). O sistema novo deve expor esses parâmetros em configuração, não fixá-los no código.

**SLA mais crítico do site:** a CAMADA_SITE escolhe, entre os serviços ativos do site, o de maior severidade, na ordem de prioridade: Protocolo estourado → Licença estourada → CUOS estourada → Habite-se estourado → Complementar estourado → Licença em risco → CUOS em risco → … → estados de acompanhamento → no prazo.

### 5.6 Atualização do cliente

- A "última atualização" de um site é a data **mais recente** (Data de Atualização LPU) entre seus serviços ativos.
- Faixas praticadas: até **3 dias** = controle interno; até **5 dias** = atualizar cliente hoje; acima = **atualização vencida**; sem data = sinalizar.

### 5.7 Score de prioridade

Cada site ativo recebe um score que ordena o "que atacar primeiro". A fórmula de produção pondera: peso do ofensor (BS 1000 > Serv. Compl. 400 > Órgão 500 > Cliente 300), mais bônus por atualização vencida (300) ou atualização do cliente pendente (100), mais os dias do serviço mais crítico — tudo multiplicado pela quantidade de serviços ativos do site. O efeito prático é priorizar sites com pendência interna (BS), muitos serviços e muito tempo parados.

---

## 6. Sistema atual (situação que queremos superar)

### 6.1 O WDM (Limitless)

A operação roda hoje sobre o **WDM (Limitless)**, um sistema que concentra o cadastro de aquisição e licenciamento. Investimento de ~R$ 27 mil. Características:

**O que ele faz:**
- Cadastro de sites e serviços por etapa.
- Registro de responsável técnico, situação, datas, PO, NF.
- Exportação dos dados em planilha.

**O que falta (origem das dores):**
- **Não tem dashboard/visão executiva** — não há indicadores consolidados.
- Não calcula ofensor, SLA consolidado, carga por licenciador nem status de atualização.
- Não tem visão por site (só por linha de serviço).
- Não sinaliza faturamento pendente nem atualizações vencidas.
- Dados com inconsistências de digitação (ortografia das classificações, Site ID ora texto ora número, responsável em branco).

### 6.2 A solução-ponte atual (planilha Excel)

Foi construída uma planilha de gestão (`ROLLOUT_LICENCIAMENTO_-_BS.xlsx`) que consome a exportação do WDM e gera as camadas que faltam. Ela **já contém toda a lógica de negócio validada** e é a melhor referência funcional para o sistema novo. Abas:

- **BASE_TRATADA** — fonte única (exportação do WDM colada manualmente).
- **CAMADA_SITE** — visão consolidada por site (licenciador, ofensor, SLA, última atualização, faturamento, score).
- **DASHBOARD** — KPIs por serviço, faturamento, SLA crítico por cliente, distribuição ofensor × cliente, top 15 por score, top 15 atualização, carga por licenciador.
- **FATURAMENTO_PENDENTE** — serviços a faturar.
- **CALENDÁRIO_ATUALIZAÇÕES** — agenda de atualizações por licenciador.
- **NOVOS_SITES** — detecção de sites novos na base.

**Limitações da planilha que justificam o sistema:**
- Depende de exportar do WDM e colar manualmente, várias vezes ao dia, por várias pessoas.
- Fórmulas pesadas (FILTER/SUMPRODUCT sobre milhares de linhas) no limite da performance.
- Sem multiusuário real, sem trilha de auditoria, sem controle de acesso por papel.
- Frágil a erros de digitação na base.

### 6.3 Parâmetros de SLA (configuráveis)

A planilha já isola os limites de SLA numa aba CONFIG — o sistema deve fazer o mesmo (tela de configuração, não valores fixos no código):

| Parâmetro | Valor | Significado |
|---|---|---|
| SLA_PROTOCOLO_RISCO | 5 | dias para entrar em risco (protocolo) |
| SLA_PROTOCOLO_ESTOURADO | 7 | dias para estourar (protocolo) |
| SLA_LICENCA_RADAR | 46 | dias para radar/acompanhamento (licença) |
| SLA_LICENCA_GERENCIAL | 75 | dias para foco gerencial (licença) |
| SLA_VIABILIDADE_ALERTA | 7 | dias para alerta (viabilidade) |
| SLA_VIABILIDADE_CRITICA | 15 | dias para crítica (viabilidade) |
| SLA_COMPLEMENTAR_NORMAL | 1 | dias para acompanhar complementar |
| SLA_COMPLEMENTAR_URGENTE | 2 | dias para cobrar fornecedor |
| SLA_ATT_INTERNO | 3 | até aqui, atualização é controle interno |
| SLA_ATT_CLIENTE | 5 | até aqui, atualizar cliente hoje |

### 6.4 Cadência operacional praticada

A rotina semanal da equipe (deve informar alertas e relatórios do sistema):

- **Segunda (manhã):** atualizar a base; distribuir pendências BS internamente; cobrar Órgão e Sharing por e-mail.
- **Quarta:** reportar progresso ao cliente (sites com avanço).
- **Sexta:** fechamento de faturamento da semana (revisar fila de faturamento).

---

## 7. Principais dores (o "porquê" do projeto)

1. **Falta de visão executiva em tempo real.** Hoje a foto da operação depende de exportar, colar e recalcular. A diretoria não tem um painel vivo.
2. **Dependência de processo manual e de pessoas.** A atualização da base depende de alguém colar a exportação; múltiplas pessoas fazem isso por dia, gerando retrabalho e risco de versão desatualizada.
3. **Sem fonte única confiável.** O WDM é a origem, mas a inteligência vive na planilha — duas verdades.
4. **Controle de SLA reativo.** Os atrasos viram visíveis tarde; falta alerta proativo de "vai estourar".
5. **Faturamento parado.** Centenas de serviços finalizados aguardando emissão de NF/PO sem cobrança sistemática.
6. **Atualização do cliente sem cadência.** Não há lembrete automático de quais sites precisam ser atualizados e por quem.
7. **Carga de trabalho desbalanceada.** Um licenciador concentra carteira muito maior que os demais, sem visão clara para redistribuir.
8. **Qualidade de dados.** Ortografia inconsistente, IDs com tipos diferentes, responsável em branco — sem validação na entrada.
9. **Sem trilha de auditoria.** Não se sabe quem mudou o quê e quando.

---

## 8. Visão do novo sistema

### 8.1 Objetivo

Um sistema web multiusuário que seja **a fonte única** da operação de licenciamento — substituindo o par "WDM + planilha" por uma plataforma onde a equipe registra o trabalho e a diretoria acompanha indicadores ao vivo, com alertas de SLA e faturamento, sem depender de exportações manuais.

### 8.2 Perfis de usuário

- **Diretoria/Gestão** (Rayana, Vanessa): dashboards, indicadores, redistribuição de carga, visão de faturamento.
- **Licenciador**: sua carteira, suas pendências, registro de andamento, atualização do cliente.
- **Viabilidade** (Pedro, Stephany): fila de CUOS/inexigibilidade.
- **Financeiro**: fila de faturamento (a faturar, PO pendente, NF a emitir).
- **Cliente** (futuro/opcional): portal somente-leitura do andamento dos seus sites.

### 8.3 Módulos / funcionalidades

**Núcleo**
- Cadastro de sites e serviços (CRUD) com validação de classificação/situação (normalização na entrada).
- Importação da base do WDM (upload de planilha) como passo de migração e durante a transição.
- Cálculo automático, por site, de: licenciador(es), ofensor, SLA mais crítico, última atualização, status de faturamento, score de prioridade.

**Dashboard executivo**
- KPIs por serviço (protocolos, licenças, CUOS, inexigibilidade, habite-se, complementares pendentes).
- Faturamento (a faturar, com/sem PO, faturado, em espera).
- SLA crítico por cliente (em risco × estourado, por etapa).
- Distribuição ofensor × cliente.
- Top sites por prioridade (score).
- Carga por licenciador (dinâmica, respeitando papéis e exclusões).

**Operação diária**
- Fila do licenciador (minha carteira, ordenada por criticidade).
- Calendário/lista de atualizações pendentes por licenciador.
- Fila de faturamento para o financeiro.
- Registro de andamento por serviço (mudança de situação, anotações), gerando histórico.

**Alertas e comunicação**
- Notificação de SLA prestes a estourar e estourado.
- Lembrete de atualização do cliente por cadência.
- (Futuro) Integração de mensagens com cliente (a empresa já estuda WhatsApp Business API).

**Governança**
- Controle de acesso por papel.
- Trilha de auditoria (quem mudou o quê e quando).
- Validação de dados na entrada (sem ortografia divergente, sem ID ambíguo, responsável obrigatório quando aplicável).

### 8.4 Indicadores que o sistema deve calcular nativamente

Sites ativos; pendentes por etapa (protocolo, licença, CUOS, inexigibilidade, habite-se, complementares); por cliente (ativos/total); ofensores (BS/Órgão/Sharing/Compl.); SLA em risco e estourado por etapa e por cliente; faturamento (a faturar, com/sem PO, faturado, em espera); atualizações vencidas/a atualizar/sem data; carga por licenciador; mediana de dias sem atualização; score de prioridade por site.

---

## 9. Roadmap sugerido por fases

> Pensado para construção incremental com Claude Code, entregando valor cedo.

**Fase 0 — Fundação**
Modelagem de dados, autenticação, papéis, layout base e navegação. Importador da planilha do WDM para popular a base inicial.

**Fase 1 — Visão (leitura)**
CAMADA_SITE e DASHBOARD como telas só-leitura sobre os dados importados. Replicar fielmente as regras de licenciador, ofensor, SLA e faturamento. Esta fase já substitui a planilha como painel.

**Fase 2 — Operação (escrita)**
CRUD de sites/serviços, registro de andamento, filas por papel (licenciador, viabilidade, financeiro), histórico/auditoria. Aqui o sistema começa a substituir o WDM.

**Fase 3 — Proatividade**
Alertas de SLA, cadência de atualização do cliente, fila de faturamento ativa, relatórios exportáveis.

**Fase 4 — Extensões**
Portal do cliente (leitura), integração de mensagens (WhatsApp), e eventual ponte com a Triad (site licenciado → obra).

---

## 10. Stack e diretrizes técnicas

A stack desejada é **Next.js + Tailwind + shadcn/ui** e tecnologias análogas necessárias. Diretrizes de alto nível (sem amarrar detalhes que o time pode decidir na implementação):

- **Frontend:** Next.js (App Router) com React, Tailwind para estilos e shadcn/ui para componentes (tabelas, filtros, diálogos, formulários). Tabelas com ordenação/filtragem/paginação são centrais — escolher uma lib de data-grid madura.
- **Backend/API:** camada de API do próprio Next (route handlers/server actions) ou serviço dedicado, conforme preferência do time. O cálculo das regras de negócio deve ficar **no servidor**, em uma camada de domínio isolada e testável — não espalhada na UI.
- **Banco de dados:** relacional (a modelagem é naturalmente relacional: cliente → site → serviços). Usar um ORM com migrations.
- **Autenticação e papéis:** solução de auth com RBAC desde o início.
- **Importação:** parser de planilha para a fase de migração e transição, com **normalização e validação** dos dados legados.
- **Qualidade:** testes automatizados para a camada de regras de negócio (licenciador, ofensor, SLA, faturamento) — são a parte mais sensível e a que mais sofreu correções na planilha.
- **Gráficos:** lib de charting para os painéis (barras, rosca/pizza, distribuições).

> Decisões mais específicas (provedor de banco, hospedagem, biblioteca exata de tabela ou gráfico) podem ser tomadas na implementação. O importante é manter a **camada de domínio isolada e testada**, porque é onde mora o valor e o histórico de regras.

---

## 11. Como conduzir o desenvolvimento com o Claude Code

Sugestões práticas para tirar o melhor proveito:

1. **Comece pelo contexto.** Mantenha este documento no repositório e peça ao Claude Code para lê-lo antes de gerar código. Crie também um arquivo curto de instruções do projeto apontando para ele.
2. **Modele o domínio primeiro.** Peça a modelagem das entidades e das regras (seção 4 e 5) antes de qualquer tela. Valide os cálculos com casos reais conhecidos (ex.: um site com viabilidade + licenciamento deve mostrar dois responsáveis).
3. **Vá por fatias verticais.** Em vez de "todo o backend e depois todo o frontend", entregue uma funcionalidade completa por vez (ex.: tela de carteira do licenciador ponta a ponta).
4. **Teste as regras de negócio.** Peça testes para licenciador, ofensor, SLA e faturamento. Use os números da operação como referência de validação.
5. **Importe dados reais cedo.** Use a exportação do WDM para popular o ambiente e validar contra a realidade — isso revela os problemas de qualidade de dado logo no início.
6. **Trate qualidade de dado como requisito.** Normalização de classificações, unificação de tipo de Site ID e obrigatoriedade de responsável devem estar no importador e nos formulários.
7. **Itere os painéis com dados reais.** A planilha atual é o melhor espelho do que a diretoria espera ver — use-a como referência visual e de conteúdo.

---

## 12. Riscos e pontos de atenção

- **Migração de dados legados:** a base do WDM tem inconsistências (ortografia, tipos, campos vazios). O importador precisa normalizar e reportar o que não conseguiu resolver.
- **Fidelidade das regras:** licenciador, ofensor, SLA e faturamento passaram por muitas correções. Pequenos desvios geram números errados e perda de confiança no sistema. Testar contra casos conhecidos é inegociável.
- **Adoção da equipe:** o sistema só vira fonte única se for mais fácil que o WDM+planilha. Priorizar as telas que a equipe usa todo dia (carteira, atualização, faturamento).
- **Transição, não big-bang:** conviver com o WDM por um período (importando dados) reduz risco. Planejar o ponto de corte.
- **Concorrência multiusuário:** como várias pessoas atualizam ao longo do dia, tratar edição concorrente e manter trilha de auditoria.

---

## 13. Resumo executivo

A Busca Site precisa transformar o par "WDM + planilha" em um **sistema único, multiusuário e proativo** de gestão de licenciamento. As regras de negócio já estão maduras e validadas na planilha atual — o trabalho é portá-las para uma plataforma web (Next.js + Tailwind + shadcn/ui) com a inteligência no servidor, dados confiáveis e painéis ao vivo. O caminho recomendado é incremental: primeiro o painel de leitura sobre dados importados, depois a operação de escrita substituindo o WDM, e por fim a camada proativa de alertas e comunicação. O fator de sucesso decisivo é a **fidelidade das regras** (licenciador, ofensor, SLA, faturamento) e a **qualidade do dado na entrada**.
