import { strategies } from './strategies.js';
import { placeBets, doRoll, run } from './craps-simulator.js';

document.getElementById("set-bets-button").addEventListener("click", () => {
  placeBets();
});

document.getElementById("roll-dice-button").addEventListener("click", () => {
  doRoll();
});

document.getElementById("run10").addEventListener("click", () => {
  run(10);
});

document.getElementById("run100").addEventListener("click", () => {
  run(100);
});

document.getElementById("run1000").addEventListener("click", () => {
  run(1000);
});

const strategyTabButton = document.getElementById('strategy-tab-button');
const svgTabButton = document.getElementById('svg-tab-button');
const strategyTab = document.getElementById('strategy-tab');
const svgTab = document.getElementById('svg-tab');

function showTab(tab) {
  strategyTab.classList.remove('active');
  svgTab.classList.remove('active');
  tab.classList.add('active');
}

strategyTabButton.addEventListener('click', () => {
  showTab(strategyTab);
});

svgTabButton.addEventListener('click', () => showTab(svgTab));

const strategyNameInput = document.getElementById('strategy-name');
const flatBetAmountInput = document.getElementById('flat-bet-amount');
const percentBetAmountInput = document.getElementById('percent-bet-amount');
const form = document.getElementById('update-strategy-form');

function updateFormFields(strategyId) {
  const strategy = strategies.find(s => s.id === strategyId);
  document.getElementById('strategy-name').value = strategy.name;
  document.getElementById('pass-line').checked = strategy.passLine;
  document.getElementById('odds-pass').checked = strategy.oddsPass;
  document.getElementById('come-bets').checked = strategy.comeBets;
  document.getElementById('odds-come').checked = strategy.oddsCome;
  document.getElementById('max-odds-multiple').checked = strategy.maxOddsMultiple;
  document.getElementById('min-bet').value = strategy.minBet;
  document.getElementById('max-bet').value = strategy.maxBet;
  document.getElementById('flat-bet-amount').value = strategy.flatBetAmount;
  document.getElementById('percent-bet-amount').value = strategy.percentBetAmount;
  for (const placeBetKey in strategy.placeBets) {
    document.getElementById(placeBetKey).checked = strategy.placeBets[placeBetKey];
  }
}

function updateStrategy(strategyId) {
  const strategy = strategies.find(s => s.id === strategyId);
  strategy.name = document.getElementById('strategy-name').value;
  strategy.passLine = document.getElementById('pass-line').checked;
  strategy.oddsPass = document.getElementById('odds-pass').checked;
  strategy.comeBets = document.getElementById('come-bets').checked;
  strategy.oddsCome = document.getElementById('odds-come').checked;
  strategy.maxOddsMultiple = document.getElementById('max-odds-multiple').checked;
  strategy.minBet = parseFloat(document.getElementById('min-bet').value);
  strategy.maxBet = parseFloat(document.getElementById('max-bet').value);
  strategy.flatBetAmount = parseFloat(document.getElementById('flat-bet-amount').value);
  strategy.percentBetAmount = parseFloat(document.getElementById('percent-bet-amount').value);
  for (const placeBetKey in strategy.placeBets) {
    strategy.placeBets[placeBetKey] = document.getElementById(placeBetKey).checked;
  }
  console.log('update strategy', strategies);
  localStorage.setItem('strategies', JSON.stringify(strategies));
}


function setupStrategyForm() {
  const strategySelect = document.getElementById('strategy-select');
  // add strategies to dropdown
  strategies.forEach(strategy => {
    const option = document.createElement('option');
    option.value = strategy.id;
    option.textContent = strategy.name;
    strategySelect.appendChild(option);
  });
  // Add an event listener for the 'change' event
  strategySelect.addEventListener('change', (event) => {
    // Get the selected strategy ID from the dropdown
    const selectedStrategyId = parseInt(event.target.value, 10);
    // Update the form fields with the selected strategy's properties
    updateFormFields(selectedStrategyId);
  });
  const strategyForm = document.getElementById('strategy-form');
  // Add an event listener for the 'submit' event
  strategyForm.addEventListener('submit', (event) => {
    // Prevent the default form submission behavior
    event.preventDefault();
    // Get the selected strategy ID from the dropdown
    const selectedStrategyId = parseInt(strategySelect.value, 10);
    // Update the strategy with the new values entered in the form fields
    updateStrategy(selectedStrategyId);
  });
}


async function loadForms() {
  try {
    const response = await fetch('strategy-form.html');
    const formHtml = await response.text();
    document.getElementById('stategy-form-container').innerHTML = formHtml;

    console.log('before setupStrategyForm', strategies);
    setupStrategyForm();
  } catch (error) {
    console.error('Error loading forms:', error);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  // Your code that references the strategies variable
  showTab(svgTab);
  loadForms();
});
