// craps-simulator.js
import * as bt from "./bet-types.js";
import { players } from './players.js';
import { Bet, payout } from './bets.js';
import { strategies } from './strategies.js';

let currentPoint = 0;
let comeOutRoll = true;
let madePoint = false;
let die1 = 0;
let die2 = 0;

export let isOn = false;

let betsPlaced = false;
let onBetsPlaced = false;
let canRoll = false;
let gameOver = true;
let gameCount = 0;
let rollCount = 0;
let rolling = false;

let bets = [];


function findBettingStrategyById(strategyId) {
  // console.log('findBettingStrategyById', strategyId);
  return strategies.find(strategy => strategy.id === strategyId);
}

function findBetByType(betType) {
  // console.log('findBetByType', betType);
  return bt.betTypes.find(bt => bt.type === betType);
}

function findPlayerById(playerId) {
  // console.log('findPlayerByType', playerId);
  return players.find(p => p.id === playerId);
}

function updateBetsOnSvg() {
  const betsGroup = getSvgElementById("bets-group");
  // Clear the current bets from the group
  while (betsGroup.firstChild) {
    betsGroup.removeChild(betsGroup.firstChild);
  }
  // Iterate through the bets array
  for (const b of bets) {    // Create a visual representation of the bet (e.g., a circle)
    const betElement = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    betElement.setAttribute("cx", b.posX);
    betElement.setAttribute("cy", b.posY);
    betElement.setAttribute("r", 15);
    betElement.setAttribute("fill", b.color);
    // Add a title element to show the bet information on hover
    const titleElement = document.createElementNS("http://www.w3.org/2000/svg", "title");
    titleElement.textContent = `${b.type} - $${b.amount}`;
    betElement.appendChild(titleElement);
    // Add the bet element to the bets group
    betsGroup.appendChild(betElement);
  }
}

function processRoll(rollSum) {
  console.log('processRoll', bets, rollSum, currentPoint, comeOutRoll);
  gameOver = !isOn || rollSum === 7 || madePoint;
  betsPlaced = !gameOver;
  const checkFirstRoll = (rs, b) => {
    let w = 0;
    if (rs === 7 || rs === 11) {
      w = payout(b);
    } else if (rs === 2 || rs === 3 || rs === 12) {
      w = -b.amount;
    }
    return w;
  }
  const sevenOut = !comeOutRoll && (rollSum === 7);
  bets.forEach((bet) => {
    const player = findPlayerById(bet.playerId);
    let win = 0;
    if (bet.type === bt.PASS) {
      if (comeOutRoll) {
        win = checkFirstRoll(rollSum, bet);
      } else {
        if (sevenOut) {
          win = -bet.amount;
        } else if (madePoint) {
          win = payout(bet);
        }
      }
    } else if (bet.type === bt.COME) {
      if (comeOutRoll) {
        console.log('cannot place COME bet on comeout roll');
      } else {
        if (!(bet.point > 0)) {
          win = checkFirstRoll(rollSum, bet);
          if (win === 0) {
            bet.point = rollSum;
            bet.posX = bt.pointPosX[rollSum] + player.posX;
            bet.posY = 230;
          }
        } else if (sevenOut) {
          win = -bet.amount;
        } else if (rollSum === bet.point) {
          win = payout(bet);
        }
      }
    } else if ((bet.type === bt.ODDS_COME) || (bet.type === bt.ODDS_PASS)) {
      if (comeOutRoll) {
        console.log('no odds for comeout roll!');
      } else {
        if (sevenOut) {
          win = -bet.amount;
        } else if (madePoint) {
          win = payout(bet, bet.point);
        }
      }
    } else { // place
      if (rollSum === 7) {
        win = -bet.amount;
      } else if (rollSum === bet.point) {
        win = payout(bet);
      }
    }
    bet.payout = win;
    let outcome = 'push';
    if (win > 0) {
      player.balance += win;
      outcome = 'win';
      player.session.won += win;
    }
    if (win < 0) {
      outcome = 'lose';
      player.session.lost += -win;
    }
    bet.outcome = outcome;

    // if (gameOver) {
    //   player.balance += bet.amount;
    // }
    if (sevenOut) {
      onBetsPlaced = false;
    }
    console.log(player.name, bet.type, outcome, win);
  });

  // remove losers
  bets = _.filter(bets, b => b.outcome !== 'lose');
  if (gameOver) { // remove pass bets
    gameCount++;
    // remove remaining pass and pass odds
    bets = _.filter(bets, b => {
      const isPass = [bt.PASS, bt.ODDS_PASS].includes(b.type);
      if (isPass) { // return bet amount to player
        const p = findPlayerById(b.playerId);
        p.balance += b.amount;
      }
      return !isPass;
    });
  }
}

