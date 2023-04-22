import { betTypes } from './bet-types.js';

class Bet {
  constructor(type, amount, playerId) {
    this.type = type;
    this.amount = amount;
    this.history = [];
    this.playerId = playerId;
  }

  // Additional methods for the Bet class can be added here if needed
}

function payoutForWinningBet(bet) {
  const betType = betTypes.find((bt) => bt.name === bet.type);

  if (!betType) {
    console.error(`Unknown bet type: ${bet.type}`);
    return 0;
  }

  const payout = bet.amount * betType.odds;
  return payout;
}

export { Bet, payoutForWinningBet };
