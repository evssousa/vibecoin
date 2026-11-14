-- Vibecoin · migration 005 · comparador de corretoras (dados conferidos nos sites oficiais em 2026-11-14)
-- Taxas da faixa inicial de volume, em %. maker/taker iguais quando a corretora cobra uma taxa só.
-- A coluna coins_count fica em 0: só o Mercado Bitcoin divulga o número, e ele muda de página para página
-- (a tela não mostra a coluna "Moedas").
-- NovaDAX ficou de fora: as páginas oficiais de taxas bloquearam a conferência.
-- INSERT IGNORE: para corrigir uma taxa depois, edite a linha no banco (ou crie nova migration com UPDATE).

SET NAMES utf8mb4;

INSERT IGNORE INTO brokers (slug, name, url, maker_fee, taker_fee, pix_deposit, pix_withdraw, coins_count, features, checked_at, active) VALUES
  ('binance', 'Binance', 'https://www.binance.com/pt-BR', 0.100, 0.100, 'Sem taxa', 'R$ 3,50 (FAQ de ago/2024)', 0,
    '["Desconto de 25% pagando taxa em BNB", "Faixas VIP por volume"]', '2026-11-14', 1),
  ('bitso', 'Bitso', 'https://bitso.com/br', 0.200, 0.400, 'Sem taxa', 'Sem taxa', 0,
    '["Taxa cai conforme o volume mensal (faixa inicial até R$ 541 mil)"]', '2026-11-14', 1),
  ('foxbit', 'Foxbit', 'https://www.foxbit.com.br', 0.250, 0.500, 'Taxa não informada na página', 'Sem taxa', 0,
    '["Faixas VIP por volume em 30 dias (inicial até R$ 25 mil)"]', '2026-11-14', 1),
  ('mercado-bitcoin', 'Mercado Bitcoin', 'https://www.mercadobitcoin.com.br', 0.300, 0.700, 'Sem taxa (mínimo R$ 1)', 'Sem taxa (mínimo R$ 1)', 0,
    '["Negociação Rápida (botão simples do app): 0,7% a 3% por operação", "Taxas da tabela valem para a negociação clássica/PRO"]', '2026-11-14', 1);