function getSvgElementById(id) {
  const svgObject = document.getElementById("craps-table-svg");
  const svgDoc = svgObject.contentDocument;

  if (svgDoc) {
    return svgDoc.getElementById(id);
  } else {
    console.error(`SVG element with ID "${id}" not found.`);
    return null;
  }
}

function updatePlayerInfo() {
    const playersInfoDiv = document.getElementById("players-info");
    playersInfoDiv.innerHTML = '';

    players.forEach(p => {
      const piDiv = document.createElement('div');
      const s = findBettingStrategyById(p.strategyId);
      let t = `
        ${p.name} - ${s.name}<br>Balance: $${p.balance}<br>
        w:l - ${p.session.won}:${p.session.lost} = ${Math.round(10000 * p.session.won / (p.session.won + p.session.lost)) / 100 }%<br>
        net: $${p.session.won - p.session.lost}
      `;
      const pb = _.filter(bets, b => b.playerId === p.id);
      _.forEach(pb, b => {
        t += `<br> &nbsp; ${b.type} $${b.amount}`;
      });
      piDiv.innerHTML = t;
      piDiv.style.paddingLeft = '8px';
      piDiv.style.marginBottom = '8px';
      piDiv.style.borderLeft = `5px solid ${p.color}`;
      playersInfoDiv.appendChild(piDiv);
    });
}


function updateSessionInfo() {
    const sessionInfoDiv = document.getElementById("session-info");
    sessionInfoDiv.innerHTML = `
    Games: ${gameCount}<br>
    Rolls: ${rollCount}<br>`;
}

function updateGameStatus() {
    const statusDiv = document.getElementById('game-status');
    statusDiv.innerHTML = `
    currentPoint = ${currentPoint}<br>
    comeOutRoll = ${comeOutRoll}<br>
    madePoint = ${madePoint}<br>
    isOn = ${isOn}<br>
    betsPlaced = ${betsPlaced}<br>
    onBetsPlaced = ${onBetsPlaced}<br>
    canRoll = ${canRoll}<br>
    gameOver = ${gameOver}<br>
    `;
}

function displayCurrentRoll(diceResult) {
    const currentRollDiv = document.getElementById("current-roll");
    currentRollDiv.textContent = `Current Roll: ${diceResult.die1} + ${diceResult.die2} = ${diceResult.die1 + diceResult.die2}`;
}


function updateOnOffIndicator() {
  let indicatorX = 800;
  let indicatorY = 50;
  if (currentPoint > 0) {
    indicatorX = bt.pointPosX[currentPoint];
    indicatorY = 80;
  }
  const onOffIndicator = getSvgElementById("on-off-indicator");
  const onOffText = getSvgElementById("on-off-text");
  onOffIndicator.setAttribute("cx", indicatorX);
  onOffIndicator.setAttribute("cy", indicatorY);
  onOffText.setAttribute("x", indicatorX);
  onOffText.setAttribute("y", indicatorY+8);
  if (isOn) {
    onOffIndicator.setAttribute("fill", "green");
      onOffText.textContent = "ON";
  } else {
      onOffIndicator.setAttribute("fill", "red");
      onOffText.textContent = "OFF";
  }
  onOffIndicator.setAttribute("display", "inline");
  onOffText.setAttribute("display", "inline");
}

