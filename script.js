
/*
  Super 8 Padel
  - 8 jogadores, 7 rodadas e 2 quadras por rodada
  - Placares inteiros de 0 a 99, sem empate
  - Classificação por games ganhos, saldo, vitórias,
    confronto direto e idade
  - Desempate por idade somente após preencher os 14 placares
  - Salvamento automático no localStorage
*/

const ROUNDS = [
  [{ a: [0, 1], b: [2, 3] }, { a: [4, 5], b: [6, 7] }],
  [{ a: [0, 4], b: [5, 1] }, { a: [2, 6], b: [7, 3] }],
  [{ a: [0, 6], b: [7, 1] }, { a: [2, 4], b: [5, 3] }],
  [{ a: [0, 2], b: [4, 6] }, { a: [1, 3], b: [5, 7] }],
  [{ a: [0, 3], b: [5, 6] }, { a: [1, 2], b: [4, 7] }],
  [{ a: [0, 5], b: [2, 7] }, { a: [1, 4], b: [3, 6] }],
  [{ a: [0, 7], b: [3, 4] }, { a: [1, 6], b: [2, 5] }]
];

const STORAGE_KEY = 'super8_padel_data';

let scores = {};
let generated = false;
let manualAgeTiebreak = {};

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function getNames() {
  return Array.from({ length: 8 }, (_, i) => {
    const input = document.getElementById(`p${i}`);
    return input?.value.trim() || `Jogador ${i + 1}`;
  });
}

function saveToStorage() {
  const data = {
    names: getNames(),
    scores,
    generated,
    manualAgeTiebreak
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Não foi possível salvar os dados do torneio.', error);
  }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

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

    input.addEventListener('input', () => {
      saveToStorage();

      if (generated) {
        renderRoundsNames();
        renderGamesTable();
        renderStandings();
      }
    });

    input.addEventListener('focus', () => input.select());

    wrap.append(label, input);
    grid.appendChild(wrap);
  }
}

function validatePlayerNames() {
  for (let i = 0; i < 8; i++) {
    const input = document.getElementById(`p${i}`);

    if (!input.value.trim()) {
      alert(`Por favor, preencha o nome do Jogador ${i + 1}.`);
      input.focus();
      return false;
    }
  }

  return true;
}

/*
  Um placar é válido quando:
  - os dois campos estão preenchidos;
  - ambos são inteiros de 0 a 99;
  - os valores são diferentes.
*/
function getValidScorePair(score) {
  if (!score || score.a === '' || score.b === '') return null;

  const a = Number(score.a);
  const b = Number(score.b);

  if (
    !Number.isInteger(a) ||
    !Number.isInteger(b) ||
    a < 0 || a > 99 ||
    b < 0 || b > 99 ||
    a === b
  ) {
    return null;
  }

  return { a, b };
}

/*
  NOVA VERIFICAÇÃO:
  O desempate por idade só fica liberado quando todas as
  14 partidas têm placares completos e válidos.
*/
function allScoresComplete() {
  return ROUNDS.every((courts, roundIndex) =>
    courts.every((match, courtIndex) => {
      const key = `${roundIndex}-${courtIndex}`;
      return getValidScorePair(scores[key]) !== null;
    })
  );
}

function normalizeScores(savedScores) {
  const normalized = {};

  ROUNDS.forEach((courts, roundIndex) => {
    courts.forEach((match, courtIndex) => {
      const key = `${roundIndex}-${courtIndex}`;
      const saved = savedScores?.[key];

      normalized[key] = {
        a: saved?.a ?? '',
        b: saved?.b ?? '',
        match
      };
    });
  });

  return normalized;
}

