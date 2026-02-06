import { useMemo } from "react";

interface Item {
  id: string;
  name: string;
  status: string;
  etapa: string;
  vendedor?: string;
  empresa?: string;
  valor_contrato?: string | number | null;
}

interface EtapaValorData {
  title: string;
  total: number;
}

const ETAPAS_VALOR = [
  "Prospect - 25%",
  "Oportunidade - 50%",
  "Forecast - 75%",
  "Forecast - 90%",
];

function parseValorContrato(valor: string | number | null | undefined): number {
  if (typeof valor === "number") return valor;
  if (!valor) return 0;
  const texto = String(valor).trim();
  const apenasNumeros = texto.replace(/[^0-9,.-]/g, "");

  const temVirgula = apenasNumeros.includes(",");
  const temPonto = apenasNumeros.includes(".");

  let normalizado = apenasNumeros;

  if (temVirgula && temPonto) {
    // Formato 1.234.567,89 -> remove pontos e troca vírgula por ponto
    normalizado = apenasNumeros.replace(/\./g, "").replace(/,/g, ".");
  } else if (temVirgula && !temPonto) {
    // Formato 1234567,89 -> troca vírgula por ponto
    normalizado = apenasNumeros.replace(/,/g, ".");
  } else if (temPonto && !temVirgula) {
    // Formato 1234567.89 (decimal) ou 1.234.567 (milhar)
    const partes = apenasNumeros.split(".");
    const ultimaParte = partes[partes.length - 1];
    if (ultimaParte.length === 3) {
      // Assume separador de milhar
      normalizado = apenasNumeros.replace(/\./g, "");
    } else {
      // Assume decimal
      normalizado = apenasNumeros;
    }
  }

  const n = Number(normalizado);
  return Number.isFinite(n) ? n : 0;
}

export function useEtapasValorData(
  items: Item[],
  vendedorSelecionado?: string,
  empresaSelecionada?: string
): EtapaValorData[] {
  return useMemo(() => {
    if (!items.length) return [];

    let itemsFiltrados = items.filter((item) => item.status === "Ativo");

    if (vendedorSelecionado) {
      itemsFiltrados = itemsFiltrados.filter(
        (item) => item.vendedor === vendedorSelecionado
      );
    }

    if (empresaSelecionada) {
      itemsFiltrados = itemsFiltrados.filter(
        (item) => item.empresa === empresaSelecionada
      );
    }

    const resultado = ETAPAS_VALOR.map((title) => {
      const itensEtapa = itemsFiltrados.filter((item) => item.etapa === title);
      const total = itensEtapa.reduce(
        (acc, item) => acc + parseValorContrato(item.valor_contrato),
        0
      );

      if (title === "Prospect - 25%") {
        console.log("🧾 [useEtapasValorData] Prospect detalhes:", {
          quantidade: itensEtapa.length,
          itens: itensEtapa.map((item) => ({
            id: item.id,
            name: item.name,
            valor_bruto: item.valor_contrato,
            valor_parseado: parseValorContrato(item.valor_contrato),
          })),
          total,
        });
      }

      return { title, total };
    });

    console.log("📊 [useEtapasValorData] Totais por etapa:", resultado);
    console.log("🔍 Filtros aplicados:", {
      vendedor: vendedorSelecionado || "Todos",
      empresa: empresaSelecionada || "Todas",
      totalItemsAtivos: itemsFiltrados.length,
    });

    return resultado;
  }, [items, vendedorSelecionado, empresaSelecionada]);
}
