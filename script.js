
/*
  Super 8 Padel
  Geração de rodadas, placares, classificação e armazenamento local.

  Regras:
  - 8 jogadores, 7 rodadas e 2 partidas por rodada.
  - Placares inteiros entre 0 e 99.
  - Não são permitidos placares empatados.
  - Critérios de classificação:
    1º Games ganhos totais
    2º Saldo de games
    3º Vitórias em partidas
    4º Confronto direto (games somados)
    5º Idade: competidor mais velho
  - O desempate por idade só é disponibilizado após os
    14 placares estarem preenchidos e válidos.
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

/* --------------------------------------------------
   Armazenamento
-------------------------------------------------- */

function saveToStorage() {
    const names = Array.from({ length: 8 }, (_, i) => {
        const input = document.getElementById(`p${i}`);
        return input?.value || `Jogador ${i + 1}`;
    });

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            names,
            scores,
            generated,
            manualAgeTiebreak
        }));
    } catch (error) {
        console.warn('Não foi possível salvar os dados:', error);
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

/* --------------------------------------------------
   Jogadores
-------------------------------------------------- */

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
                renderGamesTable();
                renderStandings();
            }
        });

        input.addEventListener('focus', () => input.select());

        wrap.appendChild(label);
        wrap.appendChild(input);
        grid.appendChild(wrap);
    }
}

function getNames() {
    return Array.from({ length: 8 }, (_, i) => {
        const input = document.getElementById(`p${i}`);
        return input?.value.trim() || `Jogador ${i + 1}`;
    });
}

function validatePlayerNames() {
    for (let i = 0; i < 8; i++) {
        const input = document.getElementById(`p${i}`);

        if (!input || !input.value.trim()) {
            alert(`Por favor, preencha o nome do Jogador ${i + 1}.`);
            input?.focus();
            return false;
        }
    }

    return true;
}

/* Evita que nomes digitados sejam interpretados como HTML. */
function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

/* --------------------------------------------------
   Validação dos placares
-------------------------------------------------- */

function getValidScorePair(score) {
    if (!score || score.a === '' || score.b === '') {
        return null;
    }

    const a = Number(score.a);
    const b = Number(score.b);

    if (
        !Number.isInteger(a) ||
        !Number.isInteger(b) ||
        a < 0 ||
        a > 99 ||
        b < 0 ||
        b > 99 ||
        a === b
    ) {
        return null;
    }

    return { a, b };
}

function allScoresComplete() {
    return ROUNDS.every((courts, roundIndex) =>
        courts.every((match, courtIndex) => {
            const key = `${roundIndex}-${courtIndex}`;
            return getValidScorePair(scores[key]) !== null;
        })
    );
}

/* --------------------------------------------------
   Geração do torneio
-------------------------------------------------- */

