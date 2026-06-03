# Busca Site — Sistema de Gestão de Licenciamento

Sistema web para a operação de licenciamento da **Busca Site Marques Engenharia**:
fonte única que substitui o par "WDM + planilha", com cálculo automático de
**licenciador, ofensor, SLA, atualização do cliente, faturamento e score de
prioridade** por site, e painel executivo ao vivo.

A especificação completa do negócio e das regras está em [`CONTEXT.md`](./CONTEXT.md)
(documento de discovery — fonte de verdade).

## Status — Fase 0 + Fase 1 (Fundação + Painel de leitura)

- ✅ **Camada de domínio** (`src/domain/`) — regras de negócio em TypeScript puro,
  **com testes** (licenciador, ofensor, SLA, faturamento, score, normalização).
- ✅ **Autenticação** (Supabase Auth) com proteção de rotas via middleware.
- ✅ **Dashboard executivo** — KPIs, ofensor, pendentes por etapa, carga por
  licenciador, faturamento e top prioridade.
- ✅ **Visão por site** (CAMADA_SITE) — tabela filtrável por cliente, ofensor e SLA.
- ✅ **Banco Supabase (Postgres)** com schema, RLS e dados de exemplo da operação.

Próximas fases (ver `CONTEXT.md` §9): escrita/CRUD e auditoria (Fase 2), alertas
proativos (Fase 3), portal do cliente e integrações (Fase 4).

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Supabase** (Postgres + Auth) via `@supabase/ssr`
- **Recharts** (gráficos) · **Vitest** (testes)

## Arquitetura

```
src/
  domain/          # Regras de negócio (puro, testado) — o coração do sistema
    types.ts         entidades e enums
    config.ts        parâmetros de SLA (configuráveis, §6.3)
    normalize.ts     normalização de dados legados (§4.3)
    sla.ts           régua de SLA por serviço (§5.5)
    ofensor.ts       ofensor por serviço e do site (§5.3)
    licenciador.ts   licenciador(es) do site (§5.2)
    faturamento.ts   status de faturamento (§5.4)
    atualizacao.ts   atualização do cliente (§5.6)
    score.ts         score de prioridade (§5.7)
    site.ts          agregação serviço → site (§4.1)
    __tests__/       testes das regras
  lib/
    supabase/        clientes server/browser + middleware de sessão
    data.ts          leitura do Supabase → domínio
    metrics.ts       indicadores do dashboard (§8.4)
  components/        UI (cards, badges, tabela, gráficos)
  app/
    login/           autenticação
    (app)/           shell autenticado: dashboard e /sites
```

A regra de negócio é calculada **no servidor**, em uma camada de domínio isolada e
testável, conforme as diretrizes técnicas do discovery (§10).

## Como rodar

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Configure o ambiente (apontando para o projeto Supabase "Busca Site"):
   ```bash
   cp .env.example .env.local   # e preencha URL + chave publishable
   ```
3. Rode os testes da camada de domínio:
   ```bash
   npm test
   ```
4. Suba o app:
   ```bash
   npm run dev      # http://localhost:3000
   ```

O banco já está provisionado no Supabase com schema, políticas RLS e dados de
exemplo (equipe real da §3.2 e ~16 sites cobrindo todas as regras).

## Banco de dados

Schema e seeds versionados como migrations no projeto Supabase `bsponamvntesfalqwuvb`:
`pessoas`, `sites`, `servicos` — com RLS habilitada (leitura para usuários
autenticados nesta fase de painel; escrita virá na Fase 2).
