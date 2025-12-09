import { useState, useMemo } from "react";
import { useEtapasData } from "./hooks/useEtapasData";
import { useMondayContext } from "./hooks/useMondayContext";
import { useMondayData } from "./hooks/useMondayData";
import { useEvolucaoData, PeriodoChave } from "./hooks/useEvolucaoData";
import { useEvolucaoMesData } from "./hooks/useEvolucaoMesData";
import CardEtapa from "./components/CardEtapa";
import GraficoEvolucao from "./components/GraficoEvolucao";
import GraficoEvolucaoMes from "./components/GraficoEvolucaoMes";
import "./App.css";

function App() {
  const { boardId } = useMondayContext();
  const { items, isLoading } = useMondayData(boardId);

  const [vendedorVisaoGeral, setVendedorVisaoGeral] = useState<string>();
  const [vendedorGrafico, setVendedorGrafico] = useState<string>();
  const [abaAtiva, setAbaAtiva] = useState<string>("Evolução Mês Atual");

  // Estado do ponto selecionado
  const [pontoSelecionado, setPontoSelecionado] = useState<any | null>(null);

  // ⭐ Estado do filtro por etapa dentro do popup
  const [filtroEtapa, setFiltroEtapa] = useState<string>("");

  const cores = [
    "#2563eb",
    "#d8ca08ff",
    "#17d45c",
    "#135c25ff",
    "#00a84cff",
    "#da810cff",
    "#64748b",
  ];

  // 🔥 Arrumando tipagem: forçamos string[]
  const vendedoresUnicos: string[] = Array.from(
    new Set(items.map((i) => i.vendedor).filter(Boolean) as string[])
  ).sort();

  const visaoGeralFiltro = useEtapasData(items, vendedorVisaoGeral);

  const itensFiltrados = useMemo(() => {
    if (!items) return [];
    return vendedorGrafico
      ? items.filter((i) => i.vendedor === vendedorGrafico)
      : items;
  }, [items, vendedorGrafico]);

  const dadosGrafico = useEvolucaoData(itensFiltrados);
  const dadosGraficoMes = useEvolucaoMesData(itensFiltrados);
  console.log("dados de useEvolucaoMesData em App.tsx:", dadosGraficoMes);
  // console.log("dados de useEvolucaoData em App.tsx:", dadosGrafico);

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

  // 🔥 Etapas únicas tipadas corretamente
  const etapasUnicas: string[] = pontoSelecionado
    ? Array.from(
        new Set(
          (pontoSelecionado.items ?? [])
            .map((i: any) => i.etapa)
            .filter(Boolean) as string[]
        )
      ).sort()
    : [];

  // 🔥 Filtra a tabela quando um filtro de etapa é escolhido
  const itensFiltradosPorEtapa = pontoSelecionado
    ? pontoSelecionado.items.filter((i: any) =>
        filtroEtapa ? i.etapa === filtroEtapa : true
      )
    : [];

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
                value={vendedorVisaoGeral || ""}
                onChange={(e) =>
                  setVendedorVisaoGeral(e.target.value || undefined)
                }
              >
                <option value="">Todos os vendedores</option>
                {vendedoresUnicos.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <p className="text-center text-gray-500">Carregando dados...</p>
          ) : (
            <div className="flex gap-20 justify-center flex-wrap m-4">
              {visaoGeralFiltro.map((etapa, index) => (
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
            {["Evolução Mês Atual", "Evolução 90 dias"].map((aba) => (
              <button
                key={aba}
                onClick={() => setAbaAtiva(aba)}
                className={`px-6 py-3 font-semibold transition-colors duration-200 ${
                  abaAtiva === aba
                    ? "border-b-4 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {aba}
              </button>
            ))}
          </div>

          <div className="p-4">
            {/* ===================== EVOLUÇÃO 90 DIAS ======================= */}
            {abaAtiva === "Evolução 90 dias" && (
              <>
                <div className="dashboard-filtro flex justify-between items-center p-4">
                  <h2 className="font-bold">Evolução por período</h2>

                  <div>
                    <span className="mr-3">Filtrar por vendedor:</span>
                    <select
                      className="border p-2 rounded bg-white"
                      value={vendedorGrafico || ""}
                      onChange={(e) =>
                        setVendedorGrafico(e.target.value || undefined)
                      }
                    >
                      <option value="">Todos os vendedores</option>
                      {vendedoresUnicos.map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="dashboard-grafico m-2 p-2">
                  <GraficoEvolucao
                    dados={dadosGrafico}
                    onPontoClick={(p) => {
                      const mapaPeriodos: Record<string, PeriodoChave> = {
                        "7 dias": "dias7",
                        "14 dias": "dias14",
                        "21 dias": "dias21",
                        "30 dias": "dias30",
                        "60 dias": "dias60",
                        "90 dias": "dias90",
                      };

                      const chave = mapaPeriodos[p.periodo];
                      if (!chave) return;

                      const itens = dadosGrafico.flatMap((etapa) => {
                        return etapa.items[chave] ?? [];
                      });

                      setFiltroEtapa("");

                      setPontoSelecionado({
                        ...p,
                        items: [...itens].sort((a, b) =>
                          a.etapa.localeCompare(b.etapa)
                        ),
                      });
                    }}
                  />
                </div>

                {/* ITENS DO PONTO CLICADO */}
                {pontoSelecionado && (
                  <div className="mt-4 p-4 border rounded-xl bg-gray-50 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <h3 className="font-bold text-lg">
                        {pontoSelecionado.periodo}
                      </h3>

                      <select
                        className="etapa-filtro border p-2 rounded bg-white ml-auto"
                        value={filtroEtapa}
                        onChange={(e) => setFiltroEtapa(e.target.value)}
                      >
                        <option value="">Todas as etapas</option>
                        {etapasUnicas.map((etapa) => (
                          <option key={etapa}>{etapa}</option>
                        ))}
                      </select>
                    </div>

                    {!itensFiltradosPorEtapa.length ? (
                      <p className="text-gray-500">
                        Nenhum item neste período.
                      </p>
                    ) : (
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
                          {itensFiltradosPorEtapa.map((item: any) => (
                            <tr key={item.id} className="border-b">
                              <td className="p-2">{item.name}</td>
                              <td className="p-2">
                                {formatarData(item?.fechamento_vendas)}
                              </td>
                              <td className="p-2">
                                {formatarDinheiro(item.valor_contrato)}
                              </td>
                              <td className="p-2">{item.etapa}</td>
                              <td className="p-2">{item.vendedor}</td>
                              <td className="p-2">{item.performance}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ====================== MÊS ATUAL =========================== */}
            {abaAtiva === "Evolução Mês Atual" && (
              <>
                <div className="dashboard-filtro flex justify-between items-center p-4">
                  <h2 className="font-bold">Evolução no mês atual</h2>

                  <div>
                    <span className="mr-3">Filtrar por vendedor:</span>
                    <select
                      className="border p-2 rounded bg-white"
                      value={vendedorGrafico || ""}
                      onChange={(e) =>
                        setVendedorGrafico(e.target.value || undefined)
                      }
                    >
                      <option value="">Todos os vendedores</option>
                      {vendedoresUnicos.map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="dashboard-grafico m-2 p-2">
                  <GraficoEvolucaoMes 
                    dados={dadosGraficoMes}
                    onPontoClick={(p) => console.log("ponto clicado no gráfico mês atual:", p)}
                  />
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