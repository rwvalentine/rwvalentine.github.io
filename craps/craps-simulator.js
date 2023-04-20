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

let playerBets = [];

class BettingStrategy {
    constructor(name, nextBetFunction) {
        this.name = name;
        this.nextBet = nextBetFunction;
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
      return this.balance * 0.05; // Example: 5% of the player's balance
    },
    color: '#880',
    posX: 100,
  },
  {
    name: "Bobby",
    balance: 100,
    bettingStrategyId: 'pass',
    openingBet: function() {
      return 10;
    },
   color: '#44a',
   posX: 200,
  }
];

function updateBetsOnSvg() {
  console.log('updateBetsOnSvg', playerBets);
  // Get the bets group from the SVG
  const betsGroup = getSvgElementById("bets-group");

  // Clear the current bets from the group
  while (betsGroup.firstChild) {
    betsGroup.removeChild(betsGroup.firstChild);
  }

  // Iterate through the playerBets array
  for (const pb of playerBets) {    // Create a visual representation of the bet (e.g., a circle)
    const betElement = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    betElement.setAttribute("cx", pb.player.posX);
    betElement.setAttribute("cy", 100);
    betElement.setAttribute("r", 10);
    betElement.setAttribute("fill", pb.player.color);

    // Add a title element to show the bet information on hover
    const titleElement = document.createElementNS("http://www.w3.org/2000/svg", "title");
    titleElement.textContent = `${pb.player.name}: ${pb.bet.type} - $${pb.bet.amount}`;
    betElement.appendChild(titleElement);

    // Add the bet element to the bets group
    betsGroup.appendChild(betElement);
  }
}

function findBettingStrategyById(strategyId) {
  console.log('findBettingStrategyById', strategyId);
  return bettingStrategies.find(strategy => strategy.id === strategyId);
}

function setBets() {
  // Generate playerBets array by calling nextBet for each player
  playerBets = players.map((player) => {
    const strategy = findBettingStrategyById(player.bettingStrategyId);
    console.log('xxx', player.name, strategy.id);
    const bets = strategy.nextBet(player);
    return bets.map((bet) => ({ bet, player }));
  }).flat();
  // Call updateBetsOnSvg to display the generated bets on the SVG
  updateBetsOnSvg();
}

function processBets(rollSum) {
  console.log('processBets', playerBets, rollSum, currentPoint, comeOutRoll);
  playerBets.forEach((playerBet) => {
    const bet = playerBet.bet;
    const player = players.find((p) => p.name === playerBet.player.name);
    console.log(player.name, bet.type, bet.amount);

    if (bet.type === bt.PASS) {
      if (!comeOutRoll) {
        if (rollSum === 7) {
          player.balance -= bet.amount;
        } else if (madePoint) {
          player.balance += bet.amount;
        }
      } else {
        if (rollSum === 7 || rollSum === 11) {
          player.balance += bet.amount;
        } else if (rollSum === 2 || rollSum === 3 || rollSum === 12) {
          player.balance -= bet.amount;
        }
      }
    } else if (bet.type === bt.PLACE_4 || bet.type === bt.PLACE_10) {
      // PLACE_4 or PLACE_10 bet logic
      if (rollSum === 7) {
        player.balance -= bet.amount;
      } else if (rollSum === parseInt(bet.type.replace("PLACE_", ""))) {
        player.balance += bet.amount * (bet.type === bt.PLACE_4 ? 9 / 5 : 9 / 5);
      }
    }
  });

  if (!isOn || rollSum === 7 || madePoint) {
    // Remove processed bets
    console.log('clear bets');
    playerBets = [];
    updateBetsOnSvg([]);
  }
}

function updateTable() {
    // Update the SVG table based on the current game state
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
    playersInfoDiv.innerHTML = "";

    players.forEach(player => {
        const playerInfo = document.createElement("p");
        playerInfo.textContent = `${player.name}: ${player.balance}`;
        playersInfoDiv.appendChild(playerInfo);
    });
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
