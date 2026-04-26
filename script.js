/*
  script.js
  Regras de geração de tabela, controle de placares, classificação e armazenamento local.
  Este arquivo entende e roda o torneio Super 8 com suporte a:
  - digitação de nomes de jogadores
  - geração automática de rodadas e quadras
  - registro de placares por partida
  - cálculo de games ganhos e ranking final
  - persistência dos dados no localStorage
*/

const ROUNDS = [
  [{a:[0,1], b:[2,3]}, {a:[4,5], b:[6,7]}],
  [{a:[0,2], b:[4,6]}, {a:[1,3], b:[5,7]}],
  [{a:[0,3], b:[5,6]}, {a:[1,2], b:[4,7]}],
  [{a:[0,4], b:[3,6]}, {a:[1,5], b:[2,7]}],
  [{a:[0,5], b:[2,6]}, {a:[1,4], b:[3,7]}],
  [{a:[0,6], b:[1,7]}, {a:[2,5], b:[3,4]}],
  [{a:[0,7], b:[2,4]}, {a:[1,6], b:[3,5]}]
];
const STORAGE_KEY = 'super8_padel_data';

let scores = {};
let generated = false;
let manualAgeTiebreak = {}; // guarda vencedor manual de desempate por idade

function saveToStorage() {
  const names = Array.from({length: 8}, (_, i) => {
    const input = document.getElementById('p' + i);
    return input?.value || input?.placeholder || `Jogador ${i + 1}`;
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify({ names, scores, generated }));
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

/*
  buildPlayerGrid
  Cria a área de entrada para os 8 jogadores.
  Usa `savedNames` quando os nomes estiverem armazenados no navegador.
*/
function buildPlayerGrid(savedNames) {
  const grid = document.getElementById('player-grid');
  grid.innerHTML = '';

  for (let i = 0; i < 8; i++) {
    const wrap = document.createElement('div');
    wrap.className = 'player-input-wrap';

    const label = document.createElement('span');
    label.className = 'player-label';
    label.textContent = `Jogador ${i + 1}`;

    const input = document.createElement('input');
    input.className = 'player-input';
    input.id = `p${i}`;
    input.type = 'text';
    input.maxLength = 18;
    input.value = savedNames?.[i] || `Jogador ${i + 1}`;

    input.addEventListener('input', saveToStorage);
    input.addEventListener('focus', () => input.select());

    wrap.appendChild(label);
    wrap.appendChild(input);
    grid.appendChild(wrap);
  }
}

/*
  getNames
  Lê os valores atuais dos campos de jogador e retorna um array de nomes.
*/
function getNames() {
  return Array.from({length: 8}, (_, i) => {
    const input = document.getElementById('p' + i);
    return input?.value.trim() || input?.placeholder || `Jogador ${i + 1}`;
  });
}

/*
  validatePlayerNames
  Garante que todos os campos estejam preenchidos antes de gerar o torneio.
*/
function validatePlayerNames() {
  const names = getNames();
  for (let i = 0; i < names.length; i++) {
    const input = document.getElementById('p' + i);
    if (!input.value.trim()) {
      alert(`Por favor, preencha o nome do Jogador ${i + 1}.`);
      input.focus();
      return false;
    }
  }
  return true;
}

/*
  generateTournament
  Monta as rodadas do torneio a partir da definição de ROUNDS.
  Cria os campos de placar para cada partida e renderiza as tabelas.
  Se `savedScores` for true, preserva os resultados existentes.
*/
function generateTournament(savedScores = false) {
  if (!validatePlayerNames()) {
    return;
  }

  generated = true;
  if (!savedScores) {
    scores = {};
  }

  const roundsSection = document.getElementById('rounds-section');
  roundsSection.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'rounds-container';

  ROUNDS.forEach((courts, roundIndex) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<div class="card-header">Rodada ${roundIndex + 1}</div>`;

    courts.forEach((match, courtIndex) => {
      const key = `${roundIndex}-${courtIndex}`;
      if (!savedScores || !scores[key]) {
        scores[key] = { a: '', b: '', match };
      } else {
        scores[key].match = match;
      }

      const row = document.createElement('div');
      row.className = 'court-row';

      const names = getNames();
      const scoreA = scores[key].a !== '' ? scores[key].a : '';
      const scoreB = scores[key].b !== '' ? scores[key].b : '';

      row.innerHTML = `
        <div class="team">
          <span class="player-name">${names[match.a[0]]}</span>
          <span class="player-name">${names[match.a[1]]}</span>
        </div>
        <div class="vs-block">
          <span class="court-badge">Quadra ${courtIndex + 1}</span>
          <span class="vs-text">vs</span>
          <div class="score-inputs">
            <input class="score-input" type="number" min="0" max="99" placeholder="–" id="s${key}a" value="${scoreA}" />
            <span class="score-sep">×</span>
            <input class="score-input" type="number" min="0" max="99" placeholder="–" id="s${key}b" value="${scoreB}" />
          </div>
        </div>
        <div class="team right">
          <span class="player-name">${names[match.b[0]]}</span>
          <span class="player-name">${names[match.b[1]]}</span>
        </div>
      `;

      const inputA = row.querySelector(`#s${key}a`);
      const inputB = row.querySelector(`#s${key}b`);
      inputA.addEventListener('input', () => updateScore(key, 'a', inputA.value));
      inputB.addEventListener('input', () => updateScore(key, 'b', inputB.value));

      card.appendChild(row);
    });

    container.appendChild(card);
  });

  roundsSection.appendChild(container);
  renderGamesTable();
  renderStandings();
  showPdfBtn();
  saveToStorage();
}

