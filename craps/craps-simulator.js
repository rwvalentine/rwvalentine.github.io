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
  // console.log('updateBetsOnSvg', bets);
  // Get the bets group from the SVG
  const betsGroup = getSvgElementById("bets-group");

  // Clear the current bets from the group
  while (betsGroup.firstChild) {
    betsGroup.removeChild(betsGroup.firstChild);
  }

  // Iterate through the bets array
  for (const b of bets) {    // Create a visual representation of the bet (e.g., a circle)
    const betElement = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    const bType = findBetByType(b.type);
    const player = findPlayerById(b.playerId);
    betElement.setAttribute("cx", bType.posX);
    betElement.setAttribute("cy", bType.posY);
    betElement.setAttribute("r", 10);
    betElement.setAttribute("fill", player.color);

    // Add a title element to show the bet information on hover
    const titleElement = document.createElementNS("http://www.w3.org/2000/svg", "title");
    titleElement.textContent = `${player.name}: ${b.type} - $${b.amount}`;
    betElement.appendChild(titleElement);

    // Add the bet element to the bets group
    betsGroup.appendChild(betElement);
  }
}

function setOddsBets() {
  _.forEach(players, p => {
    const strategy = findBettingStrategyById(p.strategyId);
    const oBets = strategy.createOddsBets(p, currentPoint);
    const totalBet = _.sumBy(oBets, 'amount');
    p.balance -= totalBet;
    bets.push(...oBets);
  });
  console.log('bets', bets);
  updateBetsOnSvg();
}

function processRoll(rollSum) {
  console.log('processRoll', bets, rollSum, currentPoint, comeOutRoll);
  gameOver = !isOn || rollSum === 7 || madePoint;
  betsPlaced = !gameOver;
  bets.forEach((bet) => {
    const player = findPlayerById(bet.playerId);
    let outcome = '';
    let win = 0;
    if (bet.type === bt.PASS) {
      if (comeOutRoll) {
        if (rollSum === 7 || rollSum === 11) {
          win = payout(bet);
          outcome = 'win';
        } else if (rollSum === 2 || rollSum === 3 || rollSum === 12) {
          outcome = 'lose';
          win = -bet.amount;
        }
      } else {
        if (rollSum === 7) {
          outcome = 'lose';
          win = -bet.amount;
        } else if (madePoint) {
          outcome = 'win';
          win = payout(bet);
        }
      }
    } else if ((bet.type === bt.ODDS_COME) || (bet.type === bt.ODDS_PASS)) {
      if (comeOutRoll) {
        console.log('no odds for comeout roll!');
      } else {
        if (rollSum === 7) {
          outcome = 'lose';
          win = -bet.amount;
        } else if (madePoint) {
          outcome = 'win';
          win = payout(bet, currentPoint);
        }
      }
    } else { // place
      if (rollSum === 7) {
        outcome = 'lose';
        win = -bet.amount;
      } else if (rollSum === parseInt(bet.type.replace("PLACE_", ""))) {
        win = payout(bet);
        outcome = 'win';
      } else {
        outcome = 'push';
      }
    }
    player.balance += win;
    if (gameOver) {
      player.balance += bet.amount;
    }
    console.log(player.name, bet.type, outcome, win);
  });

  if (gameOver) {
    gameCount++;
    // Remove bets
    console.log('clear bets');
    bets = [];
    updateBetsOnSvg([]);
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

    players.forEach(player => {
      const piDiv = document.createElement('div');
      const s = findBettingStrategyById(player.strategyId);
      let t = `${player.name} - ${s.name}<br>Balance: $${player.balance}`;
      const pb = _.filter(bets, b => b.playerId === player.id);
      _.forEach(pb, b => {
        t += `<br> &nbsp; ${b.type} $${b.amount}`;
      });
      piDiv.innerHTML = t;
      piDiv.style.paddingLeft = '8px';
      piDiv.style.marginBottom = '8px';
      piDiv.style.borderLeft = `5px solid ${player.color}`;
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
  let indicatorY = 40;
  const curBt = bt.betTypes.find(t => t.type === `PLACE_${currentPoint}`);
  if (curBt) {
    indicatorX = curBt.posX;
    indicatorY = curBt.posY - 50;
  }
  const onOffIndicator = getSvgElementById("on-off-indicator");
  const onOffText = getSvgElementById("on-off-text");

  onOffIndicator.setAttribute("cx", indicatorX);
  onOffIndicator.setAttribute("cy", indicatorY);
  onOffText.setAttribute("x", indicatorX);
  onOffText.setAttribute("y", indicatorY+4);
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
  const setBetsButton = document.getElementById('set-bets-button');
  const run10Btn = document.getElementById('run10');
  const run100Btn = document.getElementById('run100');
  const run1000Btn = document.getElementById('run1000');
  rollDiceButton.disabled = !canRoll || rolling;
  run10Btn.disabled = rolling;
  run100Btn.disabled = rolling;
  run1000Btn.disabled = rolling;
  setBetsButton.disabled = betsPlaced;
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
      console.log('set odds bets now', currentPoint);
      setOddsBets();
    }
  } else {
    comeOutRoll = false;
    madePoint = rollSum === currentPoint;
    // If the game is on, only update the isOn status when a 7 or the current point is rolled.
    if (rollSum === 7 || rollSum === currentPoint) {
      isOn = false;
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
}

export function setBets() {
  bets = [];
  _.forEach(players, p => {
    const strategy = findBettingStrategyById(p.strategyId);
    const sBets = strategy.createNewBets(p);
    const totalBet = _.sumBy(sBets, 'amount');
    p.balance -= totalBet;
    bets.push(...sBets);
  });
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
        setBets();
      }
      rolling = false;
      updateButtons();
      console.log(`roll ${roll + 1} done`);
    }}, 100);
}
