class Player {
  constructor(options) {
    this.id = options.id;
    this.name = options.name;
    this.balance = options.balance;
    this.strategyId = options.strategyId;
    this.color = options.color;
    this.posX = options.posX;
    this.session = {
      throws: options.session.throws,
      rolls: options.session.rolls,
      won: options.session.won,
      lost: options.session.lost,
    };
  }

  activeBetCount(bets) {
    let count = 0;
    bets.forEach(b => {
      if (b.playerId === this.id) {
        count++;
      }
    });
    return count;
  }
}

const players = [
  new Player({
    id: 1,
    name: 'Player 1',
    balance: 1000,
    strategyId: 2,
    color: '#da0',
    posX: 25,
    session: { throws: 0, rolls: 0, won: 0, lost: 0 },
  }),
  new Player({
    id: 2,
    name: 'Player 2',
    balance: 100,
    strategyId: 1,
    color: '#44d',
    posX: -25,
    session: { throws: 0, rolls: 0, won: 0, lost: 0 },
  }),
];

export { Player, players };
