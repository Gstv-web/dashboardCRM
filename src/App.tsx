import { useState, useMemo } from 'react';
import { useEtapasData } from './hooks/useEtapasData';
import { useMondayContext } from './hooks/useMondayContext';
import { useMondayData } from './hooks/useMondayData';
import { useEvolucaoData, PeriodoChave } from './hooks/useEvolucaoData';
import { useEvolucaoMesData } from './hooks/useEvolucaoMesData';
import CardEtapa from './components/CardEtapa';
import GraficoEvolucao from './components/GraficoEvolucao';
import GraficoEvolucaoMes from './components/GraficoEvolucaoMes';
import './App.css';

function App() {
  const { boardId } = useMondayContext();
  const { items, isLoading } = useMondayData(boardId);

  const [vendedorVisaoGeral, setVendedorVisaoGeral] = useState<string | undefined>();
  const [vendedorGrafico, setVendedorGrafico] = useState<string | undefined>();
  const [abaAtiva, setAbaAtiva] = useState<string>('Evolução Mês Atual');

  // Estado do ponto selecionado no gráfico (periodo + items)
  const [pontoSelecionado, setPontoSelecionado] = useState<any | null>(null);

  // filtro por etapa na lista exibida (valor de select .etapa-filtro)
  const [etapaFiltro, setEtapaFiltro] = useState<string>('Todas');

  const cores = [
    "#2563eb",
    "#d8ca08ff",
    "#17d45c",
    "#135c25ff",
    "#00a84cff",
    "#da810cff",
    "#64748b",
  ];

  // vendedores únicos
  const vendedoresUnicos = Array.from(
    new Set((items || []).map((i: any) => i.vendedor).filter(Boolean))
  ).sort((a: string, b: string) => a.localeCompare(b));

  const visaoGeralFiltro = useEtapasData(items, vendedorVisaoGeral);

  const itensFiltrados = useMemo(() => {
    if (!items) return [];
    return vendedorGrafico ? items.filter((i: any) => i.vendedor === vendedorGrafico) : items;
  }, [items, vendedorGrafico]);

  // dadosGrafico pode ter tipagem diferente — usamos as guardas em runtime
  const dadosGrafico: any[] = useEvolucaoData(itensFiltrados) as any[] || [];
  const dadosGraficoMes = useEvolucaoMesData(itensFiltrados);

  // lista de etapas (para popular o select de filtro por etapa)
  const etapasDisponiveis = useMemo(() => {
    return Array.from(new Set(dadosGrafico.map(d => String(d?.etapa || '')).filter(Boolean)));
  }, [dadosGrafico]);

  // util: converte período string para chave usada no objeto items (map criado localmente)
  const periodoToKeyMap: Record<string, PeriodoChave> = {
    "7 dias": "dias7",
    "14 dias": "dias14",
    "21 dias": "dias21",
    "30 dias": "dias30",
    "60 dias": "dias60",
    "90 dias": "dias90",
  };

  // RENDER HELPERS
  function formatarData(iso: string | Date | null | undefined) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  }

  function formatarDinheiro(valor: number | string | null | undefined): string {
    const n = Number(valor ?? 0);
    return n.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  return (
    <div className="main flex flex-col items-center w-full h-full overflow-auto bg-white">
      <h1 className="text-5xl font-bold underline p-4">Dashboard CRM</h1>

      <div className="dashboard wrapper flex flex-col gap-10 w-300 justify-center m-4">

        {/* VISÃO GERAL */}
        <div className="dashboard-visao-geral flex flex-col p-4 border-2 border-gray-300 border-opacity-25 rounded-2xl bg-white">
          <div className="filtro flex justify-between items-center">
            <h2 className="font-bold">Visão Geral</h2>

            <div>
              <span className="mr-3">Filtrar por vendedor:</span>
              <select
                className="border p-2 rounded bg-white"
                value={vendedorVisaoGeral || ''}
                onChange={(e) => setVendedorVisaoGeral(e.target.value || undefined)}
              >
                <option value="">Todos os vendedores</option>
                {vendedoresUnicos.map((v: string) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <p className="text-center text-gray-500">Carregando dados...</p>
          ) : (
            <div className="flex gap-20 justify-center flex-wrap m-4">
              {visaoGeralFiltro.map((etapa: any, index: number) => (
                <CardEtapa
                  key={etapa.title}
                  title={etapa.title}
                  total={etapa.total}
                  titleColor={cores[index % cores.length]}
                />
              ))}
            </div>
          )}
        </div>

        {/* GRÁFICO COM ABAS */}
        <div className="dashboard-grafico-area border-2 border-opacity-25 border-gray-300 rounded-2xl">

          <div className="flex border-b border-gray-300">
            {["Evolução Mês Atual", "Evolução 90 dias"].map((aba, i) => (
              <button
                key={i}
                onClick={() => setAbaAtiva(aba)}
                className={`px-6 py-3 font-semibold transition-colors duration-200 ${abaAtiva === aba
                  ? "border-b-4 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                {aba}
              </button>
            ))}
          </div>

          {/* Conteúdo das abas */}
          <div className="p-4">
            {abaAtiva === "Evolução 90 dias" && (
              <>
                <div className="dashboard-filtro flex justify-between items-center p-4">
                  <h2 className="font-bold">Evolução por período</h2>

                  <div>
                    <span className="mr-3">Filtrar por vendedor:</span>
                    <select
                      className="border p-2 rounded bg-white"
                      value={vendedorGrafico || ""}
                      onChange={(e) => setVendedorGrafico(e.target.value || undefined)}
                    >
                      <option value="">Todos os vendedores</option>
                      {vendedoresUnicos.map((v: string) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="dashboard-grafico m-2 p-2">
                  <GraficoEvolucao
                    dados={dadosGrafico}
                    onPontoClick={(p: any) => {
                      // p.periodo vem como "7 dias", "14 dias", etc.
                      const chave = periodoToKeyMap[String(p?.periodo)] as PeriodoChave | undefined;
                      if (!chave) {
                        // defesa: se veio algo inesperado, limpa seleção
                        setPontoSelecionado(null);
                        return;
                      }

                      // compõe lista de todos os itens daquele período (todas as etapas)
                      const todosItens = dadosGrafico.flatMap((et: any) => {
                        // et.items pode não existir; protegemos
                        if (!et || !et.items) return [];
                        const arr = et.items[chave];
                        return Array.isArray(arr) ? arr : [];
                      });

                      // ordena por etapa (string) para ficar agrupado na UI
                      const ordenado = [...todosItens].sort((a: any, b: any) => {
                        const ea = String(a?.etapa ?? '');
                        const eb = String(b?.etapa ?? '');
                        return ea.localeCompare(eb);
                      });

                      setEtapaFiltro('Todas'); // reset filtro por etapa ao abrir
                      setPontoSelecionado({
                        periodo: p.periodo,
                        items: ordenado,
                      });
                    }}
                  />
                </div>

                {/* ⭐ ÁREA QUE EXIBE OS ITENS DO PONTO CLICADO */}
                {pontoSelecionado && (
                  <div className="mt-4 p-4 border rounded-xl bg-gray-50 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-bold text-lg mb-3">
                        {pontoSelecionado.periodo}
                      </h3>

                      {/* Select de filtro por etapa */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm">Filtrar etapa:</label>
                        <select
                          className="etapa-filtro border p-2 rounded bg-white"
                          value={etapaFiltro}
                          onChange={(e) => setEtapaFiltro(e.target.value)}
                        >
                          <option value="Todas">Todas</option>
                          {etapasDisponiveis.map((et: any) => (
                            <option key={et} value={et}>{et}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* aplica filtro por etapa se escolhido */}
                    {(!Array.isArray(pontoSelecionado.items) || pontoSelecionado.items.length === 0) ? (
                      <p className="text-gray-500">Nenhum item neste período.</p>
                    ) : (
                      (() => {
                        const listaFiltrada = etapaFiltro === 'Todas'
                          ? pontoSelecionado.items
                          : pontoSelecionado.items.filter((it: any) => String(it?.etapa || '') === etapaFiltro);

                        if (!listaFiltrada.length) {
                          return <p className="text-gray-500">Nenhum item após filtro.</p>;
                        }

                        return (
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b bg-gray-100">
                                <th className="p-2 text-left">Nome</th>
                                <th className="p-2 text-left">Fechamento</th>
                                <th className="p-2 text-left">Valor</th>
                                <th className="p-2 text-left">Etapa</th>
                                <th className="p-2 text-left">Vendedor</th>
                                <th className="p-2 text-left">Performance</th>
                              </tr>
                            </thead>
                            <tbody>
                              {listaFiltrada.map((item: any) => (
                                <tr key={item.id ?? `${item.name}_${Math.random()}`} className="border-b">
                                  <td className="p-2">{item.name}</td>
                                  <td className="p-2">{formatarData(item?.fechamento_vendas)}</td>
                                  <td className="p-2">{formatarDinheiro(item?.valor_contrato)}</td>
                                  <td className="p-2">{item?.etapa}</td>
                                  <td className="p-2">{item?.vendedor}</td>
                                  <td className="p-2">{item?.performance ?? ''}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        );
                      })()
                    )}
                  </div>
                )}
              </>
            )}

            {abaAtiva === "Evolução Mês Atual" && (
              <>
                <div className="dashboard-filtro flex justify-between items-center p-4">
                  <h2 className="font-bold">Evolução no mês atual</h2>

                  <div>
                    <span className="mr-3">Filtrar por vendedor:</span>
                    <select
                      className="border p-2 rounded bg-white"
                      value={vendedorGrafico || ""}
                      onChange={(e) => setVendedorGrafico(e.target.value || undefined)}
                    >
                      <option value="">Todos os vendedores</option>
                      {vendedoresUnicos.map((v: string) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="dashboard-grafico m-2 p-2">
                  <GraficoEvolucaoMes dados={dadosGraficoMes} />
                </div>
              </>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
