import { useState, useMemo } from "react";
import { useEtapasData } from "./hooks/useEtapasData";
import { useEtapasValorData } from "./hooks/useEtapasValorData";
import { useMondayContext } from "./hooks/useMondayContext";
import { useMondayData } from "./hooks/useMondayData";
import { useEvolucaoData, PeriodoChave } from "./hooks/useEvolucaoData";
import { useEvolucaoMesData } from "./hooks/useEvolucaoMesData";
import { useTransicoesData } from "./hooks/useTransicoesData";
import CardEtapa from "./components/CardEtapa";
import GraficoEvolucao from "./components/GraficoEvolucao";
import GraficoEvolucaoMes from "./components/GraficoEvolucaoMes";
import GraficoTransicoes from "./components/GraficoTransicoes";
import "./App.css";

function App() {
  const { boardId } = useMondayContext();
  const { items, isLoading } = useMondayData(boardId);
  const { registros: transicoesRegistros, isLoading: isLoadingTransicoes } =
    useTransicoesData(boardId, items);

  const [vendedorVisaoGeral, setVendedorVisaoGeral] = useState<string>();
  const [vendedorGrafico, setVendedorGrafico] = useState<string>();
  const [empresaSelecionada, setEmpresaSelecionada] = useState<string>(); // ✅ ADICIONADO: Filtro empresa
  const [abaAtiva, setAbaAtiva] = useState<string>("Evolução Mês Atual");
  const [abaVisaoGeral, setAbaVisaoGeral] = useState<string>("Quantidade");
  const [periodoTransicoes, setPeriodoTransicoes] = useState<number>(30);

  // Estado do ponto selecionado
  const [pontoSelecionado, setPontoSelecionado] = useState<any | null>(null);

  // ⭐ Estado do filtro por etapa dentro do popup
  const [filtroEtapa, setFiltroEtapa] = useState<string>("");

  const cores = [
    "#2563eb",
    "#d8ca08ff",
    "#17d45c",
    "#464e49ff",
    "#135c25ff",
    "#00a84cff",
    "#da810cff",
    "#64748b",
  ];

  // 🔥 Arrumando tipagem: forçamos string[]
  const vendedoresUnicos: string[] = Array.from(
    new Set(items.map((i) => i.vendedor).filter(Boolean) as string[])
  ).sort();

  // ✅ Extrair empresas únicas
  const empresasUnicas: string[] = Array.from(
    new Set(items.map((i) => i.empresa).filter(Boolean) as string[])
  ).sort();

  const visaoGeralFiltro = useEtapasData(
    items,
    vendedorVisaoGeral,
    empresaSelecionada
  );
  const visaoGeralValor = useEtapasValorData(
    items,
    vendedorVisaoGeral,
    empresaSelecionada
  );

  const itensFiltrados = useMemo(() => {
    if (!items) return [];
    let resultado = items;
    
    // Filtrar por vendedor se selecionado
    if (vendedorGrafico) {
      resultado = resultado.filter((i) => i.vendedor === vendedorGrafico);
    }
    
    // Filtrar por empresa se selecionada
    if (empresaSelecionada) {
      resultado = resultado.filter((i) => i.empresa === empresaSelecionada);
    }
    
    return resultado;
  }, [items, vendedorGrafico, empresaSelecionada]);

  const dadosGrafico = useEvolucaoData(itensFiltrados);
  const dadosGraficoMes = useEvolucaoMesData(itensFiltrados);
  const dadosTransicoes = useMemo(() => {
    const limiteMs = Date.now() - periodoTransicoes * 24 * 60 * 60 * 1000;

    const filtradosPorData = transicoesRegistros.filter((t) => {
      const tMs = new Date(t.createdAt).getTime();
      if (Number.isNaN(tMs)) return false;
      return tMs >= limiteMs;
    });

    const filtradosPorVendedor = vendedorGrafico
      ? filtradosPorData.filter((t) => t.vendedor === vendedorGrafico)
      : filtradosPorData;

    // ✅ Filtrar por empresa também
    const filtradosPorEmpresa = empresaSelecionada
      ? filtradosPorVendedor.filter((t) => {
          const itemInfo = items.find(i => i.id === t.itemId);
          return itemInfo?.empresa === empresaSelecionada;
        })
      : filtradosPorVendedor;

    // 🎯 AGRUPA POR DATA (unificado)
    const mapaData: Record<string, { 
      data: string; 
      transicoes: Array<{ transicao: string; movimento: string; total: number; items: any[] }>; 
      totalGeral: number; 
      items: any[] 
    }> = {};

    filtradosPorEmpresa.forEach((t) => {
      const dataIso = new Date(t.createdAt).toISOString().slice(0, 10);
      const transicao = `${t.de} → ${t.para}`;

      if (!mapaData[dataIso]) {
        mapaData[dataIso] = { data: dataIso, transicoes: [], totalGeral: 0, items: [] };
      }

      // Procura ou cria transição
      let transicaoObj = mapaData[dataIso].transicoes.find(tr => tr.transicao === transicao);
      if (!transicaoObj) {
        transicaoObj = { transicao, movimento: t.movimento, total: 0, items: [] };
        mapaData[dataIso].transicoes.push(transicaoObj);
      }

      transicaoObj.total += 1;
      mapaData[dataIso].totalGeral += 1;

      const itemObj = {
        id: t.itemId,
        name: t.itemName,
        fechamento_vendas: t.fechamento_vendas,
        valor_contrato: t.valor_contrato,
        etapa: t.para,
        transicao: transicao,
        movimento: t.movimento,
        vendedor: t.vendedor,
        performance: t.performance,
        data_transicao: t.createdAt,
      };

      transicaoObj.items.push(itemObj);
      mapaData[dataIso].items.push(itemObj);
    });

    const resultado = Object.values(mapaData).sort((a, b) => {
      return new Date(b.data).getTime() - new Date(a.data).getTime();
    });
    
    console.log("📈 [App.tsx] dadosTransicoes unificados por data:", resultado);
    console.log("🔍 Filtros aplicados:", { periodo: periodoTransicoes + " dias", vendedor: vendedorGrafico || "Todos" });
    
    return resultado;
  }, [transicoesRegistros, vendedorGrafico, empresaSelecionada, periodoTransicoes, items]);

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
          <div className="filtro flex justify-between items-center gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <h2 className="font-bold">Visão Geral</h2>
              <div className="flex border rounded-lg overflow-hidden">
                {["Quantidade", "Valor"].map((aba) => (
                  <button
                    key={aba}
                    onClick={() => setAbaVisaoGeral(aba)}
                    className={`px-3 py-1 text-sm font-medium ${
                      abaVisaoGeral === aba
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-600"
                    }`}
                  >
                    {aba}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <div>
                <span className="mr-3">Filtrar por vendedor:</span>
                <select
                  className="border px-2 py-1 rounded bg-white text-sm"
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
              
              <div>
                <span className="mr-3">Filtrar por empresa:</span>
                <select
                  className="border px-2 py-1 rounded bg-white text-sm"
                  value={empresaSelecionada || ""}
                  onChange={(e) =>
                    setEmpresaSelecionada(e.target.value || undefined)
                  }
                >
                  <option value="">Todas as empresas</option>
                  {empresasUnicas.map((emp) => (
                    <option key={emp}>{emp}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <p className="text-center text-gray-500">Carregando dados...</p>
          ) : (
            <div className="flex gap-20 justify-center flex-wrap m-4">
              {(abaVisaoGeral === "Quantidade" ? visaoGeralFiltro : visaoGeralValor)
                .map((etapa, index) => (
                  <CardEtapa
                    key={etapa.title}
                    title={etapa.title}
                    total={
                      abaVisaoGeral === "Quantidade"
                        ? etapa.total
                        : formatarDinheiro(etapa.total)
                    }
                    titleColor={cores[index % cores.length]}
                  />
                ))}
            </div>
          )}
        </div>

        {/* GRÁFICO COM ABAS */}
        <div className="dashboard-grafico-area border-2 border-opacity-25 border-gray-300 rounded-2xl">
          <div className="flex border-b border-gray-300">
            {["Evolução Mês Atual", "Evolução 90 dias", "Transições"].map((aba) => (
              <button
                key={aba}
                onClick={() => {
                  setAbaAtiva(aba);
                  setPontoSelecionado(null);
                  setFiltroEtapa("");
                }}
                className={`px-6 py-3 font-semibold transition-colors duration-200 ${abaAtiva === aba
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
                <div className="dashboard-filtro flex justify-between items-center p-4 gap-4 flex-wrap">
                  <h2 className="font-bold">Evolução por período</h2>

                  <div className="flex gap-4">
                    <div>
                      <span className="mr-3">Filtrar por vendedor:</span>
                      <select
                        className="border px-2 py-1 rounded bg-white text-sm"
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
                    
                    <div>
                      <span className="mr-3">Filtrar por empresa:</span>
                      <select
                        className="border px-2 py-1 rounded bg-white text-sm"
                        value={empresaSelecionada || ""}
                        onChange={(e) =>
                          setEmpresaSelecionada(e.target.value || undefined)
                        }
                      >
                        <option value="">Todas as empresas</option>
                        {empresasUnicas.map((emp) => (
                          <option key={emp}>{emp}</option>
                        ))}
                      </select>
                    </div>
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
                <div className="dashboard-filtro flex justify-between items-center p-4 gap-4 flex-wrap">
                  <h2 className="font-bold">Evolução no mês atual</h2>

                  <div className="flex gap-4">
                    <div>
                      <span className="mr-3">Filtrar por vendedor:</span>
                      <select
                        className="border px-2 py-1 rounded bg-white text-sm"
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
                    
                    <div>
                      <span className="mr-3">Filtrar por empresa:</span>
                      <select
                        className="border px-2 py-1 rounded bg-white text-sm"
                        value={empresaSelecionada || ""}
                        onChange={(e) =>
                          setEmpresaSelecionada(e.target.value || undefined)
                        }
                      >
                        <option value="">Todas as empresas</option>
                        {empresasUnicas.map((emp) => (
                          <option key={emp}>{emp}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="dashboard-grafico m-2 p-2">
                  <GraficoEvolucaoMes
                    dados={dadosGraficoMes}
                    onPontoClick={(p) => {
                      // const itensDoDia = p.payload.items || [];
                      // console.log("itens do dia clicado:", itensDoDia);
                      setFiltroEtapa("");
                      setPontoSelecionado(p);
                      // setPontoSelecionado({
                      //   dia: p.dia,
                      //   items: [...itensDoDia].sort((a, b) => a.etapa.localeCompare(b.etapa))
                      // });
                      // console.log("Ponto selecionado:", pontoSelecionado)
                    }}
                  />
                </div>
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
                            <th className="p-2 text-center">Nome</th>
                            <th className="p-2 text-center">Fechamento</th>
                            <th className="p-2 text-center">Valor</th>
                            <th className="p-2 text-center">Etapa</th>
                            <th className="p-2 text-center">Vendedor</th>
                            <th className="p-2 text-center">Performance</th>
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

            {/* ====================== TRANSIÇÕES =========================== */}
            {abaAtiva === "Transições" && (
              <>
                <div className="dashboard-filtro flex justify-between items-center p-4 gap-4 flex-wrap">
                  <h2 className="font-bold">Transições de etapa</h2>

                  <div className="flex items-center gap-4 flex-wrap">
                    <div>
                      <span className="mr-2">Filtrar por vendedor:</span>
                      <select
                        className="border px-2 py-1 rounded bg-white text-sm"
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

                    <div>
                      <span className="mr-2">Filtrar por empresa:</span>
                      <select
                        className="border px-2 py-1 rounded bg-white text-sm"
                        value={empresaSelecionada || ""}
                        onChange={(e) =>
                          setEmpresaSelecionada(e.target.value || undefined)
                        }
                      >
                        <option value="">Todas as empresas</option>
                        {empresasUnicas.map((emp) => (
                          <option key={emp}>{emp}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="mr-2">Período:</span>
                      <select
                        className="border px-2 py-1 rounded bg-white text-sm"
                        value={periodoTransicoes}
                        onChange={(e) => setPeriodoTransicoes(Number(e.target.value))}
                      >
                        {[7, 14, 30, 60, 90].map((dias) => (
                          <option key={dias} value={dias}>
                            Últimos {dias} dias
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="dashboard-grafico m-2 p-2">
                  {isLoadingTransicoes ? (
                    <p className="text-center text-gray-500">Carregando transições...</p>
                  ) : (
                    <GraficoTransicoes
                      dados={dadosTransicoes}
                      onPontoClick={(p) => {
                        setFiltroEtapa("");
                        setPontoSelecionado({
                          periodo: p.periodo,
                          items: p.items,
                        });
                      }}
                    />
                  )}
                </div>

                {pontoSelecionado && (
                  <div className="mt-4 p-4 border rounded-xl bg-gray-50 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <h3 className="font-bold text-lg">
                        {pontoSelecionado.periodo}
                      </h3>
                    </div>

                    {!pontoSelecionado.items?.length ? (
                      <p className="text-gray-500">Nenhum item nesta transição.</p>
                    ) : (
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b bg-gray-100">
                            <th className="p-2 text-left">Nome</th>
                            <th className="p-2 text-left">Data da transição</th>
                            <th className="p-2 text-left">Transição</th>
                            <th className="p-2 text-left">Movimento</th>
                            <th className="p-2 text-left">Fechamento</th>
                            <th className="p-2 text-left">Valor</th>
                            <th className="p-2 text-left">Vendedor</th>
                            <th className="p-2 text-left">Performance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...(pontoSelecionado.items || [])]
                            .sort((a: any, b: any) => {
                              // 1️⃣ AVANCOU vem primeiro, REGREDIU depois
                              const movimentoA = a.movimento === "AVANCOU" ? 0 : 1;
                              const movimentoB = b.movimento === "AVANCOU" ? 0 : 1;
                              
                              if (movimentoA !== movimentoB) {
                                return movimentoA - movimentoB;
                              }
                              
                              // 2️⃣ Dentro do mesmo movimento, ordena por transição alfabética
                              return (a.transicao || "").localeCompare(b.transicao || "");
                            })
                            .map((item: any) => (
                            <tr key={item.id} className="border-b">
                              <td className="p-2">{item.name}</td>
                              <td className="p-2">
                                {formatarData(item?.data_transicao)}
                              </td>
                              <td className="p-2">{item.transicao}</td>
                              <td className="p-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  item.movimento === "AVANCOU" 
                                    ? "bg-green-100 text-green-800" 
                                    : "bg-red-100 text-red-800"
                                }`}>
                                  {item.movimento === "AVANCOU" ? "✓ Avançou" : "✗ Regrediu"}
                                </span>
                              </td>
                              <td className="p-2">
                                {formatarData(item?.fechamento_vendas)}
                              </td>
                              <td className="p-2">
                                {formatarDinheiro(item.valor_contrato)}
                              </td>
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
          </div>
        </div>
      </div>
    </div>
  );
}



export default App;