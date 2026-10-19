/*
  script.js
  Regras de geração de tabela, controle de placares, classificação e armazenamento local.
  Este arquivo entende e roda o torneio Super 8 com suporte a:
  - digitação de nomes de jogadores
  - geração automática de rodadas e quadras
  - registro de placares por partida
  - cálculo de saldo de games e ranking final
  - persistência dos dados no localStorage
*/

const ROUNDS = [
    [{a:[0,1], b:[2,3]}, {a:[4,5], b:[6,7]}], // R1: 0-1 vs 2-3 | 4-5 vs 6-7
    [{a:[0,4], b:[5,1]}, {a:[2,6], b:[7,3]}], // R2: 0-4 vs 5-1 | 2-6 vs 7-3
    [{a:[0,6], b:[7,1]}, {a:[2,4], b:[5,3]}], // R3: 0-6 vs 7-1 | 2-4 vs 5-3
    [{a:[0,2], b:[4,6]}, {a:[1,3], b:[5,7]}], // R4: 0-2 vs 4-6 | 1-3 vs 5-7
    [{a:[0,3], b:[5,6]}, {a:[1,2], b:[4,7]}], // R5: 0-3 vs 5-6 | 1-2 vs 4-7
    [{a:[0,5], b:[2,7]}, {a:[1,4], b:[3,6]}], // R6: 0-5 vs 2-7 | 1-4 vs 3-6
    [{a:[0,7], b:[3,4]}, {a:[1,6], b:[2,5]}]  // R7: 0-7 vs 3-4 | 1-6 vs 2-5
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
                                                                                      <div class="score-inputs">
                                                                                                <input class="score-input" type="number" min="0" max="99" placeholder="–" id="s${key}a" value="${scoreA}" />
                                                                                                          <span class="score-sep">×</span>
                                                                                                                    <input class="score-input" type="number" min="0" max="99" placeholder="–" id="s${key}b" value="${scoreB}" />
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
                             updateScoreInputColors(key, row);

                                          card.appendChild(row);
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

function updateScore(key, side, value) {
    scores[key][side] = value === '' ? '' : Math.max(0, parseInt(value, 10) || 0);
    updateScoreInputColors(key);
    renderGamesTable();
    renderStandings();
    saveToStorage();
}

function updateScoreInputColors(key, root = document) {
    const inputA = root.querySelector(`#s${key}a`);
    const inputB = root.querySelector(`#s${key}b`);
    if (!inputA || !inputB) {
          return;
    }

  inputA.classList.remove('score-winner', 'score-loser');
    inputB.classList.remove('score-winner', 'score-loser');

  const scoreA = scores[key]?.a !== '' ? Number(scores[key].a) : null;
    const scoreB = scores[key]?.b !== '' ? Number(scores[key].b) : null;
    if (scoreA === null || scoreB === null || !Number.isFinite(scoreA) || !Number.isFinite(scoreB) || scoreA === scoreB) {
          return;
    }

  inputA.classList.add(scoreA > scoreB ? 'score-winner' : 'score-loser');
    inputB.classList.add(scoreB > scoreA ? 'score-winner' : 'score-loser');
}

function getPlayerGamesByRound() {
    const saldoPerRound = Array.from({ length: 8 }, () => Array(7).fill(null));
    const gamesWon = new Array(8).fill(0);
    const gamesLost = new Array(8).fill(0);
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
                                       saldoPerRound[playerId][roundIndex] = (saldoPerRound[playerId][roundIndex] || 0) + aValue - bValue;
                                       gamesWon[playerId] += aValue;
                                       gamesLost[playerId] += bValue;
                             });
                match.b.forEach((playerId) => {
                          saldoPerRound[playerId][roundIndex] = (saldoPerRound[playerId][roundIndex] || 0) + bValue - aValue;
                          gamesWon[playerId] += bValue;
                          gamesLost[playerId] += aValue;
                });

                             if (aValue > bValue) {
                                       match.a.forEach((playerId) => wins[playerId]++);
                             } else if (bValue > aValue) {
                                       match.b.forEach((playerId) => wins[playerId]++);
                             }
        });
  });

  return { saldoPerRound, gamesWon, gamesLost, wins };
}