function generateTournament(keepSavedScores = false) {
  if (!validatePlayerNames()) return;

  generated = true;

  if (!keepSavedScores) {
    scores = {};
    manualAgeTiebreak = {};
  }

  scores = normalizeScores(keepSavedScores ? scores : {});

  const roundsSection = document.getElementById('rounds-section');
  roundsSection.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'rounds-container';

  ROUNDS.forEach((courts, roundIndex) => {
    const card = document.createElement('div');
    card.className = 'card';

    const header = document.createElement('div');
    header.className = 'card-header';
    header.textContent = `Rodada ${roundIndex + 1}`;
    card.appendChild(header);

    courts.forEach((match, courtIndex) => {
      const key = `${roundIndex}-${courtIndex}`;
      const row = document.createElement('div');
      row.className = 'court-row';

      const names = getNames();

      const teamA = document.createElement('div');
      teamA.className = 'team';

      match.a.forEach(playerId => {
        const name = document.createElement('span');
        name.className = 'player-name';
        name.textContent = names[playerId];
        teamA.appendChild(name);
      });

      const scoreInputs = document.createElement('div');
      scoreInputs.className = 'score-inputs';

      const inputA = createScoreInput(key, 'a', scores[key].a);
      const separator = document.createElement('span');
      separator.className = 'score-sep';
      separator.textContent = '×';
      const inputB = createScoreInput(key, 'b', scores[key].b);

      scoreInputs.append(inputA, separator, inputB);

      const teamB = document.createElement('div');
      teamB.className = 'team right';

      match.b.forEach(playerId => {
        const name = document.createElement('span');
        name.className = 'player-name';
        name.textContent = names[playerId];
        teamB.appendChild(name);
      });

      row.append(teamA, scoreInputs, teamB);
      card.appendChild(row);

      updateScoreInputColors(key, row);
    });

    container.appendChild(card);
  });

  const criteriaCard = document.createElement('div');
  criteriaCard.className = 'card criteria-card';
  criteriaCard.innerHTML = `
    <div class="card-header">Critérios de desempate</div>
    <div class="criteria-list">
      <div>1° - Games ganhos totais</div>
      <div>2° - Saldo de games (games ganhos menos games perdidos)</div>
      <div>3° - Vitórias em partidas</div>
      <div>4° - Confronto direto (soma de games)</div>
      <div>5° - Idade: o competidor mais velho vence</div>
    </div>
  `;

  container.appendChild(criteriaCard);
  roundsSection.appendChild(container);

  renderGamesTable();
  renderStandings();
  showPdfBtn();
  saveToStorage();
}

function createScoreInput(key, side, value) {
  const input = document.createElement('input');
  input.className = 'score-input';
  input.type = 'number';
  input.min = '0';
  input.max = '99';
  input.step = '1';
  input.inputMode = 'numeric';
  input.placeholder = '–';
  input.id = `s${key}${side}`;
  input.value = value ?? '';

  input.addEventListener('input', () => {
    updateScore(key, side, input.value);
  });

  return input;
}

function updateScore(key, side, value) {
  if (!scores[key]) return;

  scores[key][side] = value;

  updateScoreInputColors(key);
  renderGamesTable();
  renderStandings();
  saveToStorage();
}

function updateScoreInputColors(key, root = document) {
  const inputA = root.querySelector(`#s${key}a`);
  const inputB = root.querySelector(`#s${key}b`);

  if (!inputA || !inputB) return;

  inputA.classList.remove('score-winner', 'score-loser', 'score-invalid');
  inputB.classList.remove('score-winner', 'score-loser', 'score-invalid');

  const score = scores[key];
  const validPair = getValidScorePair(score);

  if (score?.a === '' || score?.b === '') return;

  if (!validPair) {
    inputA.classList.add('score-invalid');
    inputB.classList.add('score-invalid');
    inputA.title = 'Use inteiros de 0 a 99. Os placares não podem ser iguais.';
    inputB.title = inputA.title;
    return;
  }

  inputA.title = '';
  inputB.title = '';

  inputA.classList.add(validPair.a > validPair.b ? 'score-winner' : 'score-loser');
  inputB.classList.add(validPair.b > validPair.a ? 'score-winner' : 'score-loser');
}

function renderRoundsNames() {
  if (!generated) return;

  const names = getNames();

  ROUNDS.forEach((courts, roundIndex) => {
    courts.forEach((match, courtIndex) => {
      const key = `${roundIndex}-${courtIndex}`;
      const inputA = document.getElementById(`s${key}a`);
      const row = inputA?.closest('.court-row');

      if (!row) return;

      const nameElements = row.querySelectorAll('.player-name');
      const playerIds = [...match.a, ...match.b];

      nameElements.forEach((element, index) => {
        element.textContent = names[playerIds[index]];
      });
    });
  });
}

function getPlayerGamesByRound() {
  const saldoPerRound = Array.from({ length: 8 }, () => Array(7).fill(null));
  const gamesWon = Array(8).fill(0);
  const gamesLost = Array(8).fill(0);
  const wins = Array(8).fill(0);

  ROUNDS.forEach((courts, roundIndex) => {
    courts.forEach((match, courtIndex) => {
      const key = `${roundIndex}-${courtIndex}`;
      const score = getValidScorePair(scores[key]);

      // Partidas incompletas ou com placares inválidos não contam.
      if (!score) return;

      match.a.forEach(playerId => {
        saldoPerRound[playerId][roundIndex] =
          (saldoPerRound[playerId][roundIndex] || 0) + score.a - score.b;

        gamesWon[playerId] += score.a;
        gamesLost[playerId] += score.b;
      });

      match.b.forEach(playerId => {
        saldoPerRound[playerId][roundIndex] =
          (saldoPerRound[playerId][roundIndex] || 0) + score.b - score.a;

        gamesWon[playerId] += score.b;
        gamesLost[playerId] += score.a;
      });

      if (score.a > score.b) {
        match.a.forEach(playerId => wins[playerId]++);
      } else {
        match.b.forEach(playerId => wins[playerId]++);
      }
    });
  });

  return { saldoPerRound, gamesWon, gamesLost, wins };
}

