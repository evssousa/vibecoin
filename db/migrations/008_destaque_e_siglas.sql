-- Vibecoin · migration 008 · destaque da home e siglas nos títulos
-- 1) O guia "O que é bitcoin" foi criado com featured = 1 (migration 004) e ficou preso no destaque da home por
--    dias, na frente das notícias novas. Solta o destaque. (O código também mudou: a marcação manual passou a valer só
--    por 72 h e guia nunca é destaque automático.)
-- 2) Um post antigo do robô saiu com a sigla em minúsculas ("xrp"). REPLACE diferencia maiúsculas de minúsculas, então
--    só troca o que está em minúsculas. Só título, linha fina e meta description (o corpo tem links com "xrp" no endereço).

SET NAMES utf8mb4;

UPDATE posts SET featured = 0 WHERE section = 'guias' AND slug = 'o-que-e-bitcoin-de-verdade';

UPDATE posts
   SET title = REPLACE(title, 'xrp', 'XRP'),
       excerpt = REPLACE(excerpt, 'xrp', 'XRP'),
       meta_description = REPLACE(meta_description, 'xrp', 'XRP')
 WHERE origin = 'auto' AND (title LIKE '%xrp%' OR excerpt LIKE '%xrp%' OR meta_description LIKE '%xrp%');
