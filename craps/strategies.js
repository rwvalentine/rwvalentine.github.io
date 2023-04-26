import * as bt from "./bet-types.js";
import { Bet } from './bets.js';
import {oddsMultiples } from './house.js';

class Strategy {
  constructor(options) {
    this.id = options.id;
    this.name = options.name;
    this.passLine = options.passLine;
    this.oddsPass = options.oddsPass;
    this.comeBets = options.comeBets;
    this.oddsCome = options.oddsCome;
    this.maxOddsMultiple = options.maxOddsMultiple;
    this.placeBets = {
      [bt.PLACE_4]: options.placeBets[bt.PLACE_4],
      [bt.PLACE_5]: options.placeBets[bt.PLACE_5],
      [bt.PLACE_6]: options.placeBets[bt.PLACE_6],
      [bt.PLACE_8]: options.placeBets[bt.PLACE_8],
      [bt.PLACE_9]: options.placeBets[bt.PLACE_9],
      [bt.PLACE_10]: options.placeBets[bt.PLACE_10],
    };
    this.minBet = options.minBet;
    this.maxBet = options.maxBet;
    this.flatBetAmount = options.flatBetAmount;
    this.percentBetAmount = options.percentBetAmount;
    this.maxActiveBets = options.maxActiveBets || 4;
    this.pressingOptions = options.pressingOptions;
    this.initPassBet = 0;
    this.initComeBet = 0;
  }

  openingBet(playerBalance, pressedAmount = 0) {
    // Calculate the base bet amount considering the player's balance
    const baseBet = playerBalance * this.percentBetAmount + this.flatBetAmount;
    // Make sure the bet amount is a multiple of common bet payouts
    const commonDivisor = 10;
    let betAmount = Math.round(baseBet / commonDivisor) * commonDivisor;
    // Enforce the min and max bet constraints
    betAmount = Math.max(this.minBet * 1.0, betAmount);
    betAmount = Math.min(this.maxBet * 1.0, betAmount);
    return betAmount;
  }

  createPassBet(player) {
    let bet;
    // Create bets according to the player's strategy
    if (this.passLine) {
      const betAmount = this.openingBet(player.balance);
      bet = new Bet(bt.PASS, betAmount, player.id);
      this.initPassBet = betAmount;
    }
    return bet;
  }

  createOnBets(player) {
    const bets = [];
    for (const betType of Object.keys(this.placeBets)) {
      if (this.placeBets[betType]) {
        const betAmount = this.openingBet(player.balance);
        const bet = new Bet(betType, betAmount, player.id);
        bets.push(bet);
      }
    }
    if (this.comeBets) {
      const betAmount = this.openingBet(player.balance);
      const bet = new Bet(bt.COME, betAmount, player.id);
      this.initComeBet = betAmount;
      bets.push(bet);
    }
    return bets;
  }

  createPassOddsBet(player, currentPoint) {
    console.log('createPassOddsBet curpnt', currentPoint);
    let bet;
    if (this.oddsPass) {
      let betAmount = this.initPassBet;
      if (this.maxOddsMultiple) {
        betAmount = betAmount * oddsMultiples[currentPoint];
      }
      bet = new Bet(bt.ODDS_PASS, betAmount, player.id, currentPoint);
    }
    return bet;
  }

  createComeOddsBet(player, throwSum) {
    console.log('createComeOddsBet throwSum', throwSum);
    let bet;
    if (this.oddsCome) {
      let betAmount = this.initComeBet;
      if (this.maxOddsMultiple) {
        betAmount = betAmount * oddsMultiples[throwSum];
      }
      bet = new Bet(bt.ODDS_COME, betAmount, player.id, throwSum);
    }
    return bet;
  }
}

let strategies = [];

// Convert plain objects to Strategy class instances
function objectsToStrategyInstances(objects) {
  return objects.map(object => new Strategy(object));
}

function loadStrategies() {
  const loadedStrategies = JSON.parse(localStorage.getItem('strategies'));
  if (loadedStrategies) {
    console.log('loading strategies...');
    strategies.length = 0;
    const strategyInstances = objectsToStrategyInstances(loadedStrategies);
    strategies.push(...strategyInstances);
  } else { // use these
    strategies = [
      new Strategy({
        id: 1,
        name: 'Pass Max Odds',
        passLine: true,
        oddsPass: true,
        comeBets: false,
        maxOddsMultiple: true,
        placeBets: {
          [bt.PLACE_4]: false,
          [bt.PLACE_5]: false,
          [bt.PLACE_6]: false,
          [bt.PLACE_8]: false,
          [bt.PLACE_9]: false,
          [bt.PLACE_10]: false,
        },
        minBet: 5,
        maxBet: 20,
        flatBetAmount: 10,
        percentBetAmount: 0.00,
        pressingOptions: {},
      }),
      new Strategy({
        id: 2,
        name: '4-10',
        passLine: false,
        comeBets: false,
        placeBets: {
          [bt.PLACE_4]: true,
          [bt.PLACE_5]: false,
          [bt.PLACE_6]: false,
          [bt.PLACE_8]: false,
          [bt.PLACE_9]: false,
          [bt.PLACE_10]: true,
        },
        minBet: 25,
        maxBet: 200,
        flatBetAmount: 0,
        percentBetAmount: 0.05,
        pressingOptions: {},
      }),
    ];
  }
}

loadStrategies();

export { strategies, Strategy };