function getDirectMatchData(playerA, playerB) {
    let stats = { totalA: 0, totalB: 0, found: false, scheduled: 0, completed: 0 };

  for (let roundIndex = 0; roundIndex < ROUNDS.length; roundIndex++) {
        for (let courtIndex = 0; courtIndex < ROUNDS[roundIndex].length; courtIndex++) {
                const match = ROUNDS[roundIndex][courtIndex];
                const aHasA = match.a.includes(playerA);
                const aHasB = match.a.includes(playerB);
                const bHasA = match.b.includes(playerA);
                const bHasB = match.b.includes(playerB);

          if ((aHasA && bHasB) || (aHasB && bHasA)) {
                    stats.scheduled++;
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

                  stats.found = true;
              stats.completed++;
                    if (aHasA && bHasB) {
                                stats.totalA += aValue;
                                stats.totalB += bValue;
                    } else {
                                stats.totalA += bValue;
                                stats.totalB += aValue;
                    }
          }
        }
  }
    return stats;
}

function getDirectResult(playerA, playerB) {
    const { totalA, totalB, found } = getDirectMatchData(playerA, playerB);

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

function getCollectiveDirectGames(players) {
    if (players.length < 2) {
          return null;
    }

  const gamesByPlayer = new Map(players.map((player) => [player.index, 0]));

  for (let first = 0; first < players.length; first++) {
        for (let second = first + 1; second < players.length; second++) {
                const playerA = players[first];
                const playerB = players[second];
                const directGames = getDirectMatchData(playerA.index, playerB.index);

          if (directGames.scheduled === 0 || directGames.completed !== directGames.scheduled) {
                    return null;
          }

          gamesByPlayer.set(playerA.index, gamesByPlayer.get(playerA.index) + directGames.totalA);
                gamesByPlayer.set(playerB.index, gamesByPlayer.get(playerB.index) + directGames.totalB);
        }
  }

  return gamesByPlayer;
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
  Exibe o saldo de games por rodada para cada jogador.
  A tabela é recalculada sempre que um placar muda.
*/
function renderGamesTable() {
    const names = getNames();
    const { saldoPerRound } = getPlayerGamesByRound();
    const section = document.getElementById('games-table-section');

  const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = '<div class="card-header">Saldo de games por rodada</div>';

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
        totalSaldo: rounds.reduce((current, value) => current + (value !== null ? value : 0), 0)
  })).sort((playerA, playerB) => playerB.totalSaldo - playerA.totalSaldo || playerA.playerIndex - playerB.playerIndex);

  rows.forEach(({ playerIndex, rounds, totalSaldo }) => {
        tableHtml += `<tr><td>${names[playerIndex]}</td>`;
        for (let roundIndex = 0; roundIndex < 7; roundIndex++) {
                const value = rounds[roundIndex];
                tableHtml += value !== null ? `<td>${value > 0 ? '+' : ''}${value}</td>` : '<td class="no-game">–</td>';
        }
        tableHtml += `<td class="total-cell">${totalSaldo > 0 ? '+' : ''}${totalSaldo}</td></tr>`;
  });

  tableHtml += '</tbody></table>';
    wrapper.innerHTML = tableHtml;
    card.appendChild(wrapper);

  section.innerHTML = '';
    section.appendChild(card);
}

