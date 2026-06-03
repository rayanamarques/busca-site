import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combina classes Tailwind condicionalmente (padrão shadcn/ui). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Formata número inteiro com separador de milhar pt-BR. */
export function fmtInt(n: number): string {
  return new Intl.NumberFormat("pt-BR").format(Math.round(n));
}

/** Formata data ISO -> dd/mm/aaaa (ou "—"). */
export function fmtData(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}
