-- Vibecoin · migration 001 · estrutura inicial
-- Compatível com MySQL 8 e MariaDB 10.6+ (Hostinger). Aplicada pelo servidor ao iniciar.
-- Campos JSON: no MariaDB o tipo JSON é um LONGTEXT com validação; o app trata os dois casos.
-- Datas sempre em UTC.

SET NAMES utf8mb4;

-- Matérias (automáticas ou manuais).
CREATE TABLE posts (
  id                INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  section           VARCHAR(20)   NOT NULL,               -- noticias|bitcoin|altcoins|mercado|grana|regulacao|guias
  slug              VARCHAR(200)  NOT NULL,
  status            ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  origin            ENUM('auto','manual') NOT NULL DEFAULT 'auto',
  title             VARCHAR(300)  NOT NULL,
  excerpt           VARCHAR(600)  NOT NULL,
  tag               VARCHAR(40)   NULL,                   -- substitui o rótulo da editoria no card
  coins             JSON          NOT NULL,               -- slugs de coins citadas: ["bitcoin","ethereum"]
  level             TINYINT UNSIGNED NULL,                -- só guias: 1 iniciante, 2 intermediário, 3 avançado
  author            VARCHAR(120)  NOT NULL DEFAULT 'Redação Vibecoin',
  read_minutes      TINYINT UNSIGNED NOT NULL DEFAULT 3,
  image_url         VARCHAR(500)  NULL,
  image_alt         VARCHAR(300)  NULL,
  image_credit      VARCHAR(200)  NULL,
  body              JSON          NOT NULL,               -- blocos: [{type:"p",text}, {type:"h2",text}, ...]
  meta_description  VARCHAR(200)  NULL,
  focus_keyword     VARCHAR(120)  NULL,
  tags              JSON          NULL,
  featured          TINYINT(1)    NOT NULL DEFAULT 0,
  views             INT UNSIGNED  NOT NULL DEFAULT 0,
  source_name       VARCHAR(120)  NULL,
  source_url        VARCHAR(500)  NULL,
  published_at      DATETIME      NULL,
  updated_at        DATETIME      NULL,                   -- última atualização editorial
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_posts_section_slug (section, slug),
  KEY ix_posts_status_date (status, published_at),
  KEY ix_posts_section_date (section, status, published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Moedas acompanhadas. A cotação é preenchida pelo job "cotacoes" (CoinGecko); sem preço, a moeda não aparece.
CREATE TABLE coins (
  id              INT UNSIGNED   NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug            VARCHAR(60)    NOT NULL,                -- endereço no site: /cotacoes/<slug>
  gecko_id        VARCHAR(80)    NOT NULL,                -- id na CoinGecko (ex.: "ripple" para o XRP)
  symbol          VARCHAR(20)    NOT NULL,
  name            VARCHAR(80)    NOT NULL,
  description     TEXT           NOT NULL,
  stable          TINYINT(1)     NOT NULL DEFAULT 0,      -- stablecoin: fora do simulador e da faixa do topo
  active          TINYINT(1)     NOT NULL DEFAULT 1,
  market_rank     INT UNSIGNED   NULL,
  price_brl       DECIMAL(28,10) NULL,
  price_usd       DECIMAL(28,10) NULL,
  change_24h      DECIMAL(10,4)  NULL,
  change_7d       DECIMAL(10,4)  NULL,
  market_cap_brl  DECIMAL(24,2)  NULL,
  volume_24h_brl  DECIMAL(24,2)  NULL,
  spark_7d        JSON           NULL,                    -- ~42 pontos em reais (minigráfico)
  image_url       VARCHAR(300)   NULL,
  quoted_at       DATETIME       NULL,                    -- hora da cotação na CoinGecko
  UNIQUE KEY uq_coins_slug (slug),
  UNIQUE KEY uq_coins_gecko (gecko_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fechamento mensal em reais (simulador de aporte). Cresce um mês por mês: a CoinGecko gratuita só dá 365 dias.
CREATE TABLE coin_history (
  coin_id    INT UNSIGNED   NOT NULL,
  month      CHAR(7)        NOT NULL,                    -- AAAA-MM
  price_brl  DECIMAL(28,10) NOT NULL,
  PRIMARY KEY (coin_id, month),
  CONSTRAINT fk_history_coin FOREIGN KEY (coin_id) REFERENCES coins (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Corretoras do comparador: dados conferidos à mão, com data.
CREATE TABLE brokers (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug          VARCHAR(80)   NOT NULL,
  name          VARCHAR(120)  NOT NULL,
  url           VARCHAR(300)  NOT NULL,
  maker_fee     DECIMAL(6,3)  NOT NULL,
  taker_fee     DECIMAL(6,3)  NOT NULL,
  pix_deposit   VARCHAR(60)   NOT NULL,
  pix_withdraw  VARCHAR(60)   NOT NULL,
  coins_count   INT UNSIGNED  NOT NULL DEFAULT 0,
  features      JSON          NOT NULL,
  checked_at    DATE          NOT NULL,
  active        TINYINT(1)    NOT NULL DEFAULT 1,
  UNIQUE KEY uq_brokers_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fontes monitoradas pelo robô (RSS) — usadas a partir da fase 3.
CREATE TABLE feeds (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(120)  NOT NULL,
  url              VARCHAR(500)  NOT NULL,
  language         VARCHAR(10)   NOT NULL DEFAULT 'en',
  section_hint     VARCHAR(20)   NULL,
  weight           TINYINT       NOT NULL DEFAULT 5,
  active           TINYINT(1)    NOT NULL DEFAULT 1,
  last_fetched_at  DATETIME      NULL,
  last_error       VARCHAR(500)  NULL,
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_feeds_url (url(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Itens lidos dos feeds: a fila de pautas do robô.
CREATE TABLE feed_items (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  feed_id       INT UNSIGNED  NOT NULL,
  guid_hash     CHAR(64)      NOT NULL,
  title         VARCHAR(400)  NOT NULL,
  url           VARCHAR(600)  NOT NULL,
  summary       TEXT          NULL,
  published_at  DATETIME      NULL,
  status        ENUM('new','used','skipped','failed') NOT NULL DEFAULT 'new',
  score         SMALLINT      NOT NULL DEFAULT 0,
  reason        VARCHAR(500)  NULL,
  post_id       INT UNSIGNED  NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_feed_items_guid (guid_hash),
  KEY ix_feed_items_status (status, published_at),
  CONSTRAINT fk_feed_items_feed FOREIGN KEY (feed_id) REFERENCES feeds (id) ON DELETE CASCADE,
  CONSTRAINT fk_feed_items_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Histórico das execuções dos jobs (cron).
CREATE TABLE cron_runs (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  job          VARCHAR(40)   NOT NULL,
  status       ENUM('running','ok','error','skipped') NOT NULL DEFAULT 'running',
  started_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at  DATETIME      NULL,
  message      VARCHAR(1000) NULL,
  stats        JSON          NULL,
  KEY ix_cron_runs_job (job, started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Configurações e valores calculados (panorama do mercado, robô...).
CREATE TABLE settings (
  name        VARCHAR(80)  NOT NULL PRIMARY KEY,
  value       JSON         NOT NULL,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO settings (name, value) VALUES
  ('posts_per_day', '4'),
  ('robot_enabled', 'false');

-- As 20 moedas acompanhadas no lançamento (dá para ativar/desativar depois).
INSERT INTO coins (slug, gecko_id, symbol, name, stable, description) VALUES
  ('bitcoin', 'bitcoin', 'BTC', 'Bitcoin', 0, 'A primeira e maior criptomoeda, criada em 2009 por alguém sob o pseudônimo Satoshi Nakamoto. Funciona sem banco central e tem oferta limitada a 21 milhões de unidades.'),
  ('ethereum', 'ethereum', 'ETH', 'Ethereum', 0, 'Rede de contratos inteligentes lançada em 2015. É onde roda a maior parte das finanças descentralizadas (DeFi), dos NFTs e das stablecoins. O ether (ETH) paga as taxas da rede.'),
  ('tether', 'tether', 'USDT', 'Tether', 1, 'Stablecoin atrelada ao dólar americano: cada USDT busca valer US$ 1. É a criptomoeda mais negociada do mundo, usada para sair e entrar de posições sem passar pelo real.'),
  ('xrp', 'ripple', 'XRP', 'XRP', 0, 'Moeda da rede XRP Ledger, criada em 2012 com foco em pagamentos e remessas internacionais rápidas e baratas.'),
  ('bnb', 'binancecoin', 'BNB', 'BNB', 0, 'Moeda da BNB Chain, rede ligada à corretora Binance. É usada para pagar taxas na rede e para descontos em serviços do ecossistema.'),
  ('solana', 'solana', 'SOL', 'Solana', 0, 'Blockchain de alta velocidade e taxas baixas, lançada em 2020. Ficou popular em memecoins, pagamentos e aplicativos de consumo.'),
  ('usdc', 'usd-coin', 'USDC', 'USD Coin', 1, 'Stablecoin atrelada ao dólar americano, emitida pela Circle, com reservas em dinheiro e títulos de curto prazo auditadas periodicamente.'),
  ('dogecoin', 'dogecoin', 'DOGE', 'Dogecoin', 0, 'A memecoin original, criada em 2013 como brincadeira com o meme do cachorro shiba inu. Não tem limite de oferta e virou uma das maiores criptomoedas do mercado.'),
  ('cardano', 'cardano', 'ADA', 'Cardano', 0, 'Blockchain de contratos inteligentes desenvolvida com base em pesquisa acadêmica revisada por pares, lançada em 2017.'),
  ('tron', 'tron', 'TRX', 'TRON', 0, 'Blockchain muito usada para transferências de stablecoins, principalmente USDT, por causa das taxas baixas.'),
  ('chainlink', 'chainlink', 'LINK', 'Chainlink', 0, 'Rede de oráculos que leva dados do mundo real (preços, resultados, clima) para contratos inteligentes de várias blockchains.'),
  ('avalanche', 'avalanche-2', 'AVAX', 'Avalanche', 0, 'Plataforma de contratos inteligentes que permite criar redes próprias (sub-redes) e se destaca pela finalização rápida das transações.'),
  ('stellar', 'stellar', 'XLM', 'Stellar', 0, 'Rede de pagamentos criada em 2014 para transferências baratas entre moedas e países, inclusive de moedas tradicionais tokenizadas.'),
  ('toncoin', 'the-open-network', 'TON', 'Toncoin', 0, 'Moeda da The Open Network, blockchain integrada ao aplicativo de mensagens Telegram.'),
  ('shiba-inu', 'shiba-inu', 'SHIB', 'Shiba Inu', 0, 'Memecoin lançada em 2020 inspirada na Dogecoin, que depois ganhou rede e aplicativos próprios.'),
  ('polkadot', 'polkadot', 'DOT', 'Polkadot', 0, 'Protocolo que conecta várias blockchains especializadas (parachains) e permite que elas troquem dados e ativos entre si.'),
  ('litecoin', 'litecoin', 'LTC', 'Litecoin', 0, 'Criada em 2011 como uma versão mais rápida do bitcoin, com blocos a cada 2,5 minutos e oferta máxima de 84 milhões.'),
  ('bitcoin-cash', 'bitcoin-cash', 'BCH', 'Bitcoin Cash', 0, 'Surgiu em 2017 de uma divisão (fork) do bitcoin, com blocos maiores para baratear pagamentos do dia a dia.'),
  ('sui', 'sui', 'SUI', 'Sui', 0, 'Blockchain de contratos inteligentes lançada em 2023, criada por ex-engenheiros do projeto de moeda digital do Facebook.'),
  ('uniswap', 'uniswap', 'UNI', 'Uniswap', 0, 'Token de governança da Uniswap, a maior corretora descentralizada (DEX) do Ethereum, onde a troca de moedas acontece direto entre carteiras.');
