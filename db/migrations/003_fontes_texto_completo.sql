-- Vibecoin · migration 003 · fontes que trazem a matéria inteira no RSS
-- Em 2026-11-13 o robô publicou só 1 matéria sozinho: o servidor da Hostinger não consegue abrir a
-- página de vários sites, e o resumo do RSS deles tem ~25 palavras. Estas três trazem o texto completo
-- no próprio feed (testado: BeInCrypto ~440 palavras, CoinJournal ~650, Bitcoinist ~790).
-- NewsBTC também traz, mas é quase só análise de preço: ficou de fora.

SET NAMES utf8mb4;

INSERT IGNORE INTO feeds (name, url, language, section_hint, weight) VALUES
  ('BeInCrypto', 'https://beincrypto.com/feed/', 'en', 'noticias', 7),
  ('CoinJournal', 'https://coinjournal.net/feed/', 'en', 'noticias', 6),
  ('Bitcoinist', 'https://bitcoinist.com/feed/', 'en', 'bitcoin', 5);
