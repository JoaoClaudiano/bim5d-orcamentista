# Biblioteca de Composições SINAPI

Esta pasta documenta a estrutura e o processo de atualização da **biblioteca de composições SINAPI** usada pelo Orçamentista BIM 5D.

## Estrutura

Os arquivos JSON com os dados SINAPI ficam em `public/biblioteca/sinapi/` (servidos como assets estáticos pela aplicação).  
A pasta `biblioteca/` no raiz do projeto é o ponto de referência para scripts e documentação.

```
public/
  biblioteca/
    sinapi/
      index.json              ← manifesto: lista os datasets disponíveis
      CE_2024-03.json         ← Ceará, março/2024
      SP_2024-03.json         ← São Paulo, março/2024
      RJ_2024-03.json         ← Rio de Janeiro, março/2024
      MG_2024-03.json         ← Minas Gerais, março/2024
      RS_2024-03.json         ← Rio Grande do Sul, março/2024
      BA_2024-03.json         ← Bahia, março/2024
      PE_2024-03.json         ← Pernambuco, março/2024
      DF_2024-03.json         ← Distrito Federal, março/2024
```

## Formato de cada arquivo JSON

```json
{
  "estado": "SP",
  "referencia": "2024-03",
  "fonte": "SINAPI CAIXA — tabela sintética de composições",
  "composicoes": [
    {
      "codigo": "87503",
      "descricao": "Alvenaria de vedação de blocos cerâmicos ...",
      "unidade": "m²",
      "custo_total": 75.51,
      "mo": 38.41,
      "material": 37.10
    }
  ]
}
```

## Como atualizar os dados

### Opção 1 — Download automático via script (recomendado)

```bash
# 1. Baixa as planilhas SINAPI do site da CAIXA
node scripts/sinapi-download.mjs --estado SP --referencia 2024-06

# 2. Converte o Excel baixado para JSON na pasta public/biblioteca/sinapi/
node scripts/sinapi-to-json.mjs --arquivo /tmp/SINAPI_SP_2024-06.xlsx --estado SP --referencia 2024-06

# 3. (Opcional) Importa para o Supabase
node scripts/sinapi-to-supabase.mjs --arquivo public/biblioteca/sinapi/SP_2024-06.json
```

### Opção 2 — Download manual + conversão

1. Acesse [caixa.gov.br → SINAPI → Tabelas](https://www.caixa.gov.br/poder-publico/modernizacao-gestao/sinapi/Paginas/default.aspx)
2. Baixe a planilha do estado e mês desejados
3. Execute `node scripts/sinapi-to-json.mjs` para converter
4. Copie o JSON gerado para `public/biblioteca/sinapi/`
5. Atualize `public/biblioteca/sinapi/index.json` adicionando a nova entrada

### Opção 3 — Edição manual direta

Edite o arquivo JSON diretamente em `public/biblioteca/sinapi/` e atualize o `index.json`.

## Estados disponíveis

| UF | Estado | Status |
|----|--------|--------|
| CE | Ceará | ✅ 2024-03 |
| SP | São Paulo | ✅ 2024-03 |
| RJ | Rio de Janeiro | ✅ 2024-03 |
| MG | Minas Gerais | ✅ 2024-03 |
| RS | Rio Grande do Sul | ✅ 2024-03 |
| BA | Bahia | ✅ 2024-03 |
| PE | Pernambuco | ✅ 2024-03 |
| DF | Distrito Federal | ✅ 2024-03 |

> Para adicionar outros estados, siga o processo acima e adicione o arquivo ao `index.json`.

## Composições disponíveis

| Código | Descrição | Unidade |
|--------|-----------|---------|
| 87503 | Alvenaria de blocos cerâmicos furados 9cm | m² |
| 87251 | Contrapiso argamassa 1:3, esp=4cm | m² |
| 94966 | Concreto usinado fck=25MPa (lajes) | m³ |
| 94978 | Concreto usinado fck=30MPa (pilares) | m³ |
| 92793 | Armação CA-50 Ø10mm | kg |
| 87447 | Forma lajes (compensado plastificado) | m² |
| 87264 | Revestimento cerâmico piso 35×35cm | m² |
| 87549 | Chapisco rolado paredes | m² |
| 74209 | Gesso liso em teto | m² |
| 87296 | Pintura acrílica 2 demãos | m² |
| 72136 | Lastro concreto magro e=5cm | m² |
| 72137 | Sapata isolada fck=15MPa | m³ |
| 88267 | Tubo PVC esgoto Ø100mm embutido | m |
| 88271 | Ponto de água fria PVC Ø20mm | pt |
| 93358 | Tomada 2P+T embutida | pt |
| 93359 | Eletroduto PVC Ø20mm embutido | m |
| 87551 | Telha cerâmica capa-canal | m² |
| 74252 | Manta asfáltica impermeabilização | m² |
| 74128 | Porta madeira 0.80×2.10m | un |
| 74130 | Janela alumínio correr 1.20×1.00m | un |