function getDirectMatchData(playerA, playerB) {
  const stats = {
    totalA: 0,
    totalB: 0,
    found: false,
    scheduled: 0,
    completed: 0
  };

  ROUNDS.forEach((courts, roundIndex) => {
    courts.forEach((match, courtIndex) => {
      const aHasA = match.a.includes(playerA);
      const aHasB = match.a.includes(playerB);
      const bHasA = match.b.includes(playerA);
      const bHasB = match.b.includes(playerB);

      if (!((aHasA && bHasB) || (aHasB && bHasA))) return;

      stats.scheduled++;

      const key = `${roundIndex}-${courtIndex}`;
      const score = getValidScorePair(scores[key]);

      if (!score) return;

      stats.found = true;
      stats.completed++;

      if (aHasA && bHasB) {
        stats.totalA += score.a;
        stats.totalB += score.b;
      } else {
        stats.totalA += score.b;
        stats.totalB += score.a;
      }
    });
  });

  return stats;
}

function getCollectiveDirectGames(players) {
  if (players.length < 2) return null;

  const gamesByPlayer = new Map(players.map(player => [player.index, 0]));

  for (let first = 0; first < players.length; first++) {
    for (let second = first + 1; second < players.length; second++) {
      const playerA = players[first];
      const playerB = players[second];
      const direct = getDirectMatchData(playerA.index, playerB.index);

      if (direct.scheduled === 0 || direct.completed !== direct.scheduled) {
        return null;
      }

      gamesByPlayer.set(
        playerA.index,
        gamesByPlayer.get(playerA.index) + direct.totalA
      );

      gamesByPlayer.set(
        playerB.index,
        gamesByPlayer.get(playerB.index) + direct.totalB
      );
    }
  }

  return gamesByPlayer;
}

function selectAgeTiebreak(playerA, playerB, winner) {
  const key = playerA < playerB
    ? `${playerA}-${playerB}`
    : `${playerB}-${playerA}`;

  manualAgeTiebreak[key] = winner;
  saveToStorage();
  renderStandings();
}

function getAgeTiebreakWinner(playerA, playerB) {
  const key = playerA < playerB
    ? `${playerA}-${playerB}`
    : `${playerB}-${playerA}`;

  return manualAgeTiebreak[key] ?? null;
}

function renderGamesTable() {
  const names = getNames();
  const { saldoPerRound } = getPlayerGamesByRound();
  const section = document.getElementById('games-table-section');

  const card = document.createElement('div');
  card.className = 'card';

  const header = document.createElement('div');
  header.className = 'card-header';
  header.textContent = 'Saldo de games por rodada';
  card.appendChild(header);

  const wrapper = document.createElement('div');
  wrapper.className = 'games-table-wrap';

  let tableHtml = '<table class="games-table"><thead><tr><th>Jogador</th>';

  for (let round = 1; round <= 7; round++) {
    tableHtml += `<th>J${round}</th>`;
  }

  tableHtml += '<th>Total</th></tr></thead><tbody>';

  const rows = saldoPerRound.map((rounds, playerIndex) => ({
    playerIndex,
    rounds,
    totalSaldo: rounds.reduce(
      (total, value) => total + (value !== null ? value : 0),
      0
    )
  })).sort((a, b) =>
    b.totalSaldo - a.totalSaldo || a.playerIndex - b.playerIndex
  );

  rows.forEach(({ playerIndex, rounds, totalSaldo }) => {
    tableHtml += `<tr><td>${escapeHTML(names[playerIndex])}</td>`;

    for (let roundIndex = 0; roundIndex < 7; roundIndex++) {
      const value = rounds[roundIndex];

      tableHtml += value !== null
        ? `<td>${value > 0 ? '+' : ''}${value}</td>`
        : '<td class="no-game">–</td>';
    }

    tableHtml += `<td class="total-cell">${totalSaldo > 0 ? '+' : ''}${totalSaldo}</td></tr>`;
  });

  tableHtml += '</tbody></table>';
  wrapper.innerHTML = tableHtml;
  card.appendChild(wrapper);

  section.innerHTML = '';
  section.appendChild(card);
}