function updateScore(key, side, value) {
  scores[key][side] = value === '' ? '' : Math.max(0, parseInt(value, 10) || 0);
  renderGamesTable();
  renderStandings();
  saveToStorage();
}

function getPlayerGamesByRound() {
  const gamesPerRound = Array.from({ length: 8 }, () => Array(7).fill(null));
  const wins = new Array(8).fill(0);

  ROUNDS.forEach((courts, roundIndex) => {
    courts.forEach((match, courtIndex) => {
      const key = `${roundIndex}-${courtIndex}`;
      const score = scores[key];
      if (!score) {
        return;
      }

      const aValue = score.a !== '' ? parseInt(score.a, 10) : null;
      const bValue = score.b !== '' ? parseInt(score.b, 10) : null;
      if (aValue === null || bValue === null || Number.isNaN(aValue) || Number.isNaN(bValue)) {
        return;
      }

      match.a.forEach((playerId) => {
        gamesPerRound[playerId][roundIndex] = (gamesPerRound[playerId][roundIndex] || 0) + aValue;
      });
      match.b.forEach((playerId) => {
        gamesPerRound[playerId][roundIndex] = (gamesPerRound[playerId][roundIndex] || 0) + bValue;
      });

      if (aValue > bValue) {
        match.a.forEach((playerId) => wins[playerId]++);
      } else if (bValue > aValue) {
        match.b.forEach((playerId) => wins[playerId]++);
      }
    });
  });

  return { gamesPerRound, wins };
}

function getDirectResult(playerA, playerB) {
  let totalA = 0;
  let totalB = 0;
  let found = false;

  for (let roundIndex = 0; roundIndex < ROUNDS.length; roundIndex++) {
    for (let courtIndex = 0; courtIndex < ROUNDS[roundIndex].length; courtIndex++) {
      const match = ROUNDS[roundIndex][courtIndex];
      const aHasA = match.a.includes(playerA);
      const aHasB = match.a.includes(playerB);
      const bHasA = match.b.includes(playerA);
      const bHasB = match.b.includes(playerB);

      if ((aHasA && bHasB) || (aHasB && bHasA)) {
        const key = `${roundIndex}-${courtIndex}`;
        const score = scores[key];
        if (!score) {
          continue;
        }

        const aValue = score.a !== '' ? parseInt(score.a, 10) : null;
        const bValue = score.b !== '' ? parseInt(score.b, 10) : null;
        if (aValue === null || bValue === null || Number.isNaN(aValue) || Number.isNaN(bValue)) {
          continue;
        }

        found = true;
        if (aHasA && bHasB) {
          totalA += aValue;
          totalB += bValue;
        } else {
          totalA += bValue;
          totalB += aValue;
        }
      }
    }
  }

  if (!found) {
    return null;
  }
  if (totalA > totalB) {
    return playerA;
  }
  if (totalB > totalA) {
    return playerB;
  }
  return 'tie';
}

