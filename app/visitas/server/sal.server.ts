// Sal diário do código de visitante: um valor aleatório que muda a cada dia (de Brasília) e é apagado ao virar o dia.
// Sem o sal de ontem, os códigos de ontem não voltam a ser ligados a ninguém. Fica na tabela visit_salt (uma linha só).
import { randomBytes } from "node:crypto";
import { exec, query } from "../db";

let cache: { dia: string; sal: string } | null = null;

const ler = async () => (await query<{ dia: string; sal: string }>("SELECT DATE_FORMAT(day, '%Y-%m-%d') AS dia, salt AS sal FROM visit_salt WHERE id = 1"))[0] ?? null;

/** O sal de `dia`. Se o guardado é de outro dia, troca (só uma vez, mesmo com vários processos) e devolve o novo. */
export async function salDoDia(dia: string): Promise<string> {
  if (cache?.dia === dia) return cache.sal;
  let atual = await ler();
  if (atual?.dia !== dia) {
    // Se outro processo já gravou o sal de hoje entre a leitura e a escrita, mantém o dele.
    await exec(
      "INSERT INTO visit_salt (id, day, salt) VALUES (1, ?, ?) ON DUPLICATE KEY UPDATE salt = IF(day = VALUES(day), salt, VALUES(salt)), day = VALUES(day)",
      [dia, randomBytes(32).toString("hex")],
    );
    atual = await ler();
  }
  if (!atual) throw new Error("sal de visitas indisponível");
  cache = atual;
  return atual.sal;
}

/** Só para os testes. */
export function esquecerSal() {
  cache = null;
}
