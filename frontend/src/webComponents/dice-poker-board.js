class DicePokerBoard extends HTMLElement {
  static get observedAttributes() {
    return ['player1', 'player2', 'bestof', 'include-straight', 'current-user-player', 'tournament-match'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.round = 1;
    this.scores = { player1: 0, player2: 0 };
    this.currentPlayer = 'player1';
    this.rollsLeft = { player1: 3, player2: 3 };
    this.held = { player1: [false, false, false, false, false], player2: [false, false, false, false, false] };
    this.faces = { player1: [], player2: [] };
    this.player1Done = false;
    this.player2Done = false;
    this.matchOver = false;
  }

  connectedCallback() {
    this.render();
    this.startRound();
  }

  get p1Name() { return this.getAttribute('player1') || 'Player 1'; }
  get p2Name() { return this.getAttribute('player2') || 'Player 2'; }
  get bestof() { return parseInt(this.getAttribute('bestof') || '3'); }
  get includeStraight() { return this.getAttribute('include-straight') !== 'false'; }
  get winsNeeded() { return Math.ceil(this.bestof / 2); }
  get currentUserPlayer() {return this.getAttribute('current-user-player') || 'spectator';}
  get isTournamentMatch() {return this.getAttribute("tournament-match") === "true";}

  evaluateHand(faces) {
    const faceOrder = ['7', '8', 'J', 'Q', 'K', 'A'];
    const freq = {};
    for (const f of faces) {
      freq[f] = (freq[f] || 0) + 1;
    }
    const counts = Object.values(freq).sort((a, b) => b - a);
    const pattern = counts.join('-');

    if (pattern === '5') return { rank: 1, name: 'Repóker' };
    if (pattern === '4-1') return { rank: 2, name: 'Póker' };
    if (pattern === '3-2') return { rank: 3, name: 'Full' };
    if (pattern === '3-1-1') return { rank: 5, name: 'Trío' };
    if (pattern === '2-2-1') return { rank: 6, name: 'Doble Pareja' };
    if (pattern === '2-1-1-1') return { rank: 7, name: 'Pareja' };

    if (pattern === '1-1-1-1-1') {
      if (this.includeStraight) {
        const sortedIdx = [...faces].map(f => faceOrder.indexOf(f)).sort((a, b) => a - b);
        const lowStraight = [0, 1, 2, 3, 4];
        const highStraight = [1, 2, 3, 4, 5];
        const isLow = sortedIdx.join('-') === lowStraight.join('-');
        const isHigh = sortedIdx.join('-') === highStraight.join('-');
        if (isLow || isHigh) return { rank: 4, name: 'Escalera' };
      }
      return { rank: 8, name: 'Carta Alta' };
    }

    return { rank: 8, name: 'Carta Alta' };
  }

  tieBreak(faces1, faces2) {
    const faceOrder = ['7', '8', 'J', 'Q', 'K', 'A'];
    const sorted1 = [...faces1].map(f => faceOrder.indexOf(f)).sort((a, b) => b - a);
    const sorted2 = [...faces2].map(f => faceOrder.indexOf(f)).sort((a, b) => b - a);
    for (let i = 0; i < 5; i++) {
      if (sorted1[i] > sorted2[i]) return 'player1';
      if (sorted2[i] > sorted1[i]) return 'player2';
    }
    return null; 
  }


  startRound() {
    this.currentPlayer = 'player1';
    this.rollsLeft = { player1: 3, player2: 3 };
    this.held = {
      player1: [false, false, false, false, false],
      player2: [false, false, false, false, false]
    };
    this.faces = { player1: [], player2: [] };
    this.player1Done = false;
    this.player2Done = false;

    this.shadowRoot.querySelectorAll('dice-poker-die').forEach(die => {
      die.setAttribute('face', '?');
      die.setAttribute('held', 'false');
    });

    const resultDiv = this.shadowRoot.querySelector('.round-result');
    const nextBtn = this.shadowRoot.querySelector('#next-round-btn');
    const rollBtn = this.shadowRoot.querySelector('#roll-btn');
    const endTurnBtn = this.shadowRoot.querySelector('#end-turn-btn');
    if (resultDiv) { resultDiv.style.display = 'none'; resultDiv.innerHTML = ''; }
    if (nextBtn) { nextBtn.style.display = 'none'; nextBtn.textContent = 'Start Next Round'; }
    if (rollBtn) rollBtn.style.display = 'inline-block';
    if (endTurnBtn) endTurnBtn.style.display = 'inline-block';

    const scoreboard = this.shadowRoot.querySelector('.scoreboard');
    if (scoreboard) {
      scoreboard.innerHTML = `Round ${this.round} &nbsp;|&nbsp; ${this.p1Name}: ${this.scores.player1} — ${this.p2Name}: ${this.scores.player2} &nbsp;(best of ${this.bestof})`;
    }

    this.dispatchEvent(new CustomEvent('dp:round-start', {
      bubbles: true,
      composed: true,
      detail: { round: this.round }
    }));

    this.dispatchEvent(new CustomEvent('dp:turn-changed', {
      bubbles: true,
      composed: true,
      detail: { player: 'player1', remainingRolls: this.rollsLeft.player1 }
    }));

    this.updateControls();
    this.doRoll();
  }

  canCurrentUserPlay() {
    return this.currentUserPlayer === this.currentPlayer;
}

  doRoll() {
    const player = this.currentPlayer;
    const dice = this.shadowRoot.querySelectorAll(`.dice-row[data-player="${player}"] dice-poker-die`);
    const newFaces = [];

    dice.forEach((die, i) => {
      if (!this.held[player][i]) {
        const face = die.roll();
        newFaces.push(face);
      } else {
        newFaces.push(this.faces[player][i]);
      }
    });

    this.faces[player] = newFaces;
    this.rollsLeft[player]--;
    this.updateControls();

    this.dispatchEvent(new CustomEvent('dp:roll-executed', {
      bubbles: true,
      composed: true,
      detail: {
        player,
        faces: [...newFaces],
        held: [...this.held[player]],
        remainingRolls: this.rollsLeft[player]
      }
    }));
  }

  endTurn() {
    if (!this.canCurrentUserPlay()) return;

    if (this.currentPlayer === 'player1') {
      this.player1Done = true;
      this.currentPlayer = 'player2';
      this.updateControls();
      this.dispatchEvent(new CustomEvent('dp:turn-changed', {
        bubbles: true,
        composed: true,
        detail: { player: 'player2', remainingRolls: this.rollsLeft.player2 }
      }));
      this.doRoll();
    } else {
      this.player2Done = true;
      this.endRound();
    }
  }

  endRound() {
    const hand1 = this.evaluateHand(this.faces.player1);
    const hand2 = this.evaluateHand(this.faces.player2);

    let winner;
    if (hand1.rank < hand2.rank) {
      winner = 'player1';
    } else if (hand2.rank < hand1.rank) {
      winner = 'player2';
    } else {
      winner = this.tieBreak(this.faces.player1, this.faces.player2);
    }

    if (winner) this.scores[winner]++;

    const breakdown = winner
      ? `${this.getPlayerName(winner)} wins with ${winner === 'player1' ? hand1.name : hand2.name}`
      : 'Draw!';

    this.dispatchEvent(new CustomEvent('dp:round-decided', {
      bubbles: true,
      composed: true,
      detail: {
        winner,
        hands: {
          player1: { faces: this.faces.player1, handType: hand1.name },
          player2: { faces: this.faces.player2, handType: hand2.name }
        },
        breakdown,
        scoreline: { ...this.scores }
      }
    }));

    if (this.scores.player1 >= this.winsNeeded || this.scores.player2 >= this.winsNeeded) {
      const champion = this.scores.player1 >= this.winsNeeded ? 'player1' : 'player2';
      this.matchOver = true;
      this.dispatchEvent(new CustomEvent('dp:match-decided', {
        bubbles: true,
        composed: true,
        detail: {
          champion,
          scoreline: { ...this.scores }
        }
      }));
    }

    this.updateControls();
    this.showRoundResult(breakdown, hand1, hand2, winner);
  }

  showRoundResult(breakdown, hand1, hand2, winner) {
    const resultDiv = this.shadowRoot.querySelector(".round-result");
    if (!resultDiv) return;

    resultDiv.style.display = "block";
    resultDiv.innerHTML = `
      <strong>${breakdown}</strong><br>
      ${this.p1Name}: ${hand1.name} (${this.faces.player1.join(", ")})<br>
      ${this.p2Name}: ${hand2.name} (${this.faces.player2.join(", ")})
    `;

    const nextBtn = this.shadowRoot.querySelector("#next-round-btn");

    if (this.matchOver) {
      const champion =
        this.scores.player1 >= this.winsNeeded ? "player1" : "player2";

      resultDiv.innerHTML += `
        <br><br>
        <strong>🏆 ${this.getPlayerName(champion)} wins the match ${this.scores.player1}-${this.scores.player2}!</strong>
      `;

      if (nextBtn) {
        if (this.isTournamentMatch) {
          nextBtn.style.display = "none";
        } else {
          nextBtn.textContent = "Restart Match";
          nextBtn.style.display = "inline-block";
        }
      }

      return;
    }

    if (nextBtn) {
      nextBtn.textContent = "Start Next Round";
      nextBtn.style.display = "inline-block";
    }

    const rollBtn = this.shadowRoot.querySelector("#roll-btn");
    if (rollBtn) rollBtn.style.display = "none";
  }
  

  updateControls() {
    const rollBtn = this.shadowRoot.querySelector('#roll-btn');
    const endTurnBtn = this.shadowRoot.querySelector('#end-turn-btn');
    const player = this.currentPlayer;

    if (!rollBtn || !endTurnBtn) return;

    const outOfRolls = this.rollsLeft[player] <= 0;
    const isMyTurn = this.currentUserPlayer === player;

    console.log("CONTROL DEBUG", {
      currentUserPlayer: this.currentUserPlayer,
      currentPlayer: this.currentPlayer,
      isMyTurn,
    });


    rollBtn.disabled = outOfRolls || !isMyTurn;
    endTurnBtn.disabled = !isMyTurn;

    rollBtn.textContent = isMyTurn
      ? `Roll (${this.rollsLeft[player]} left)`
      : `Waiting for ${this.getPlayerName(player)}`;

    this.shadowRoot.querySelectorAll("dice-poker-die").forEach((die) => {
      const owner = die.getAttribute("owner");
      const canClickDie = isMyTurn && owner === player;
      die.setAttribute("disabled", String(!canClickDie));
    });

    const dice = this.shadowRoot.querySelectorAll(
      `.dice-row[data-player="${player}"] dice-poker-die`
    );

    dice.forEach((die, i) => {
      this.held[player][i] = die.getAttribute('held') === 'true';
    });

    const p1Section = this.shadowRoot.querySelector('.player-section[data-player="player1"]');
    const p2Section = this.shadowRoot.querySelector('.player-section[data-player="player2"]');

    if (p1Section) p1Section.classList.toggle('active', player === 'player1');
    if (p2Section) p2Section.classList.toggle('active', player === 'player2');
  }

  getPlayerName(player) {
    return player === 'player1' ? this.p1Name : this.p2Name;
  }

  nextRound() {
    if (this.matchOver) {
      this.round = 1;
      this.scores = { player1: 0, player2: 0 };
      this.matchOver = false;
    } else {
      this.round++;
    }
    this.startRound();
  }
  getGameState() {
    return {
      round: this.round,
      scores: { ...this.scores },
      currentPlayer: this.currentPlayer,
      rollsLeft: { ...this.rollsLeft },
      held: {
        player1: [...this.held.player1],
        player2: [...this.held.player2]
      },
      faces: {
        player1: [...this.faces.player1],
        player2: [...this.faces.player2]
      },
      player1Done: this.player1Done,
      player2Done: this.player2Done,
      matchOver: this.matchOver
    };
  }

  canCurrentUserPlay() {
  return this.currentUserPlayer === this.currentPlayer;
  }

  attributeChangedCallback() {
    this.updateControls();
  }

  applyGameState(state) {
    if (!state) return;

    this.round = state.round || 1;
    this.scores = state.scores || { player1: 0, player2: 0 };
    this.currentPlayer = state.currentPlayer || "player1";
    this.rollsLeft = state.rollsLeft || { player1: 3, player2: 3 };

    this.held = state.held || {
      player1: [false, false, false, false, false],
      player2: [false, false, false, false, false],
    };

    this.faces = state.faces || {
      player1: [],
      player2: [],
    };

    this.player1Done = state.player1Done || false;
    this.player2Done = state.player2Done || false;
    this.matchOver = state.matchOver || false;

    this.render();

    ["player1", "player2"].forEach((player) => {
      const dice = this.shadowRoot.querySelectorAll(
        `.dice-row[data-player="${player}"] dice-poker-die`
      );

      dice.forEach((die, index) => {
        die.setAttribute("face", this.faces[player]?.[index] || "?");
        die.setAttribute("held", String(this.held[player]?.[index] || false));
      });
    });

    this.updateControls();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .board {
          background-color: var(--board-bg-color);
          padding: 1.5rem;
          border-radius: 12px;
          color: white;
        }
        .scoreboard {
          text-align: center;
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }
        .players {
          display: flex;
          gap: 2rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        .player-section {
          background: rgba(0,0,0,0.3);
          border-radius: 8px;
          padding: 1rem;
          flex: 1;
          min-width: 250px;
          border: 2px solid transparent;
        }
        .player-section.active {
          border-color: #fbbf24;
        }
        .player-section[data-player="player1"] h3 {
          color: var(--player1-color);
        }
        .player-section[data-player="player2"] h3 {
          color: var(--player2-color);
        }
        .dice-row {
          display: flex;
          gap: 0.5rem;
          margin: 0.75rem 0;
          flex-wrap: wrap;
        }
        .controls {
          text-align: center;
          margin-top: 1.25rem;
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        button {
          padding: 0.5rem 1.25rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: bold;
        }
        #roll-btn {
          background-color: #fbbf24;
          color: #1a1a1a;
        }
        #roll-btn:disabled {
          background-color: #888;
          cursor: not-allowed;
        }
        #end-turn-btn {
          background-color: #555;
          color: white;
        }
        #next-round-btn {
          background-color: #22c55e;
          color: white;
          display: none;
        }
        .round-result {
          display: none;
          background: rgba(0,0,0,0.5);
          border-radius: 8px;
          padding: 1rem;
          margin-top: 1rem;
          text-align: center;
          line-height: 1.8;
        }
        .hint {
          font-size: 0.8rem;
          color: #ccc;
          margin-top: 0.25rem;
        }
      </style>

      <div class="board">
        <div class="scoreboard">
          Round ${this.round} &nbsp;|&nbsp;
          ${this.p1Name}: ${this.scores.player1} — ${this.p2Name}: ${this.scores.player2}
          &nbsp;(best of ${this.bestof})
        </div>

        <div class="players">
          <div class="player-section ${this.currentPlayer === 'player1' ? 'active' : ''}" data-player="player1">
            <h3>${this.p1Name}</h3>
            <div class="dice-row" data-player="player1">
              ${[0,1,2,3,4].map(i => `<dice-poker-die die-id="p1-${i}" owner="player1" face="?" held="false"></dice-poker-die>`).join('')}
            </div>
          </div>

          <div class="player-section ${this.currentPlayer === 'player2' ? 'active' : ''}" data-player="player2">
            <h3>${this.p2Name}</h3>
            <div class="dice-row" data-player="player2">
              ${[0,1,2,3,4].map(i => `<dice-poker-die die-id="p2-${i}" owner="player2" face="?" held="false"></dice-poker-die>`).join('')}
            </div>
          </div>
        </div>

        <div class="controls">
          <button id="roll-btn">Roll</button>
          <button id="end-turn-btn">End Turn</button>
          <button id="next-round-btn">Start Next Round</button>
        </div>

        <div class="round-result"></div>
      </div>
    `;

    this.shadowRoot.querySelector('#roll-btn').addEventListener('click', () => {
      if (!this.canCurrentUserPlay()) return;
      this.doRoll();
    });

    this.shadowRoot.querySelector('#end-turn-btn').addEventListener('click', () => {
        if (!this.canCurrentUserPlay()) return;
        this.endTurn();
      });

    this.shadowRoot.querySelector('#next-round-btn').addEventListener('click', () => this.nextRound());

    //Handles held dices
    this.shadowRoot.addEventListener('dp:die-held-changed', (e) => {
       if (!this.canCurrentUserPlay()) {
        return;
  }
      const { dieId, held, owner } = e.detail;
      const index = parseInt(dieId.split('-')[1]);
      if (this.held[owner]) {
        this.held[owner][index] = held;
      }
      if (owner !== this.currentPlayer || this.player1Done && owner === 'player1') {
        const die = this.shadowRoot.querySelector(`dice-poker-die[die-id="${dieId}"]`);
        if (die) die.setAttribute('held', String(!held));
      }
    });
  }
}

customElements.define('dice-poker-board', DicePokerBoard);