/*
  renderStandings
  Calcula a classificação final com base em:
  1. games ganhos totais
  2. saldo de games (games ganhos menos games perdidos)
  3. vitórias em partidas
  4. confronto direto entre jogadores empatados
  5. desempate por idade quando necessário
*/
function renderStandings() {
    const names = getNames();
    const { saldoPerRound, gamesWon, gamesLost, wins } = getPlayerGamesByRound();

  const totals = saldoPerRound.map((rounds) => rounds.reduce((sum, value) => sum + (value !== null ? value : 0), 0));

  const players = totals.map((saldo, index) => ({
        index,
        name: names[index],
        saldo,
        gamesWon: gamesWon[index],
        gamesLost: gamesLost[index],
        wins: wins[index]
  }));

  const criteriaMessages = new Array(players.length).fill(null);
    const directCriteriaByPlayer = new Map();
    const directGamesByPlayer = new Map();
    const ageSelectionRows = new Set();

  const playersByCriteria = [...players].sort((playerA, playerB) =>
        playerB.gamesWon - playerA.gamesWon ||
        playerB.saldo - playerA.saldo ||
        playerB.wins - playerA.wins
                                                );
    const orderedPlayers = [];

  for (let groupStart = 0; groupStart < playersByCriteria.length;) {
        let groupEnd = groupStart + 1;
        while (
                groupEnd < playersByCriteria.length &&
                playersByCriteria[groupEnd].gamesWon === playersByCriteria[groupStart].gamesWon &&
                playersByCriteria[groupEnd].saldo === playersByCriteria[groupStart].saldo &&
                playersByCriteria[groupEnd].wins === playersByCriteria[groupStart].wins
              ) {
                groupEnd++;
        }

      const tiedGroup = playersByCriteria.slice(groupStart, groupEnd);
        const collectiveDirectGames = getCollectiveDirectGames(tiedGroup);

      if (collectiveDirectGames) {
              const groupScores = tiedGroup.map((player) => collectiveDirectGames.get(player.index));
              tiedGroup.forEach((player) => {
                        const playerDirectGames = collectiveDirectGames.get(player.index);
                        directGamesByPlayer.set(player.index, playerDirectGames);
              });

          const highestDirectGames = Math.max(...groupScores);
              const highestScorers = tiedGroup.filter(
                        (player) => collectiveDirectGames.get(player.index) === highestDirectGames
                      );

          if (highestScorers.length === 1) {
                    const winner = highestScorers[0];
                    const otherDirectGames = groupScores.reduce((total, score) => total + score, 0) - highestDirectGames;
                    let directScore = `${winner.name} ${highestDirectGames} x ${otherDirectGames} grupo`;

                if (tiedGroup.length === 2) {
                            const opponent = tiedGroup.find((player) => player.index !== winner.index);
                            const pairGames = getDirectMatchData(winner.index, opponent.index);
                            directScore = `${winner.name} ${pairGames.totalA} x ${pairGames.totalB} ${opponent.name}`;
                }

                directCriteriaByPlayer.set(winner.index, `4° critério: confronto direto — ${directScore}`);
          }
      }

      tiedGroup.sort((playerA, playerB) => {
              if (collectiveDirectGames) {
                        const directDifference = collectiveDirectGames.get(playerB.index) - collectiveDirectGames.get(playerA.index);
                        if (directDifference !== 0) {
                                    return directDifference;
                        }
              }

                           const manualWinner = getAgeTiebreakWinner(playerA.index, playerB.index);
              if (manualWinner === playerA.index) {
                        return -1;
              }
              if (manualWinner === playerB.index) {
                        return 1;
              }
              return 0;
      });

      orderedPlayers.push(...tiedGroup);
        groupStart = groupEnd;
  }
    players.splice(0, players.length, ...orderedPlayers);

  players.forEach((player, position) => {
        criteriaMessages[position] = directCriteriaByPlayer.get(player.index) || null;
  });

  for (let position = 1; position < players.length; position++) {
        const currentPlayer = players[position];
        const previousPlayer = players[position - 1];

      if (
              currentPlayer.gamesWon !== previousPlayer.gamesWon ||
              currentPlayer.saldo !== previousPlayer.saldo ||
              currentPlayer.wins !== previousPlayer.wins
            ) {
              continue;
      }

      const previousDirectGames = directGamesByPlayer.get(previousPlayer.index);
        const currentDirectGames = directGamesByPlayer.get(currentPlayer.index);
        if (
                previousDirectGames === undefined ||
                currentDirectGames === undefined ||
                previousDirectGames !== currentDirectGames
              ) {
                continue;
        }

      const manualWinner = getAgeTiebreakWinner(currentPlayer.index, previousPlayer.index);
        if (manualWinner) {
                const winnerRow = manualWinner === previousPlayer.index ? position - 1 : position;
                criteriaMessages[winnerRow] = '5° critério: idade, o competidor mais velho vence';
        } else {
                ageSelectionRows.add(position);
        }
  }

  const standingsSection = document.getElementById('standings-section');
    const card = document.createElement('div');
    card.className = 'standings-card';
    card.innerHTML = '<div class="card-header"><span>Classificação final</span></div>';

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
        const isRelegated = position === players.length - 1;
        const placementBadge = position === 0
          ? '<span class="placement-badge champion-badge">Campeão</span>'
                : position === 1
            ? '<span class="placement-badge second-badge">2º colocado</span>'
                  : position === 2
              ? '<span class="placement-badge third-badge">3º colocado</span>'
                    : '';

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
                                          <div class="standing-name-line">
                                                    <span class="standing-name" style="${isChampion ? 'font-size:16px;' : ''}">${player.name}</span>
                                                              ${placementBadge}
                                                                        ${isRelegated ? '<span class="relegated-badge">Rebaixado</span>' : ''}
                                                                                </div>
                                                                                        ${criteria ? `<span class="standing-criteria">${criteria}</span>` : ''}
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
                                                                                                                                                                                                              <span class="saldo-breakdown">ganhos ${player.gamesWon} × ${player.gamesLost} perdidos</span>
                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                              <div class="standing-metric">
                                                                                                                                                                                                                                        <span class="games-lbl">vitórias</span>
                                                                                                                                                                                                                                                  <span class="games-val">${player.wins}</span>
                                                                                                                                                                                                                                                          </div>
                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                                    `;

                      card.appendChild(row);
  });

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
              generateTournament(true);
              return;
      }
    }

  buildPlayerGrid(null);
}

init();
