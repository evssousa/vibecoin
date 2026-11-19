-- Vibecoin · migration 009 · desativa duas fontes que só geraram descarte
-- Conferência de 2026-11-19 (3 dias depois da migration 007): Cryptonews e CryptoPotato não renderam nenhuma matéria,
-- nem como fonte principal nem como apoio de um grupo. O que elas trouxeram foi previsão de preço / análise técnica
-- (descartada pelo filtro) ou pauta que expirou sem uso. Protos e Crypto Briefing ficam: Crypto Briefing apareceu como
-- fonte em 5 das 16 matérias do período e abriu a editoria Regulação.
-- Só desativa (active = 0): o histórico das pautas fica, e dá para religar em /admin → Fontes.

SET NAMES utf8mb4;

UPDATE feeds SET active = 0 WHERE name IN ('Cryptonews', 'CryptoPotato');
