// craps-simulator.js
import * as bt from "./bet-types.js";
import { bettingStrategies } from './strategies.js';

let currentPoint = 0;
let comeOutRoll = true;
let madePoint = false;
let die1 = 0;
let die2 = 0;

export let isOn = false;

let betsPlaced = false;
let canRoll = false;

let bets = [];

class BettingStrategy {
    constructor(name, nextBetsFunction) {
        this.name = name;
        this.nextBets = nextBetsFunction;
    }
}

class Player {
    constructor(name, balance, bettingStrategy) {
        this.name = name;
        this.balance = balance;
        this.bettingStrategy = bettingStrategy;
    }
}


const players = [
  {
    name: "Brad",
    balance: 1000,
    bettingStrategyId: '410',
    openingBet: function() {
      return Math.round(this.balance * 0.01 / 10) * 50; // Example: 5% of the player's balance
    },
    color: '#da0',
    posX: 100,
  },
  {
    name: "Bobby",
    balance: 100,
    bettingStrategyId: 'pass',
    openingBet: function() {
      return 10;
    },
   color: '#44d',
   posX: 200,
  }
];

function updateBetsOnSvg() {
  console.log('updateBetsOnSvg', bets);
  // Get the bets group from the SVG
  const betsGroup = getSvgElementById("bets-group");

  // Clear the current bets from the group
  while (betsGroup.firstChild) {
    betsGroup.removeChild(betsGroup.firstChild);
  }

  // Iterate through the bets array
  for (const b of bets) {    // Create a visual representation of the bet (e.g., a circle)
    const betElement = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    betElement.setAttribute("cx", b.bet.posX);
    betElement.setAttribute("cy", b.bet.posY);
    betElement.setAttribute("r", 10);
    betElement.setAttribute("fill", b.player.color);

    // Add a title element to show the bet information on hover
    const titleElement = document.createElementNS("http://www.w3.org/2000/svg", "title");
    titleElement.textContent = `${b.player.name}: ${b.bet.type} - $${b.bet.amount}`;
    betElement.appendChild(titleElement);

    // Add the bet element to the bets group
    betsGroup.appendChild(betElement);
  }
}

function findBettingStrategyById(strategyId) {
  // console.log('findBettingStrategyById', strategyId);
  return bettingStrategies.find(strategy => strategy.id === strategyId);
}

function findBetByType(betType) {
  // console.log('findBetByType', betType);
  return bt.betTypes.find(bt => bt.type === betType);
}

function setBets() {
 bets = [];
 _.forEach(players, p => {
   const strategy = findBettingStrategyById(p.bettingStrategyId);
   const sBets = strategy.nextBets(p);
   _.forEach(sBets, b => {
     const bet = findBetByType(b.type);
     const amount = p.openingBet();
     p.balance = p.balance - amount;
     bets.push({ player: { name: p.name, color: p.color, posX: p.posX }, bet: { amount, ...bet }});
   });
 });
 console.log('bets', bets);

  // Generate playerBets array by calling nextBets for each player
  // playerBets = players.map((player) => {
  //   const strategy = findBettingStrategyById(player.bettingStrategyId);
  //   console.log('xxx', player.name, strategy.id);
  //   const bets = strategy.nextBets(player);
  //   return bets.map((bet) => ({ player, bet: { ...bet, amount: player.openingBet() }}));
  // }).flat();
  // console.log('setBets', playerBets);
  // Call updateBetsOnSvg to display the generated bets on the SVG
  updateBetsOnSvg();
}

function processBets(rollSum) {
  console.log('processBets', bets, rollSum, currentPoint, comeOutRoll);
  const gameOver = !isOn || rollSum === 7 || madePoint;
  bets.forEach((b) => {
    const bet = b.bet;
    const player = players.find((p) => p.name === b.player.name);
    let outcome = '';
    let win = 0;
    if (bet.type === bt.PASS) {
      if (comeOutRoll) {
        if (rollSum === 7 || rollSum === 11) {
          win = bet.amount;
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
          win = bet.amount;
        }
      }
    } else if (bet.type === bt.PLACE_4 || bet.type === bt.PLACE_10) {
      // PLACE_4 or PLACE_10 bet logic
      if (rollSum === 7) {
        outcome = 'lose';
        win = -bet.amount;
      } else if (rollSum === parseInt(bet.type.replace("PLACE_", ""))) {
        win = bet.amount * (bet.type === bt.PLACE_4 ? 9 / 5 : 9 / 5);
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
      let t = `${player.name}: ${player.balance}`;
      const pb = _.filter(bets, b => b.player.name === player.name);
      _.forEach(pb, b => {
        t += `<br>${b.bet.type} ${b.bet.amount}`;
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

function updateCurrentPointText(newPoint) {
  currentPoint = newPoint;
  console.log('updateCurrentPoint', currentPoint);
  const currentPointText = getSvgElementById("current-point-text");
  const onOffIndicator = getSvgElementById("on-off-indicator");
  const onOffText = getSvgElementById("on-off-text");
  const setBetsButton = document.getElementById("set-bets-button");

  if (currentPoint === 0) {
    currentPointText.textContent = "";
    onOffIndicator.setAttribute("fill", "red");
    onOffText.textContent = "OFF";
    onOffIndicator.setAttribute("display", "");
    onOffText.setAttribute("display", "");

    // Disable the "Set Bets" button if the game is in the "OFF" state
    setBetsButton.disabled = true;
  } else {
    currentPointText.textContent = `POINT: ${currentPoint}`;
    onOffIndicator.setAttribute("fill", "green");
    onOffText.textContent = "ON";
    onOffIndicator.setAttribute("display", "");
    onOffText.setAttribute("display", "");

    // Enable the "Set Bets" button if the game is in the "ON" state
    setBetsButton.disabled = false;
  }
}

function updateOnOffIndicator() {
    const onOffIndicator = getSvgElementById("on-off-indicator");
    const onOffText = getSvgElementById("on-off-text");

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
    }
  } else {
    comeOutRoll = false;
    madePoint = rollSum === currentPoint;
    // If the game is on, only update the isOn status when a 7 or the current point is rolled.
    if (rollSum === 7 || rollSum === currentPoint) {
      isOn = false;
    }
  }

  updateCurrentPointText(currentPoint);
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
