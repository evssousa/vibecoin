// Contador antigo das matérias. A contagem passou para o módulo app/visitas (POST /api/v, no site inteiro).
// Fica respondendo 204 por alguns dias porque o HTML guardado na CDN ainda chama este endereço. Pode ser apagado depois.
export async function loader() {
  return new Response(null, { status: 405 });
}

export async function action() {
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
