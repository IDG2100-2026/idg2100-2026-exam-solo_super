class DicePokerMonitor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.state = {
      round: '-',
      activePlayer: '-',
      remainingRolls: '-',
      lastResult: '',
      roundWinner: '',
      scores: { player1: 0, player2: 0 },
      matchWinner: ''
    };
  }

  connectedCallback() {
    this.render();
    this.subscribeToBoard();
  }

  //Managing eventlisteners
  subscribeToBoard() {
    document.addEventListener('dp:round-start', (e) => {
      this.state.round = e.detail.round;
      this.state.roundWinner = '';
      this.state.lastResult = '';
      this.state.matchWinner = '';
      this.render();
    });

    document.addEventListener('dp:turn-changed', (e) => {
      this.state.activePlayer = e.detail.player;
      this.state.remainingRolls = e.detail.remainingRolls;
      this.render();
    });

    document.addEventListener('dp:roll-executed', (e) => {
      this.state.activePlayer = e.detail.player;
      this.state.remainingRolls = e.detail.remainingRolls || this.state.remainingRolls;
      this.state.lastResult = `Rolled: ${e.detail.faces.join(', ')}`;
      this.render();
    });

    document.addEventListener('dp:round-decided', (e) => {
      this.state.roundWinner = e.detail.breakdown;
      this.state.scores = e.detail.scoreline || this.state.scores;
      this.render();
    });

    document.addEventListener('dp:match-decided', (e) => {
      const { champion, scoreline } = e.detail;
      this.state.scores = scoreline;
      this.state.matchWinner = `${champion === 'player1' ? 'Player 1' : 'Player 2'} wins the match ${scoreline.player1}-${scoreline.player2}!`;
      this.render();
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .monitor {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          align-items: center;
          font-size: 0.95rem;
          padding: 0.5rem 0;
        }
        .item {
          background: #f0f0f0;
          border-radius: 6px;
          padding: 0.3rem 0.75rem;
          color: #333;
        }
        .item span {
          font-weight: bold;
          color: #111;
        }
        .winner {
          background: #d1fae5;
          color: #065f46;
          font-weight: bold;
        }
        .match-winner {
          background: #fef3c7;
          color: #92400e;
          font-weight: bold;
        }
      </style>
      <div class="monitor">
        <div class="item">Round: <span>${this.state.round}</span></div>
        <div class="item">Turn: <span>${this.state.activePlayer || '-'}</span></div>
        <div class="item">Rolls left: <span>${this.state.remainingRolls}</span></div>
        ${this.state.lastResult ? `<div class="item">${this.state.lastResult}</div>` : ''}
        ${this.state.roundWinner ? `<div class="item winner">${this.state.roundWinner}</div>` : ''}
        ${this.state.matchWinner ? `<div class="item match-winner">${this.state.matchWinner}</div>` : ''}
      </div>
    `;
  }
}

customElements.define('dice-poker-monitor', DicePokerMonitor);