function updateButtons() {
  const rollDiceButton = document.getElementById('roll-dice-button');
  const placeBetsButton = document.getElementById('set-bets-button');
  const run10Btn = document.getElementById('run10');
  const run100Btn = document.getElementById('run100');
  const run1000Btn = document.getElementById('run1000');
  rollDiceButton.disabled = !canRoll || rolling;
  run10Btn.disabled = rolling;
  run100Btn.disabled = rolling;
  run1000Btn.disabled = rolling;
  placeBetsButton.disabled = betsPlaced;
}

function setCurrentPoint(rollSum) {
  if (!isOn) {
    comeOutRoll = true;
    madePoint = false;
    if (rollSum === 7 || rollSum === 11 || rollSum === 2 || rollSum === 3 || rollSum === 12) {
      currentPoint = 0;
    } else {
      isOn = true;
      currentPoint = rollSum;
    }
  } else {
    comeOutRoll = false;
    madePoint = rollSum === currentPoint;
    // If the game is on, only update the isOn status when a 7 or the current point is rolled.
    if (rollSum === 7 || rollSum === currentPoint) {
      isOn = false;
      currentPoint = 0;
    }
  }

  updateOnOffIndicator();
}

function rollDice() {
  canRoll = false;
  die1 = Math.floor(Math.random() * 6) + 1;
  die2 = Math.floor(Math.random() * 6) + 1;
  rollCount++;
  const die1Text = getSvgElementById('die1-text');
  die1Text.textContent = die1;
  const die2Text = getSvgElementById('die2-text');
  die2Text.textContent = die2;
}

function updateTable() {
  updateButtons();
  updatePlayerInfo();
  updateSessionInfo();
  updateGameStatus();
  updateBetsOnSvg();
}

function setOddsBets() {
  _.forEach(players, p => {
    const strategy = findBettingStrategyById(p.strategyId);
    const oBets = strategy.createOddsBets(p, currentPoint);
    const totalBet = _.sumBy(oBets, 'amount');
    p.balance -= totalBet;
    bets.push(...oBets);
  });
}

function setOnBets() {
  _.forEach(players, p => {
    const strategy = findBettingStrategyById(p.strategyId);
    const sBets = strategy.createOnBets(p);
    const totalBet = _.sumBy(sBets, 'amount');
    p.balance -= totalBet;
    bets.push(...sBets);
  });
}

export function makeBets() {
  if (!isOn) {
    // bets = [];
    _.forEach(players, p => {
      const strategy = findBettingStrategyById(p.strategyId);
      const sBets = strategy.createNewBets(p);
      const totalBet = _.sumBy(sBets, 'amount');
      p.balance -= totalBet;
      bets.push(...sBets);
    });
  }
  betsPlaced = true;
  canRoll = true;
  console.log('bets', bets);
  updateBetsOnSvg();
  updateTable();
}

export function doRoll() {
  rollDice();
  const rollSum = die1 + die2;
  // Update the table based on the roll results
  setCurrentPoint(rollSum);
  processRoll(rollSum);
  if ((comeOutRoll) && (currentPoint > 0)) {
    console.log('set odds bets now', currentPoint);
    setOddsBets();
  }
  if ((comeOutRoll) && (currentPoint > 0) && !onBetsPlaced) {
    console.log('set on bets now', currentPoint);
    setOnBets();
    onBetsPlaced = true;
  }
  canRoll = isOn || betsPlaced;
  updateTable();
}

export function run(n) {
  let roll = 0;
  rolling = true;
  updateButtons();
  setTimeout( () => {
    while (roll < n) {
      if (betsPlaced) {
        doRoll();
        roll++;
      } else {
        makeBets();
      }
      rolling = false;
      updateButtons();
      console.log(`roll ${roll + 1} done`);
    }}, 100);
}