function selectAgeTiebreak(playerA, playerB, winner) {
  const key = playerA < playerB ? `${playerA}-${playerB}` : `${playerB}-${playerA}`;
  manualAgeTiebreak[key] = winner;
  renderStandings();
}

function getAgeTiebreakWinner(playerA, playerB) {
  const key = playerA < playerB ? `${playerA}-${playerB}` : `${playerB}-${playerA}`;
  return manualAgeTiebreak[key] || null;
}

/*
  renderGamesTable
  Exibe a tabela de games ganhos por rodada para cada jogador.
  A tabela é recalculada sempre que um placar muda.
*/
function renderGamesTable() {
  const names = getNames();
  const { gamesPerRound } = getPlayerGamesByRound();
  const section = document.getElementById('games-table-section');

  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = '<div class="card-header">Games ganhos por rodada</div>';

  const wrapper = document.createElement('div');
  wrapper.className = 'games-table-wrap';

  let tableHtml = '<table class="games-table"><thead><tr><th>Jogador</th>';
  for (let round = 1; round <= 7; round++) {
    tableHtml += `<th>J${round}</th>`;
  }
  tableHtml += '<th>Total</th></tr></thead><tbody>';

  for (let playerIndex = 0; playerIndex < 8; playerIndex++) {
    const totalGames = gamesPerRound[playerIndex].reduce((current, value) => current + (value !== null ? value : 0), 0);
    tableHtml += `<tr><td>${names[playerIndex]}</td>`;
    for (let roundIndex = 0; roundIndex < 7; roundIndex++) {
      const value = gamesPerRound[playerIndex][roundIndex];
      tableHtml += value !== null ? `<td>${value}</td>` : '<td class="no-game">–</td>';
    }
    tableHtml += `<td class="total-cell">${totalGames}</td></tr>`;
  }

  tableHtml += '</tbody></table>';
  wrapper.innerHTML = tableHtml;
  card.appendChild(wrapper);

  section.innerHTML = '';
  section.appendChild(card);
}

