import { strategies } from './strategies.js';

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
  populateStrategyDropDown();
  showTab(strategyTab);
});

svgTabButton.addEventListener('click', () => showTab(svgTab));

const strategySelect = document.getElementById('strategy-select');
const strategyNameInput = document.getElementById('strategy-name');
const flatBetAmountInput = document.getElementById('flat-bet-amount');
const percentBetAmountInput = document.getElementById('percent-bet-amount');
const form = document.getElementById('update-strategy-form');

const populateStrategyDropDown = () => {
  // Populate the dropdown with strategies
  strategies.forEach(strategy => {
    const option = document.createElement('option');
    option.value = strategy.id;
    option.textContent = strategy.name;
    strategySelect.appendChild(option);
  });
}

function updateFormFields(strategy) {
  document.getElementById('strategy-name').value = strategy.name;
  document.getElementById('pass-line').checked = strategy.passLine;
  document.getElementById('odds-pass').checked = strategy.oddsPass;
  document.getElementById('come-bets').checked = strategy.comeBets;
  document.getElementById('odds-come').checked = strategy.oddsCome;
  document.getElementById('max-odds-multiple').value = strategy.maxOddsMultiple;
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
  strategy.maxOddsMultiple = parseInt(document.getElementById('max-odds-multiple').value, 10);
  strategy.minBet = parseFloat(document.getElementById('min-bet').value);
  strategy.maxBet = parseFloat(document.getElementById('max-bet').value);
  strategy.flatBetAmount = parseFloat(document.getElementById('flat-bet-amount').value);
  strategy.percentBetAmount = parseFloat(document.getElementById('percent-bet-amount').value);

  for (const placeBetKey in strategy.placeBets) {
    strategy.placeBets[placeBetKey] = document.getElementById(placeBetKey).checked;
  }
}

// Add an event listener for the 'change' event
strategySelect.addEventListener('change', (event) => {
  // Get the selected strategy ID from the dropdown
  const selectedStrategyId = parseInt(event.target.value, 10);

  // Find the strategy with the selected ID from the strategies array
  const selectedStrategy = strategies.find((s) => s.id === selectedStrategyId);

  // Update the form fields with the selected strategy's properties
  updateFormFields(selectedStrategy);
});

document.addEventListener("DOMContentLoaded", function () {
  // Your code that references the strategies variable
  showTab(svgTab);
});
