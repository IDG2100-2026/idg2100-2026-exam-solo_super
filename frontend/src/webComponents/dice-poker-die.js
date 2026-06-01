class DicePokerDie extends HTMLElement {
  static get observedAttributes() {
    return ['face', 'held', 'owner', 'die-id', 'disabled'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.shadowRoot.addEventListener('click', () => {
      if (this.getAttribute('disabled') === 'true') return;
      const isHeld = this.getAttribute('held') === 'true';
      this.setAttribute('held', String(!isHeld));
      this.dispatchEvent(new CustomEvent('dp:die-held-changed', {
        bubbles: true,
        composed: true,
        detail: {
          dieId: this.getAttribute('die-id'),
          held: !isHeld,
          owner: this.getAttribute('owner')
        }
      }));
    });
  }

  attributeChangedCallback() {
    this.render();
  }

  roll() {
    const faces = ['A', 'K', 'Q', 'J', '8', '7'];
    const newFace = faces[Math.floor(Math.random() * faces.length)];
    this.setAttribute('face', newFace);
    this.dispatchEvent(new CustomEvent('dp:die-rolled', {
      bubbles: true,
      composed: true,
      detail: {
        dieId: this.getAttribute('die-id'),
        face: newFace,
        owner: this.getAttribute('owner')
      }
    }));
    return newFace;
  }

  render() {
    const face = this.getAttribute('face') || '?';
    const held = this.getAttribute('held') === 'true';
    const isRed = ['A', 'K', '8'].includes(face);

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          cursor: pointer;
        }
        .die {
          width: 60px;
          height: 60px;
          background-color: var(--die-bg-color, #f5f5f5);
          border: 2px solid #aaa;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
          font-weight: bold;
          user-select: none;
          transition: background-color 0.15s;
        }
        .die.held {
          background-color: var(--die-held-color, #fbbf24);
          border-color: #d97706;
        }
        .red {
          color: var(--die-face-color-red, #cc0000);
        }
        .black {
          color: var(--die-face-color-black, #000000);
        }
      </style>
      <div class="die ${held ? 'held' : ''}">
        <span class="${isRed ? 'red' : 'black'}">${face}</span>
      </div>
    `;
  }
}

customElements.define('dice-poker-die', DicePokerDie);