/*
  renderStandings
  Calcula a classificação final com base em:
  1. total de games ganhos
  2. partidas vencidas
  3. confronto direto entre jogadores empatados
  4. desempate por idade quando necessário
*/
function renderStandings() {
  const names = getNames();
  const { gamesPerRound, wins } = getPlayerGamesByRound();

  const totals = gamesPerRound.map((rounds) => rounds.reduce((sum, value) => sum + (value !== null ? value : 0), 0));

  const players = totals.map((games, index) => ({
    index,
    name: names[index],
    games,
    wins: wins[index]
  }));

  players.sort((playerA, playerB) => {
    if (playerB.games !== playerA.games) {
      return playerB.games - playerA.games;
    }
    if (playerB.wins !== playerA.wins) {
      return playerB.wins - playerA.wins;
    }

    const winner = getDirectResult(playerA.index, playerB.index);
    if (winner === playerA.index) {
      return -1;
    }
    if (winner === playerB.index) {
      return 1;
    }
    if (winner === 'tie') {
      const manualWinner = getAgeTiebreakWinner(playerA.index, playerB.index);
      if (manualWinner === playerA.index) {
        return -1;
      }
      if (manualWinner === playerB.index) {
        return 1;
      }
    }
    return 0;
  });

  const criteriaMessages = new Array(players.length).fill(null);
  const ageSelectionRows = new Set();

  for (let position = 1; position < players.length; position++) {
    const currentPlayer = players[position];
    const previousPlayer = players[position - 1];

    if (currentPlayer.games !== previousPlayer.games) {
      continue;
    }
    if (currentPlayer.wins !== previousPlayer.wins) {
      criteriaMessages[position - 1] = `1° critério: partidas vencidas — ${previousPlayer.name} venceu ${previousPlayer.wins}, ${currentPlayer.name} venceu ${currentPlayer.wins}`;
      continue;
    }

    const directResult = getDirectResult(currentPlayer.index, previousPlayer.index);
    if (directResult !== null && directResult !== 'tie') {
      const winnerName = directResult === previousPlayer.index ? previousPlayer.name : currentPlayer.name;
      const loserName = directResult === previousPlayer.index ? currentPlayer.name : previousPlayer.name;
      const directGames = getDirectGames(currentPlayer.index, previousPlayer.index);
      const winnerScore = directResult === previousPlayer.index ? directGames.totalB : directGames.totalA;
      const loserScore = directResult === previousPlayer.index ? directGames.totalA : directGames.totalB;
      const winnerRow = directResult === previousPlayer.index ? position - 1 : position;
      criteriaMessages[winnerRow] = `2° critério: confronto direto (soma de games) — ${winnerName} ${winnerScore} x ${loserScore} ${loserName}`;
      continue;
    }

    if (directResult === 'tie') {
      const manualWinner = getAgeTiebreakWinner(currentPlayer.index, previousPlayer.index);
      if (manualWinner) {
        const winnerRow = manualWinner === previousPlayer.index ? position - 1 : position;
        criteriaMessages[winnerRow] = '3° critério: idade, o competidor mais velho vence';
      } else {
        ageSelectionRows.add(position);
      }
    }
  }

  const standingsSection = document.getElementById('standings-section');
  const card = document.createElement('div');
  card.className = 'standings-card';
  card.innerHTML = '<div class="card-header"><span>Classificação final</span><span style="font-size:11px;font-weight:400;color:var(--text3);">games ganhos</span></div>';

  players.forEach((player, position) => {
    const previousPlayer = position > 0 ? players[position - 1] : null;
    const isAgeWinner = previousPlayer ? getAgeTiebreakWinner(player.index, previousPlayer.index) === player.index : false;

    const row = document.createElement('div');
    const rowClass = `standing-row ${position === 0 ? 'top1' : position === 1 ? 'top2' : position === 2 ? 'top3' : ''}${isAgeWinner ? ' age-winner' : ''}`;
    row.className = rowClass;

    const posClass = position === 0 ? 'gold' : position === 1 ? 'silver' : position === 2 ? 'bronze' : '';
    const medal = position === 0 ? '1°' : position === 1 ? '2°' : position === 2 ? '3°' : `${position + 1}°`;
    const criteria = criteriaMessages[position];
    const isChampion = position === 0;

    let actionButtons = '';
    if (ageSelectionRows.has(position)) {
      const previous = players[position - 1];
      actionButtons = `
        <div class="tiebreak-note"><strong>Todos os critérios estão empatados.</strong> Nesse caso vence o jogador mais velho. Clique em um dos botões abaixo para definir o vencedor.</div>
        <div class="age-tiebreak-actions">
          <button class="tie-btn" type="button" data-winner="${player.index}" data-loser="${previous.index}">${player.name}</button>
          <button class="tie-btn" type="button" data-winner="${previous.index}" data-loser="${player.index}">${previous.name}</button>
        </div>
      `;
    }

    row.innerHTML = `
      <span class="pos ${posClass}">${medal}</span>
      <div class="standing-info">
        ${isChampion ? '<span style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:#BA7517;text-transform:uppercase;margin-bottom:2px;display:block;">★ Campeão</span>' : ''}
        <span class="standing-name" style="${isChampion ? 'font-size:16px;' : ''}">${player.name}</span>
        ${criteria ? `<span class="standing-criteria">${criteria}</span>` : ''}
        ${actionButtons}
      </div>
      <div class="standing-right">
        <span class="games-val">${player.games}</span>
        <span class="games-lbl">games</span>
      </div>
    `;

    card.appendChild(row);
  });

  const legend = document.createElement('div');
  legend.style.cssText = 'padding:12px 16px 8px;font-size:11px;color:var(--text3);border-top:0.5px solid var(--border);line-height:1.4;';
  legend.innerHTML = `
    <strong>Critérios de desempate:</strong><br>
    1° - Partidas vencidas<br>
    2° - Confronto direto (soma de games)<br>
    3° - Idade: o competidor mais velho vence
  `;
  card.appendChild(legend);

  standingsSection.innerHTML = '';
  standingsSection.appendChild(card);

  const tiebreakButtons = card.querySelectorAll('.tie-btn');
  tiebreakButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const winner = Number(button.dataset.winner);
      const loser = Number(button.dataset.loser);
      selectAgeTiebreak(winner, loser, winner);
    });
  });
}

