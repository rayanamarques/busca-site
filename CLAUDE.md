@AGENTS.md

# Instruções do projeto — Busca Site

Antes de gerar qualquer código, **leia o `CONTEXT.md`** (discovery): ele é a fonte
de verdade sobre o negócio, o glossário, o modelo de dados e as regras de negócio
(licenciador, ofensor, SLA, faturamento, score).

## Princípios

- A **camada de domínio** (`src/domain/`) é o coração do sistema. É TypeScript puro,
  sem dependência de banco/UI, e **é a parte mais testada**. Qualquer regra de negócio
  vive aqui, não na UI. Mudou uma regra? Atualize o teste correspondente.
- Os **parâmetros de SLA são configuráveis** (`src/domain/config.ts`), nunca fixos
  espalhados pelo código.
- **Normalize dados na entrada** (`src/domain/normalize.ts`): ortografia das
  classificações, Site ID texto/número, situações.
- Calcule **no nível do serviço** e depois **agregue para o site** (`src/domain/site.ts`).

## Comandos

- `npm run dev` — desenvolvimento
- `npm test` — testes da camada de domínio (Vitest)
- `npm run build` — build de produção