function renderStandings() {
  const names = getNames();
  const { saldoPerRound, gamesWon, gamesLost, wins } = getPlayerGamesByRound();

  const completeTournament = allScoresComplete();

  const totals = saldoPerRound.map(rounds =>
    rounds.reduce((sum, value) => sum + (value !== null ? value : 0), 0)
  );

  const players = totals.map((saldo, index) => ({
    index,
    name: names[index],
    saldo,
    gamesWon: gamesWon[index],
    gamesLost: gamesLost[index],
    wins: wins[index]
  }));

  const directCriteriaByPlayer = new Map();
  const directGamesByPlayer = new Map();
  const ageSelectionRows = new Set();

  players.sort((a, b) =>
    b.gamesWon - a.gamesWon ||
    b.saldo - a.saldo ||
    b.wins - a.wins ||
    a.index - b.index
  );

  for (let start = 0; start < players.length;) {
    let end = start + 1;

    while (
      end < players.length &&
      players[end].gamesWon === players[start].gamesWon &&
      players[end].saldo === players[start].saldo &&
      players[end].wins === players[start].wins
    ) {
      end++;
    }

    const group = players.slice(start, end);
    const directGames = getCollectiveDirectGames(group);

    if (directGames) {
      group.forEach(player => {
        directGamesByPlayer.set(player.index, directGames.get(player.index));
      });

      group.sort((a, b) =>
        directGames.get(b.index) - directGames.get(a.index) ||
        a.index - b.index
      );

      if (group.length === 2) {
        const first = group[0];
        const second = group[1];
        const direct = getDirectMatchData(first.index, second.index);

        if (direct.totalA !== direct.totalB) {
          directCriteriaByPlayer.set(
            first.index,
            `4° critério: confronto direto — ${first.name} ${direct.totalA} x ${direct.totalB} ${second.name}`
          );
        }
      }
    }

    players.splice(start, group.length, ...group);
    start = end;
  }

  /*
    IMPORTANTE:
    Só libera mensagens e botões de desempate por idade quando
    todas as 14 partidas possuem placares válidos.
  */
  if (completeTournament) {
    for (let position = 1; position < players.length; position++) {
      const previous = players[position - 1];
      const current = players[position];

      const tiedOnFirstThree =
        current.gamesWon === previous.gamesWon &&
        current.saldo === previous.saldo &&
        current.wins === previous.wins;

      if (!tiedOnFirstThree) continue;

      const previousDirect = directGamesByPlayer.get(previous.index);
      const currentDirect = directGamesByPlayer.get(current.index);

      const tiedOnDirect =
        previousDirect === undefined ||
        currentDirect === undefined ||
        previousDirect === currentDirect;

      if (!tiedOnDirect) continue;

      const winner = getAgeTiebreakWinner(previous.index, current.index);

      if (!winner) {
        ageSelectionRows.add(position);
      }
    }

    // Aplica escolhas por idade somente com o torneio completo.
    for (let position = 1; position < players.length; position++) {
      const previous = players[position - 1];
      const current = players[position];

      if (
        current.gamesWon !== previous.gamesWon ||
        current.saldo !== previous.saldo ||
        current.wins !== previous.wins
      ) continue;

      const previousDirect = directGamesByPlayer.get(previous.index);
      const currentDirect = directGamesByPlayer.get(current.index);

      if (
        previousDirect !== undefined &&
        currentDirect !== undefined &&
        previousDirect !== currentDirect
      ) continue;

      const winner = getAgeTiebreakWinner(previous.index, current.index);

      if (winner === current.index) {
        players[position - 1] = current;
        players[position] = previous;
      }
    }
  }

  const standingsSection = document.getElementById('standings-section');
  const card = document.createElement('div');
  card.className = 'standings-card';

  const header = document.createElement('div');
  header.className = 'card-header';
  header.textContent = 'Classificação final';
  card.appendChild(header);

  players.forEach((player, position) => {
    const previous = position > 0 ? players[position - 1] : null;

    const isAgeWinner = completeTournament &&
      previous &&
      getAgeTiebreakWinner(player.index, previous.index) === player.index;

    const row = document.createElement('div');
    row.className =
      `standing-row ${position === 0 ? 'top1' : position === 1 ? 'top2' : position === 2 ? 'top3' : ''}` +
      `${isAgeWinner ? ' age-winner' : ''}`;

    const posClass = position === 0 ? 'gold'
      : position === 1 ? 'silver'
      : position === 2 ? 'bronze'
      : '';

    const medal = position === 0 ? '1°'
      : position === 1 ? '2°'
      : position === 2 ? '3°'
      : `${position + 1}°`;

    const isRelegated = position === players.length - 1;

    const placementBadge = position === 0
      ? '<span class="placement-badge champion-badge">Campeão</span>'
      : position === 1
        ? '<span class="placement-badge second-badge">2º colocado</span>'
        : position === 2
          ? '<span class="placement-badge third-badge">3º colocado</span>'
          : '';

    let actionButtons = '';

    if (completeTournament && ageSelectionRows.has(position) && previous) {
      actionButtons = `
        <div class="tiebreak-note">
          <strong>Critérios empatados.</strong>
          Selecione o jogador mais velho para definir a posição.
        </div>
        <div class="age-tiebreak-actions">
          <button class="tie-btn" type="button"
            data-winner="${player.index}" data-loser="${previous.index}">
            ${escapeHTML(player.name)}
          </button>
          <button class="tie-btn" type="button"
            data-winner="${previous.index}" data-loser="${player.index}">
            ${escapeHTML(previous.name)}
          </button>
        </div>
      `;
    }

    const criteria = directCriteriaByPlayer.get(player.index) || '';

    row.innerHTML = `
      <span class="pos ${posClass}">${medal}</span>
      <div class="standing-info">
        <div class="standing-name-line">
          <span class="standing-name">${escapeHTML(player.name)}</span>
          ${placementBadge}
          ${isRelegated ? '<span class="relegated-badge">Rebaixado</span>' : ''}
        </div>
        ${criteria ? `<span class="standing-criteria">${escapeHTML(criteria)}</span>` : ''}
        ${actionButtons}
      </div>
      <div class="standing-metrics">
        <div class="standing-metric primary-metric">
          <span class="games-lbl">games<br>ganhos</span>
          <span class="games-val">${player.gamesWon}</span>
        </div>
        <div class="standing-metric saldo-metric">
          <div class="saldo-main-line">
            <span class="games-lbl">saldo</span>
            <span class="games-val">${player.saldo > 0 ? '+' : ''}${player.saldo}</span>
          </div>
          <span class="saldo-breakdown">
            ganhos ${player.gamesWon} × ${player.gamesLost} perdidos
          </span>
        </div>
        <div class="standing-metric">
          <span class="games-lbl">vitórias</span>
          <span class="games-val">${player.wins}</span>
        </div>
      </div>
    `;

    card.appendChild(row);
  });

  // Informa o motivo de o desempate por idade ainda não aparecer.
  if (!completeTournament) {
    const notice = document.createElement('div');
    notice.className = 'tiebreak-note';
    notice.textContent =
      'O desempate por idade será disponibilizado após o preenchimento válido dos placares das 14 partidas.';
    card.appendChild(notice);
  }

  standingsSection.innerHTML = '';
  standingsSection.appendChild(card);

  card.querySelectorAll('.tie-btn').forEach(button => {
    button.addEventListener('click', () => {
      const winner = Number(button.dataset.winner);
      const loser = Number(button.dataset.loser);
      selectAgeTiebreak(winner, loser, winner);
    });
  });
}

