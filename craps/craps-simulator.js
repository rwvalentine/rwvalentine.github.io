// craps-simulator.js
import * as bt from "./bet-types.js";
import { players } from './players.js';
import { Bet, payout } from './bets.js';
import { strategies } from './strategies.js';

let currentPoint = 0;
let comeOutThrow = true;
let madePoint = false;
let die1 = 0;
let die2 = 0;

export let isOn = false;
let stop = false;

let passBetsPlaced = false;
let onBetsPlaced = false;
let rollOver = true;
let throwCount = 0
let rollCount = 0;
let throwing = false;

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
    const noiseX = 5 - 10 * Math.random();
    const noiseY = 5 - 10 * Math.random();
    const betElement = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    const x = b.posX + noiseX;
    const y = b.posY + noiseY;
    betElement.setAttribute("cx", x);
    betElement.setAttribute("cy", y);
    betElement.setAttribute("r", 15);
    betElement.setAttribute("fill", b.color);
    betElement.setAttribute('stroke', 'white');
    betElement.setAttribute('stroke-width', '2');
    betsGroup.appendChild(betElement);
    // Create the text inside the bet circle
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x);
    text.setAttribute("y", y);
    text.setAttribute("font-size", "14");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", "white");
    text.textContent = b.amount;
    betsGroup.appendChild(text);
    // Add a title element to show the bet information on hover
    const titleElement = document.createElementNS("http://www.w3.org/2000/svg", "title");
    titleElement.textContent = `${b.type} - $${b.amount}`;
    betElement.appendChild(titleElement);
    // Add the bet element to the bets group
  }
}

