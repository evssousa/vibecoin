-- Vibecoin · migration 002 · robô de postagem
-- Fontes RSS testadas em 2026-11-13 (feed responde; quem bloqueia a página da matéria fica com o texto do RSS),
-- mídia das pautas e configurações do robô. O robô só escreve com GEMINI_API_KEY no hPanel.

SET NAMES utf8mb4;

-- Imagens, vídeos e links oficiais lidos do RSS (para escolher a capa sem baixar a página).
ALTER TABLE feed_items ADD COLUMN media JSON NULL AFTER summary;

-- Peso de 1 a 10: prioridade na escolha da pauta. section_hint é só referência.
INSERT INTO feeds (name, url, language, section_hint, weight) VALUES
  ('Cointelegraph', 'https://cointelegraph.com/rss', 'en', 'noticias', 9),
  ('Decrypt', 'https://decrypt.co/feed', 'en', 'noticias', 8),
  ('CoinDesk', 'https://www.coindesk.com/arc/outboundfeeds/rss/', 'en', 'noticias', 8),
  ('Bitcoin Magazine', 'https://bitcoinmagazine.com/feed', 'en', 'bitcoin', 7),
  ('The Block', 'https://www.theblock.co/rss.xml', 'en', 'noticias', 6),
  ('CryptoSlate', 'https://cryptoslate.com/feed/', 'en', 'altcoins', 6),
  ('The Defiant', 'https://thedefiant.io/api/feed', 'en', 'altcoins', 6),
  ('Blockworks', 'https://blockworks.co/feed', 'en', 'mercado', 5),
  ('Agência Brasil (Economia)', 'https://agenciabrasil.ebc.com.br/rss/economia/feed.xml', 'pt', 'grana', 6);

INSERT INTO settings (name, value) VALUES
  ('robot_sections', '["noticias","bitcoin","altcoins","mercado","grana","regulacao"]'),
  ('robot_min_words', '350'),
  ('robot_start_hour', '8'),
  ('robot_end_hour', '22')
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- Liga o robô (sem GEMINI_API_KEY ele só registra "sem chave" e não publica nada).
UPDATE settings SET value = 'true' WHERE name = 'robot_enabled';