function generateTournament(savedScores = false) {
    if (!validatePlayerNames()) {
        return;
    }

    generated = true;

    if (!savedScores) {
        scores = {};
        manualAgeTiebreak = {};
    }

    const roundsSection = document.getElementById('rounds-section');
    roundsSection.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'rounds-container';

    const names = getNames();

    ROUNDS.forEach((courts, roundIndex) => {
        const card = document.createElement('div');
        card.className = 'card';

        const header = document.createElement('div');
        header.className = 'card-header';
        header.textContent = `Rodada ${roundIndex + 1}`;
        card.appendChild(header);

        courts.forEach((match, courtIndex) => {
            const key = `${roundIndex}-${courtIndex}`;

            if (!savedScores || !scores[key]) {
                scores[key] = { a: '', b: '', match };
            } else {
                scores[key].match = match;
            }

            const scoreA = scores[key].a ?? '';
            const scoreB = scores[key].b ?? '';

            const row = document.createElement('div');
            row.className = 'court-row';

            const teamA = document.createElement('div');
            teamA.className = 'team';

            match.a.forEach((playerId) => {
                const playerName = document.createElement('span');
                playerName.className = 'player-name';
                playerName.textContent = names[playerId];
                teamA.appendChild(playerName);
            });

            const scoreInputs = document.createElement('div');
            scoreInputs.className = 'score-inputs';

            const inputA = document.createElement('input');
            inputA.className = 'score-input';
            inputA.type = 'number';
            inputA.min = '0';
            inputA.max = '99';
            inputA.step = '1';
            inputA.placeholder = '–';
            inputA.id = `s${key}a`;
            inputA.value = scoreA;

            const separator = document.createElement('span');
            separator.className = 'score-sep';
            separator.textContent = '×';

            const inputB = document.createElement('input');
            inputB.className = 'score-input';
            inputB.type = 'number';
            inputB.min = '0';
            inputB.max = '99';
            inputB.step = '1';
            inputB.placeholder = '–';
            inputB.id = `s${key}b`;
            inputB.value = scoreB;

            scoreInputs.appendChild(inputA);
            scoreInputs.appendChild(separator);
            scoreInputs.appendChild(inputB);

            const teamB = document.createElement('div');
            teamB.className = 'team right';

            match.b.forEach((playerId) => {
                const playerName = document.createElement('span');
                playerName.className = 'player-name';
                playerName.textContent = names[playerId];
                teamB.appendChild(playerName);
            });

            row.appendChild(teamA);
            row.appendChild(scoreInputs);
            row.appendChild(teamB);

            inputA.addEventListener('input', () => {
                updateScore(key, 'a', inputA.value);
            });

            inputB.addEventListener('input', () => {
                updateScore(key, 'b', inputB.value);
            });

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
            <div>1º - Games ganhos totais</div>
            <div>2º - Saldo de games (games ganhos menos games perdidos)</div>
            <div>3º - Vitórias em partidas</div>
            <div>4º - Confronto direto (soma de games)</div>
            <div>5º - Idade: o competidor mais velho vence</div>
        </div>
    `;

    container.appendChild(criteriaCard);
    roundsSection.appendChild(container);

    renderGamesTable();
    renderStandings();
    showPdfBtn();
    saveToStorage();
}

/* --------------------------------------------------
   Atualização dos placares
-------------------------------------------------- */

function updateScore(key, side, value) {
    if (!scores[key]) {
        scores[key] = { a: '', b: '' };
    }

    if (value === '') {
        scores[key][side] = '';
    } else {
        const parsed = Number(value);

        if (!Number.isInteger(parsed)) {
            scores[key][side] = '';
        } else {
            scores[key][side] = Math.max(0, Math.min(99, parsed));
        }
    }

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

    const pair = getValidScorePair(scores[key]);

    if (!pair) {
        return;
    }

    inputA.classList.add(pair.a > pair.b ? 'score-winner' : 'score-loser');
    inputB.classList.add(pair.b > pair.a ? 'score-winner' : 'score-loser');
}

/* --------------------------------------------------
   Estatísticas individuais
-------------------------------------------------- */

function getPlayerGamesByRound() {
    const saldoPerRound = Array.from(
        { length: 8 },
        () => Array(7).fill(null)
    );

    const gamesWon = new Array(8).fill(0);
    const gamesLost = new Array(8).fill(0);
    const wins = new Array(8).fill(0);

    ROUNDS.forEach((courts, roundIndex) => {
        courts.forEach((match, courtIndex) => {
            const key = `${roundIndex}-${courtIndex}`;
            const pair = getValidScorePair(scores[key]);

            if (!pair) {
                return;
            }

            const { a: scoreA, b: scoreB } = pair;

            match.a.forEach((playerId) => {
                saldoPerRound[playerId][roundIndex] =
                    (saldoPerRound[playerId][roundIndex] || 0) + scoreA - scoreB;

                gamesWon[playerId] += scoreA;
                gamesLost[playerId] += scoreB;
            });

            match.b.forEach((playerId) => {
                saldoPerRound[playerId][roundIndex] =
                    (saldoPerRound[playerId][roundIndex] || 0) + scoreB - scoreA;

                gamesWon[playerId] += scoreB;
                gamesLost[playerId] += scoreA;
            });

            if (scoreA > scoreB) {
                match.a.forEach((playerId) => wins[playerId]++);
            } else {
                match.b.forEach((playerId) => wins[playerId]++);
            }
        });
    });

    return { saldoPerRound, gamesWon, gamesLost, wins };
}

/* --------------------------------------------------
   Confronto direto entre dois jogadores
-------------------------------------------------- */

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

            const facedOpponents =
                (aHasA && bHasB) || (aHasB && bHasA);

            if (!facedOpponents) {
                return;
            }

            stats.scheduled++;

            const key = `${roundIndex}-${courtIndex}`;
            const pair = getValidScorePair(scores[key]);

            if (!pair) {
                return;
            }

            stats.found = true;
            stats.completed++;

            if (aHasA && bHasB) {
                stats.totalA += pair.a;
                stats.totalB += pair.b;
            } else {
                stats.totalA += pair.b;
                stats.totalB += pair.a;
            }
        });
    });

    return stats;
}

function getCollectiveDirectGames(players) {
    if (players.length < 2) {
        return null;
    }

    const gamesByPlayer = new Map(
        players.map((player) => [player.index, 0])
    );

    for (let first = 0; first < players.length; first++) {
        for (let second = first + 1; second < players.length; second++) {
            const playerA = players[first];
            const playerB = players[second];

            const directGames = getDirectMatchData(
                playerA.index,
                playerB.index
            );

            if (
                directGames.scheduled === 0 ||
                directGames.completed !== directGames.scheduled
            ) {
                return null;
            }

            gamesByPlayer.set(
                playerA.index,
                gamesByPlayer.get(playerA.index) + directGames.totalA
            );

            gamesByPlayer.set(
                playerB.index,
                gamesByPlayer.get(playerB.index) + directGames.totalB
            );
        }
    }

    return gamesByPlayer;
}

/* --------------------------------------------------
   Desempate manual por idade
-------------------------------------------------- */

function getAgeTiebreakKey(playerA, playerB) {
    return playerA < playerB
        ? `${playerA}-${playerB}`
        : `${playerB}-${playerA}`;
}

function selectAgeTiebreak(playerA, playerB, winner) {
    if (!allScoresComplete()) {
        return;
    }

    const key = getAgeTiebreakKey(playerA, playerB);
    manualAgeTiebreak[key] = winner;

    saveToStorage();
    renderStandings();
}

function getAgeTiebreakWinner(playerA, playerB) {
    const key = getAgeTiebreakKey(playerA, playerB);
    return manualAgeTiebreak[key] ?? null;
}

/* --------------------------------------------------
   Tabela de saldo por rodada
-------------------------------------------------- */

function renderGamesTable() {
    const names = getNames();
    const { saldoPerRound } = getPlayerGamesByRound();
    const section = document.getElementById('games-table-section');

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML =
        '<div class="card-header">Saldo de games por rodada</div>';

    const wrapper = document.createElement('div');
    wrapper.className = 'games-table-wrap';

    let tableHtml =
        '<table class="games-table"><thead><tr><th>Jogador</th>';

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
    })).sort((playerA, playerB) =>
        playerB.totalSaldo - playerA.totalSaldo ||
        playerA.playerIndex - playerB.playerIndex
    );

    rows.forEach(({ playerIndex, rounds, totalSaldo }) => {
        tableHtml += `<tr><td>${escapeHtml(names[playerIndex])}</td>`;

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

/* --------------------------------------------------
   Classificação final
-------------------------------------------------- */

function renderStandings() {
    const names = getNames();
    const { saldoPerRound, gamesWon, gamesLost, wins } =
        getPlayerGamesByRound();

    const completeTournament = allScoresComplete();

    const totals = saldoPerRound.map((rounds) =>
        rounds.reduce(
            (sum, value) => sum + (value !== null ? value : 0),
            0
        )
    );

    const players = totals.map((saldo, index) => ({
        index,
        name: names[index],
        saldo,
        gamesWon: gamesWon[index],
        gamesLost: gamesLost[index],
        wins: wins[index]
    }));

    /*
      Primeiro ordena pelos três primeiros critérios.
      Jogadores empatados nesses critérios formam um grupo
      para aplicação do confronto direto.
    */
    const playersByCriteria = [...players].sort((playerA, playerB) =>
        playerB.gamesWon - playerA.gamesWon ||
        playerB.saldo - playerA.saldo ||
        playerB.wins - playerA.wins ||
        playerA.index - playerB.index
    );

    const orderedPlayers = [];
    const directCriteriaByPlayer = new Map();
    const directGamesByPlayer = new Map();

    for (let groupStart = 0; groupStart < playersByCriteria.length;) {
        let groupEnd = groupStart + 1;

        while (
            groupEnd < playersByCriteria.length &&
            playersByCriteria[groupEnd].gamesWon ===
                playersByCriteria[groupStart].gamesWon &&
            playersByCriteria[groupEnd].saldo ===
                playersByCriteria[groupStart].saldo &&
            playersByCriteria[groupEnd].wins ===
                playersByCriteria[groupStart].wins
        ) {
            groupEnd++;
        }

        const tiedGroup = playersByCriteria.slice(groupStart, groupEnd);
        const collectiveDirectGames = completeTournament
            ? getCollectiveDirectGames(tiedGroup)
            : null;

        if (collectiveDirectGames) {
            tiedGroup.forEach((player) => {
                directGamesByPlayer.set(
                    player.index,
                    collectiveDirectGames.get(player.index)
                );
            });

            const directScores = tiedGroup.map((player) =>
                collectiveDirectGames.get(player.index)
            );

            const highestDirectGames = Math.max(...directScores);
            const highestScorers = tiedGroup.filter((player) =>
                collectiveDirectGames.get(player.index) === highestDirectGames
            );

            if (highestScorers.length === 1) {
                const winner = highestScorers[0];

                if (tiedGroup.length === 2) {
                    const opponent = tiedGroup.find(
                        (player) => player.index !== winner.index
                    );

                    const direct = getDirectMatchData(
                        winner.index,
                        opponent.index
                    );

                    directCriteriaByPlayer.set(
                        winner.index,
                        `4º critério: confronto direto — ${winner.name} ${direct.totalA} x ${direct.totalB} ${opponent.name}`
                    );
                } else {
                    directCriteriaByPlayer.set(
                        winner.index,
                        `4º critério: confronto direto — melhor desempenho entre os empatados`
                    );
                }
            }
        }

        tiedGroup.sort((playerA, playerB) => {
            if (collectiveDirectGames) {
                const directDifference =
                    collectiveDirectGames.get(playerB.index) -
                    collectiveDirectGames.get(playerA.index);

                if (directDifference !== 0) {
                    return directDifference;
                }
            }

            /*
              A idade só pode ser aplicada quando os 14 placares
              estiverem completos e válidos.
            */
            if (completeTournament) {
                const manualWinner = getAgeTiebreakWinner(
                    playerA.index,
                    playerB.index
                );

                if (manualWinner === playerA.index) {
                    return -1;
                }

                if (manualWinner === playerB.index) {
                    return 1;
                }
            }

            return playerA.index - playerB.index;
        });

        orderedPlayers.push(...tiedGroup);
        groupStart = groupEnd;
    }

    players.splice(0, players.length, ...orderedPlayers);

    const criteriaMessages = players.map((player) =>
        directCriteriaByPlayer.get(player.index) || null
    );

    /*
      Identifica os empates que precisam de decisão por idade.
      Esta etapa não executa nem exibe o desempate antes de
      todos os placares estarem completos.
    */
    const ageSelectionRows = new Set();

    if (completeTournament) {
        for (let position = 1; position < players.length; position++) {
            const currentPlayer = players[position];
            const previousPlayer = players[position - 1];

            const sameFirstCriteria =
                currentPlayer.gamesWon === previousPlayer.gamesWon &&
                currentPlayer.saldo === previousPlayer.saldo &&
                currentPlayer.wins === previousPlayer.wins;

            if (!sameFirstCriteria) {
                continue;
            }

            const previousDirectGames =
                directGamesByPlayer.get(previousPlayer.index);

            const currentDirectGames =
                directGamesByPlayer.get(currentPlayer.index);

            /*
              Se o confronto direto não estiver disponível ou
              estiver empatado, pode ser necessário decidir pela idade.
            */
            if (
                previousDirectGames === undefined ||
                currentDirectGames === undefined ||
                previousDirectGames === currentDirectGames
            ) {
                const manualWinner = getAgeTiebreakWinner(
                    currentPlayer.index,
                    previousPlayer.index
                );

                if (!manualWinner) {
                    ageSelectionRows.add(position);
                } else {
                    const winnerRow =
                        manualWinner === previousPlayer.index
                            ? position - 1
                            : position;

                    criteriaMessages[winnerRow] =
                        '5º critério: idade — competidor mais velho';
                }
            }
        }
    }

    const standingsSection = document.getElementById('standings-section');
    const card = document.createElement('div');
    card.className = 'standings-card';
    card.innerHTML =
        '<div class="card-header"><span>Classificação final</span></div>';

    players.forEach((player, position) => {
        const previousPlayer = position > 0
            ? players[position - 1]
            : null;

        const isAgeWinner = completeTournament && previousPlayer
            ? getAgeTiebreakWinner(
                player.index,
                previousPlayer.index
            ) === player.index
            : false;

        const row = document.createElement('div');

        const rowClass =
            `standing-row ${position === 0 ? 'top1' :
                position === 1 ? 'top2' :
                position === 2 ? 'top3' : ''}` +
            `${isAgeWinner ? ' age-winner' : ''}`;

        row.className = rowClass;

        const posClass =
            position === 0 ? 'gold' :
            position === 1 ? 'silver' :
            position === 2 ? 'bronze' : '';

        const medal =
            position === 0 ? '1º' :
            position === 1 ? '2º' :
            position === 2 ? '3º' : `${position + 1}º`;

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

        if (completeTournament && ageSelectionRows.has(position)) {
            const previous = players[position - 1];

            actionButtons = `
                <div class="tiebreak-note">
                    <strong>Empate nos critérios anteriores.</strong>
                    Selecione o jogador mais velho para definir a classificação.
                </div>
                <div class="age-tiebreak-actions">
                    <button
                        class="tie-btn"
                        type="button"
                        data-winner="${player.index}"
                        data-loser="${previous.index}"
                    >${escapeHtml(player.name)}</button>
                    <button
                        class="tie-btn"
                        type="button"
                        data-winner="${previous.index}"
                        data-loser="${player.index}"
                    >${escapeHtml(previous.name)}</button>
                </div>
            `;
        }

        row.innerHTML = `
            <span class="pos ${posClass}">${medal}</span>

            <div class="standing-info">
                <div class="standing-name-line">
                    <span
                        class="standing-name"
                        style="${isChampion ? 'font-size:16px;' : ''}"
                    >${escapeHtml(player.name)}</span>

                    ${placementBadge}

                    ${isRelegated
                        ? '<span class="relegated-badge">Rebaixado</span>'
                        : ''}
                </div>

                ${criteria
                    ? `<span class="standing-criteria">${escapeHtml(criteria)}</span>`
                    : ''}

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
                        <span class="games-val">
                            ${player.saldo > 0 ? '+' : ''}${player.saldo}
                        </span>
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

    standingsSection.innerHTML = '';
    standingsSection.appendChild(card);

    const tiebreakButtons = card.querySelectorAll('.tie-btn');

    tiebreakButtons.forEach((button) => {
        button.addEventListener('click', () => {
            if (!allScoresComplete()) {
                return;
            }

            const winner = Number(button.dataset.winner);
            const loser = Number(button.dataset.loser);

            selectAgeTiebreak(winner, loser, winner);
        });
    });
}

/* --------------------------------------------------
   PDF
-------------------------------------------------- */

function exportPDF() {
    window.print();
}

function showPdfBtn() {
    const btn = document.getElementById('btn-pdf');

    if (btn) {
        btn.style.display = '';
    }
}

/* --------------------------------------------------
   Reiniciar torneio
-------------------------------------------------- */

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

/* --------------------------------------------------
   Botões e inicialização
-------------------------------------------------- */

function initializeButtons() {
    const generateButton = document.getElementById('btn-generate');
    const resetButton = document.getElementById('btn-reset');
    const pdfButton = document.getElementById('btn-pdf');

    generateButton?.addEventListener('click', () => {
        generateTournament(false);
    });

    resetButton?.addEventListener('click', resetAll);
    pdfButton?.addEventListener('click', exportPDF);
}

function init() {
    initializeButtons();

    const savedState = loadFromStorage();

    if (savedState) {
        scores = savedState.scores || {};
        generated = savedState.generated || false;
        manualAgeTiebreak = savedState.manualAgeTiebreak || {};

        buildPlayerGrid(savedState.names);

        if (generated) {
            generateTournament(true);
            return;
        }
    } else {
        buildPlayerGrid(null);
    }
}

init();
