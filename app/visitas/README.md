# Módulo de visitas (copiável entre os sites)

Contagem própria, sem cookie e sem guardar IP, com painel. Nasceu no animeprofile (`docs/plano-painel-visitas.md` de lá) e foi copiado para o vibecoin. Para levar a outro site:

1. Copie esta pasta (`app/visitas/`).
2. Ajuste só: `config.ts` (nome, hosts, cookie do admin, tipos de página, filtros, títulos fixos, contador por matéria), `db.ts` (ponte com o banco do site: `query`, `exec`, `hasDatabase`), `site.server.ts` (títulos por endereço) e `ui/visitas.css` (cores).
3. Crie a migration com o próximo número a partir de `sql/visitas.sql` (e cole o SQL no chat). O vibecoin usa a tabela `visit_salt` para o sal diário; o animeprofile usa `system_config`.
4. Ligue: `<VisitBeacon />` dentro do `App` de `root.tsx`; a rota `POST /api/v` (`routes/api-v.ts`, chama `registrar(request)` e responde 204); a rota do painel (`routes/admin/visitas.tsx`, protegida pelo login do admin do site); o item "Visitas" no menu do admin.
5. Tire o contador antigo da página da matéria e deixe o endereço antigo respondendo 204 por uma semana.
6. A retenção (`limparVisitas`) roda sozinha uma vez por dia dentro de `gravarAgora`.

Regra: nada aqui dentro importa de fora, exceto `db.ts` (banco), `isbot`, `react` e `react-router`.
