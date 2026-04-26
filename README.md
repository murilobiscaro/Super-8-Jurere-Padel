# Super 8 Padel

Aplicação web para gerenciar torneios no formato **Super 8** de padel — 8 jogadores, 7 rodadas, todos jogam com todos.

🔗 **[Acesse o projeto ao vivo]()**

---

## Sobre o projeto

O **Super 8 Padel** resolve um problema real: organizar a tabela, registrar placares e calcular a classificação de torneios de padel de forma rápida, sem papel e sem planilha.

A aplicação gera automaticamente a grade de rodadas para 8 jogadores, calcula os games ganhos por partida e exibe o ranking final com critérios de desempate encadeados.

---

## Funcionalidades

- **Cadastro de 8 jogadores** com nomes personalizados
- **Geração automática de tabela** — 7 rodadas, 2 quadras por rodada, todos jogam com todos
- **Registro de placares** diretamente na interface
- **Tabela de games ganhos** por rodada, atualizada em tempo real
- **Classificação automática** com critérios de desempate:
  1. Total de games ganhos
  2. Partidas vencidas
  3. Confronto direto (soma de games)
  4. Desempate por idade (seleção manual)
- **Persistência via localStorage** — os dados são salvos no navegador
- **Exportação para PDF** via impressão do navegador
- Layout **responsivo** para desktop e mobile

---

## Tecnologias

| Tecnologia | Uso |
|---|---|
| HTML5 | Estrutura semântica |
| CSS3 | Estilização, variáveis CSS, responsividade |
| JavaScript (ES6+) | Lógica do torneio, DOM, localStorage |
| Google Fonts | Barlow, Barlow Condensed, Ubuntu |

Projeto 100% **vanilla** — sem frameworks, sem dependências externas.

---

## Estrutura do projeto

```
super8-padel/
├── index.html   # Estrutura da aplicação
├── style.css    # Estilos e tema visual
└── script.js    # Lógica do torneio e manipulação do DOM
```

---

## Como usar localmente

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/super8-padel.git

# Acesse a pasta
cd super8-padel

# Abra no navegador
# Basta abrir o index.html — não precisa de servidor
```

---

## Autor

Desenvolvido por **Murilo Biscaro** — Desenvolvedor Full Stack

[![Instagram](https://img.shields.io/badge/@murilo.biscaro-E4405F?style=flat&logo=instagram&logoColor=white)](https://instagram.com/murilo.biscaro)
