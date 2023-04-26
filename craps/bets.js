import { betTypes, oddsLookup, pointPosX } from './bet-types.js';
import { players } from './players.js';

class Bet {
  constructor(type, amount, playerId, point = 0) {
    const betType = betTypes.find((bt) => bt.type === type);
    const player = players.find((p) => p.id === playerId);
    this.type = type;
    this.amount = amount;
    this.playerId = playerId;
    this.point = point || betType.point;
    if (!(betType.posX > 0)) {
      this.posX = 400;
      if (this.point > 0) {
        this.posX = pointPosX[this.point] + player.posX;
      }
    } else {
      this.posX = betType.posX + player.posX;
    }
    this.posY = betType.posY
    this.color = player.color;
    this.history = [];
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
