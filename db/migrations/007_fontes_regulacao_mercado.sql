-- Vibecoin · migration 007 · mais fontes para Regulação e Mercado (testadas em 2026-11-16)
-- Critério: texto aproveitável (no RSS ou na página que o servidor consegue abrir) e conteúdo de
-- regulação, tribunais, ETFs e mercado. Pesos baixos: entram na fila sem passar à frente das fontes principais.
--   Protos          RSS ~560 palavras  · reportagens sobre ataques, tribunais e fluxo de dinheiro
--   Crypto Briefing página ~900        · cobertura ampla: mercado, empresas, política
--   Cryptonews      RSS ~790           · ETFs, empresas e regulação
--   CryptoPotato    RSS ~450           · mercado e fluxo de ETFs
-- Descartadas no teste: CVM e Receita (feeds do gov.br trazem páginas soltas, não notícias; licença sem
-- obras derivadas), Câmara e Senado (política geral, nenhum item de cripto em 35), Finbold (ações e previsão de preço),
-- U.Today e Coinspeaker (muito conteúdo patrocinado).
-- O campo section_hint é só uma anotação: o robô escolhe a editoria pelo conteúdo.

SET NAMES utf8mb4;

INSERT IGNORE INTO feeds (name, url, language, section_hint, weight) VALUES
  ('Protos', 'https://protos.com/feed/', 'en', 'regulacao', 6),
  ('Crypto Briefing', 'https://cryptobriefing.com/feed/', 'en', 'mercado', 5),
  ('Cryptonews', 'https://cryptonews.com/news/feed/', 'en', 'noticias', 5),
  ('CryptoPotato', 'https://cryptopotato.com/feed/', 'en', 'mercado', 4);
