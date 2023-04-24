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

function setBets() {
  bets = [];
  _.forEach(players, p => {
    const strategy = findBettingStrategyById(p.strategyId);
    const sBets = strategy.createNewBets(p);
    const totalBet = _.sumBy(sBets, 'amount');
    p.balance -= totalBet;
    bets.push(...sBets);
  });
  console.log('bets', bets);
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
  console.log('bets', bets);
  updateBetsOnSvg();
}

function processBets(rollSum) {
  console.log('processBets', bets, rollSum, currentPoint, comeOutRoll);
  const gameOver = !isOn || rollSum === 7 || madePoint;
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
      const playerInfo = document.createElement("p");
      let t = `${player.name}: $${player.balance}`;
      const s = findBettingStrategyById(player.strategyId);
      t += `<br>Strategy: ${s.name}`;
      const pb = _.filter(bets, b => b.playerId === player.id);
      _.forEach(pb, b => {
        t += `<br>${b.type} ${b.amount}`;
      });
      playerInfo.innerHTML = t
      playersInfoDiv.appendChild(playerInfo);
    });
}


function updateTable() {
    // Update the SVG table based on the current game state
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
  // console.log('updateButtons isOn betsPlaced', isOn, betsPlaced);
  const rollDiceButton = document.getElementById('roll-dice-button');
  const setBetsButton = document.getElementById('set-bets-button');
  rollDiceButton.disabled = !canRoll;
  setBetsButton.disabled = isOn || betsPlaced;
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

  // updateCurrentPointText(currentPoint);
  // Update the on/off indicator after setting isOn
  updateOnOffIndicator();
}

document.getElementById("set-bets-button").addEventListener("click", () => {
  setBets();
  betsPlaced = true;
  canRoll = true;
  updateButtons();
  updatePlayerInfo();
});


function rollDice() {
  canRoll = false;
  die1 = Math.floor(Math.random() * 6) + 1;
  die2 = Math.floor(Math.random() * 6) + 1;
  const die1Text = getSvgElementById('die1-text');
  die1Text.textContent = die1;
  const die2Text = getSvgElementById('die2-text');
  die2Text.textContent = die2;
}

document.getElementById("roll-dice-button").addEventListener("click", () => {
  rollDice();
  const rollSum = die1 + die2;

  // Update the table based on the roll results
  setCurrentPoint(rollSum);
  processBets(rollSum);

  betsPlaced = false; // Reset the betsPlaced flag

  // Call setBets() after processing the roll results, if needed
  canRoll = isOn || betsPlaced;
  updateButtons();
  updatePlayerInfo();
  updateGameStatus();
});