function exportPDF() {
  window.print();
}

function showPdfBtn() {
  const button = document.getElementById('btn-pdf');
  if (button) button.style.display = '';
}

function resetAll() {
  if (!confirm('Tem certeza que deseja apagar todos os dados?')) return;

  localStorage.removeItem(STORAGE_KEY);

  scores = {};
  generated = false;
  manualAgeTiebreak = {};

  buildPlayerGrid(null);

  document.getElementById('rounds-section').innerHTML = '';
  document.getElementById('games-table-section').innerHTML = '';
  document.getElementById('standings-section').innerHTML = '';

  const pdfButton = document.getElementById('btn-pdf');
  if (pdfButton) pdfButton.style.display = 'none';
}

function initializeButtons() {
  document.getElementById('btn-generate')
    .addEventListener('click', () => generateTournament(false));

  document.getElementById('btn-reset')
    .addEventListener('click', resetAll);

  document.getElementById('btn-pdf')
    .addEventListener('click', exportPDF);
}

function init() {
  initializeButtons();

  const savedState = loadFromStorage();

  if (savedState) {
    scores = savedState.scores || {};
    generated = Boolean(savedState.generated);
    manualAgeTiebreak = savedState.manualAgeTiebreak || {};

    buildPlayerGrid(savedState.names);

    if (generated) {
      generateTournament(true);
      return;
    }

    return;
  }

  buildPlayerGrid(null);
}

init();