function getDirectGames(playerA, playerB) {
  let totalA = 0;
  let totalB = 0;

  for (let roundIndex = 0; roundIndex < ROUNDS.length; roundIndex++) {
    for (let courtIndex = 0; courtIndex < ROUNDS[roundIndex].length; courtIndex++) {
      const match = ROUNDS[roundIndex][courtIndex];
      const aHasA = match.a.includes(playerA);
      const aHasB = match.a.includes(playerB);
      const bHasA = match.b.includes(playerA);
      const bHasB = match.b.includes(playerB);

      if ((aHasA && bHasB) || (aHasB && bHasA)) {
        const key = `${roundIndex}-${courtIndex}`;
        const score = scores[key];
        if (!score) {
          continue;
        }

        const aValue = score.a !== '' ? parseInt(score.a, 10) : null;
        const bValue = score.b !== '' ? parseInt(score.b, 10) : null;
        if (aValue === null || bValue === null || Number.isNaN(aValue) || Number.isNaN(bValue)) {
          continue;
        }

        if (aHasA && bHasB) {
          totalA += aValue;
          totalB += bValue;
        } else {
          totalA += bValue;
          totalB += aValue;
        }
      }
    }
  }

  return { totalA, totalB };
}

function exportPDF() {
  window.print();
}

function showPdfBtn() {
  const btn = document.getElementById('btn-pdf');
  if (btn) {
    btn.style.display = '';
  }
}

function resetAll() {
  if (!confirm('Tem certeza que deseja apagar todos os dados?')) {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
  scores = {};
  generated = false;
  manualAgeTiebreak = {};
  buildPlayerGrid(null);
  document.getElementById('rounds-section').innerHTML = '';
  document.getElementById('games-table-section').innerHTML = '';
  document.getElementById('standings-section').innerHTML = '';

  const btnPdf = document.getElementById('btn-pdf');
  if (btnPdf) {
    btnPdf.style.display = 'none';
  }
}

function initializeButtons() {
  const generateButton = document.getElementById('btn-generate');
  const resetButton = document.getElementById('btn-reset');
  const pdfButton = document.getElementById('btn-pdf');

  generateButton.addEventListener('click', () => generateTournament(false));
  resetButton.addEventListener('click', resetAll);
  pdfButton.addEventListener('click', exportPDF);
}

function init() {
  initializeButtons();

  const savedState = loadFromStorage();
  if (savedState) {
    buildPlayerGrid(savedState.names);
    scores = savedState.scores || {};
    generated = savedState.generated || false;

    if (generated) {
      ROUNDS.forEach((courts, roundIndex) => {
        courts.forEach((match, courtIndex) => {
          const key = `${roundIndex}-${courtIndex}`;
          if (scores[key]) {
            scores[key].match = match;
          }
        });
      });
      generateTournament(true);
      return;
    }
  }

  buildPlayerGrid(null);
}

init();