function processThrow(throwSum) {
  console.log('processThrow', bets, throwSum, currentPoint, comeOutThrow);
  rollOver = !isOn || throwSum === 7 || madePoint;
  passBetsPlaced = !rollOver;
  const checkFirstThrow = (rs, b) => {
    let w = 0;
    if (rs === 7 || rs === 11) {
      w = payout(b);
    } else if (rs === 2 || rs === 3 || rs === 12) {
      w = -b.amount;
    }
    return w;
  }
  const sevenOut = !comeOutThrow && (throwSum === 7);
  bets.forEach((bet) => {
    const player = findPlayerById(bet.playerId);
    let win = 0;
    if (bet.type === bt.PASS) {
      if (comeOutThrow) {
        win = checkFirstThrow(throwSum, bet);
      } else {
        if (sevenOut) {
          win = -bet.amount;
        } else if (madePoint) {
          win = payout(bet);
        }
      }
    } else if (bet.type === bt.COME) {
      if (!(bet.point > 0)) {
        win = checkFirstThrow(throwSum, bet);
        if (win === 0) {
          bet.point = throwSum;
          bet.posX = bt.pointPosX[throwSum] + player.posX;
          bet.posY = 230;
          console.log('xxxx set come odds bets here?');
          makeComeOddsBet(player, throwSum);
        }
      } else if (sevenOut) {
        win = -bet.amount;
      } else if (throwSum === bet.point) {
        win = payout(bet);
      }
    } else if (bet.type === bt.ODDS_PASS) {
      if (comeOutThrow) {
        console.log('no pass odds for comeout throw!');
      } else {
        if (sevenOut) {
          win = -bet.amount;
        } else if (madePoint) {
          win = payout(bet, bet.point);
        }
      }
    } else if (bet.type === bt.ODDS_COME) {
      if (comeOutThrow) {
        console.log('no come odds for comeout throw!');
      } else {
        if (sevenOut) {
          win = -bet.amount;
        } else if (throwSum === bet.point) {
          win = payout(bet, bet.point);
        }
      }
    } else { // place
      if (throwSum === 7) {
        win = -bet.amount;
      } else if (throwSum === bet.point) {
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

    // if (rollOver) {
    //   player.balance += bet.amount;
    // }
    if (win !== 0) {
      addRollHistory(`${player.name} ${bet.type} ${outcome} ${win}`);
    }
  });
  if (sevenOut) {
    onBetsPlaced = false;
  }

  // remove losers
  bets = _.filter(bets, b => b.outcome !== 'lose');
  if (rollOver) { // remove pass bets
    rollCount++;
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
    Rolls: ${rollCount}<br>
    Throws: ${throwCount}<br>`;
}

function updateRollStatus() {
    const statusDiv = document.getElementById('div-status');
    statusDiv.innerHTML = `
    currentPoint = ${currentPoint}<br>
    comeOutThrow = ${comeOutThrow}<br>
    madePoint = ${madePoint}<br>
    isOn = ${isOn}<br>
    passBetsPlaced = ${passBetsPlaced}<br>
    onBetsPlaced = ${onBetsPlaced}<br>
    rollOver = ${rollOver}<br>
    `;
}

function addRollHistory(txt) {
    const divH = document.getElementById("div-roll-history");
    divH.innerHTML += `${txt}<br>`;
}

function clearRollHistory() {
    const divH = document.getElementById("div-roll-history");
    divH.innerHTML = `New Roll ${rollCount + 1}<br>`;
}

function updateOnOffIndicator() {
  let indicatorX = 750;
  let indicatorY = 32;
  if (currentPoint > 0) {
    indicatorX = bt.pointPosX[currentPoint];
    indicatorY = 70;
  }
  const onOffIndicator = getSvgElementById("on-off-indicator");
  const onOffText = getSvgElementById("on-off-text");
  onOffIndicator.setAttribute("cx", indicatorX);
  onOffIndicator.setAttribute("cy", indicatorY);
  onOffText.setAttribute("x", indicatorX);
  onOffText.setAttribute("y", indicatorY+8);
  if (isOn) {
    onOffIndicator.setAttribute("fill", "#080");
      onOffText.textContent = "ON";
  } else {
      onOffIndicator.setAttribute("fill", "#800");
      onOffText.textContent = "OFF";
  }
  onOffIndicator.setAttribute("display", "inline");
  onOffText.setAttribute("display", "inline");
}

function updateButtons() {
  const throwDiceButton = document.getElementById('throw-dice-button');
  throwDiceButton.disabled = throwing;
}

function setCurrentPoint(throwSum) {
  if (!isOn) {
    comeOutThrow = true;
    madePoint = false;
    if (throwSum === 7 || throwSum === 11 || throwSum === 2 || throwSum === 3 || throwSum === 12) {
      currentPoint = 0;
    } else {
      isOn = true;
      currentPoint = throwSum;
    }
  } else {
    comeOutThrow = false;
    madePoint = throwSum === currentPoint;
    if (madePoint) {
      addRollHistory(`made point ${throwSum}`);
    }
    if (throwSum === 7) {
      addRollHistory('seven out');
    }
    if (throwSum === 7 || madePoint) {
      isOn = false;
      currentPoint = 0;
    }
  }

  updateOnOffIndicator();
}

function throwDice() {
  die1 = Math.floor(Math.random() * 6) + 1;
  die2 = Math.floor(Math.random() * 6) + 1;
  throwCount++;
  const die1Text = getSvgElementById('die1-text');
  die1Text.textContent = die1;
  const die2Text = getSvgElementById('die2-text');
  die2Text.textContent = die2;
}

function updateTable() {
  updateButtons();
  updatePlayerInfo();
  updateSessionInfo();
  updateRollStatus();
  updateBetsOnSvg();
}

function makePassOddsBets() {
  _.forEach(players, p => {
    const strategy = findBettingStrategyById(p.strategyId);
    const bet = strategy.createPassOddsBet(p, currentPoint);
    if (bet) {
      p.balance -= bet.amount;
      bets.push(bet);
      addRollHistory(`${p.name} bet ${bet.type} ${bet.amount}`);
    }
  });
}

function makeComeOddsBet(player, throwSum) {
  const strategy = findBettingStrategyById(player.strategyId);
  console.log('makeComeOddsBet', player.activeBetCount(bets), strategy.maxActiveBets);
  const bet = strategy.createComeOddsBet(player, throwSum);
  if (bet) {
    player.balance -= bet.amount;
    bets.push(bet);
    addRollHistory(`${player.name} bet ${bet.type} ${bet.amount}`);
  }
}

function makeOnBets() {
  _.forEach(players, p => {
    const strategy = findBettingStrategyById(p.strategyId);
    const oBets = strategy.createOnBets(p);
    const totalBet = _.sumBy(oBets, 'amount');
    p.balance -= totalBet;
    _.forEach(oBets, bet => {
      addRollHistory(`${p.name} bet ${bet.type} ${bet.amount}`);
      bets.push(bet);
    })
  });
}

export function makePassBets() {
  if (!isOn) {
    // bets = [];
    _.forEach(players, p => {
      const strategy = findBettingStrategyById(p.strategyId);
      const bet = strategy.createPassBet(p);
      if (bet) {
        p.balance -= bet.amount;
        bets.push(bet);
        addRollHistory(`${p.name} bet ${bet.type} ${bet.amount}`);
      }
    });
    console.log('new player now? pass bets', bets);
  } else {
    console.log('no pass bets when on');
  }
  passBetsPlaced = true;
  updateTable();
}

export function doThrow() {
  throwDice();
  const throwSum = die1 + die2;
  addRollHistory(`throw ${die1} ${die2}`)
  // Update the table based on the throw results
  setCurrentPoint(throwSum);
  processThrow(throwSum);
  if ((comeOutThrow) && (currentPoint > 0)) {
    console.log('set pass odds bets now', currentPoint);
    makePassOddsBets();
  }
  if ((comeOutThrow) && (currentPoint > 0) && !onBetsPlaced) {
    console.log('set on bets now', currentPoint);
    makeOnBets();
    onBetsPlaced = true;
  }
  updateTable();
}

export function stopRoll() {
  stop = true;
}

export function run(n, count = 0) {
  const delay = 1000 / ( 1 + Math.log(n));
  throwing = true;
  updateButtons();
  if (!stop && (count < n)) {
    if (!passBetsPlaced) {
      clearRollHistory();
      makePassBets();
      setTimeout(() => run(n, count), delay);
    } else {
      doThrow();
      setTimeout(() => run(n, count + 1), delay);
    }
  } else {
    stop = false;
    throwing = false;
    updateButtons();
    console.log(`throw ${count} done`);
  }
}
