import { betTypes, oddsLookup } from './bet-types.js';

class Bet {
  constructor(type, amount, playerId) {
    this.type = type;
    this.amount = amount;
    this.history = [];
    this.playerId = playerId;
  }

  // Additional methods for the Bet class can be added here if needed
}

function payout(bet, point = 0) {
  const betType = betTypes.find((bt) => bt.type === bet.type);

  if (!betType) {
    console.error(`Unknown bet type: ${bet.type}`);
    return 0;
  }

  let p;

  if (point > 0) { // odds bet
    const odds = oddsLookup[point];
    p = bet.amount * odds;
  } else {
    p = bet.amount * betType.odds;
  }

  return p;
}

export { Bet, payout };
