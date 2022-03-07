const DEBUG = false;

function writeln(s) {
  const e = document.getElementById('output');
  e.innerHTML += s + '<br>';
}

function writeTbl(jsonData) {
  console.log('writeTbl', jsonData);
  let t = '<table><tr>';
  const keys = Object.keys(jsonData[0]);
  keys.forEach(k => t += `<td>${k}</td>`);
  t += '</tr>';
  jsonData.forEach((arrayItem) => {
      t += '<tr>';
      keys.forEach(k => t += `<td>${arrayItem[k]}</td>`);
      t += '<tr>';
  });
  t += '</table>';
  const e = document.getElementById('output');
  e.innerHTML += t + '<br>';
}

function settlePassLine ({ bets, hand, rules }) {
  if (!bets?.pass?.line) return { bets }

  const actionResults = ['seven out', 'point win', 'comeout win', 'comeout loss']
  const betHasAction = actionResults.includes(hand.result)

  if (!betHasAction) return { bets } // keep bets intact if no action

  const payout = {
    type: hand.result,
    principal: bets.pass.line.amount,
    profit: bets.pass.line.amount * 1
  }

  delete bets.pass.line // clear pass line bet on action

  if (hand.result === 'comeout loss' || hand.result === 'seven out') return { bets }

  return { payout, bets }
}

function settlePassOdds ({ bets, hand, rules }) {
  if (!bets?.pass?.odds) return { bets }

  const actionResults = ['seven out', 'point win']
  const betHasAction = actionResults.includes(hand.result)

  if (!betHasAction) return { bets } // keep bets intact if no action

  const payouts = {
    4: 2,
    5: 3 / 2,
    6: 6 / 5,
    8: 6 / 5,
    9: 3 / 2,
    10: 2
  }

  const payout = {
    type: 'pass odds win',
    principal: bets.pass.odds.amount,
    profit: bets.pass.odds.amount * payouts[hand.diceSum]
  }

  delete bets.pass.odds // clear pass odds bet on action

  if (hand.result === 'seven out') return { bets }

  return { payout, bets }
}

function settleAll ({ bets, hand, rules }) {
  const payouts = []

  const passLineResult = settlePassLine({ bets, hand, rules })

  bets = passLineResult.bets
  payouts.push(passLineResult.payout)

  const passOddsResult = settlePassOdds({ bets, hand, rules })

  bets = passOddsResult.bets
  payouts.push(passOddsResult.payout)

  bets.payouts = payouts.reduce((memo, payout) => {
    if (!payout) return memo

    memo.principal += payout.principal
    memo.profit += payout.profit
    memo.total += payout.principal + payout.profit
    memo.ledger.push(payout)
    return memo
  }, {
    principal: 0,
    profit: 0,
    total: 0,
    ledger: []
  })

  return bets
}

function rollD6 () {
  return 1 + Math.floor(Math.random() * 6)
}

function shoot (before, dice) {
  const sortedDice = dice.sort()

  const after = {
    die1: sortedDice[0],
    die2: sortedDice[1],
    diceSum: dice.reduce((m, r) => { return m + r }, 0)
  }

  // game logic based on: https://github.com/tphummel/dice-collector/blob/master/PyTom/Dice/logic.py

  if (before.isComeOut) {
    if ([2, 3, 12].indexOf(after.diceSum) !== -1) {
      after.result = 'comeout loss'
      after.isComeOut = true
    } else if ([7, 11].indexOf(after.diceSum) !== -1) {
      after.result = 'comeout win'
      after.isComeOut = true
    } else {
      after.result = 'point set'
      after.isComeOut = false
      after.point = after.diceSum
    }
  } else {
    if (before.point === after.diceSum) {
      after.result = 'point win'
      after.isComeOut = true
    } else if (after.diceSum === 7) {
      after.result = 'seven out'
      after.isComeOut = true
    } else {
      after.result = 'neutral'
      after.point = before.point
      after.isComeOut = false
    }
  }

  return after
}

function playHand ({ rules, bettingStrategy, roll = rollD6 }) {
  const history = []
  let balance = 0

  let hand = {
    isComeOut: true
  }

  let bets

  while (hand.result !== 'seven out') {
    bets = bettingStrategy({ rules, bets, hand })
    balance -= bets.new
    if (DEBUG && bets.new) writeln(`[bet] new bet $${bets.new} ($${balance})`)
    delete bets.new

    hand = shoot(
      hand,
      [roll(), roll()]
    )

    if (DEBUG) writeln(`[roll] ${hand.result} (${hand.diceSum})`)

    bets = settleAll({ rules, bets, hand })

    if (bets?.payouts?.total) {
      balance += bets.payouts.total
      if (DEBUG) writeln(`[payout] new payout $${bets.payouts.total} ($${balance})`)
      delete bets.payouts
    }

    history.push(hand)
  }

  return { history, balance }
}

function minPassLineOnly (opts) {
  const { rules, bets: existingBets, hand } = opts
  const bets = Object.assign({ new: 0 }, existingBets)

  if (DEBUG) writeln(`[decision] make a new pass line bet?: ${hand.isComeOut} && ${!bets?.pass?.line}`)

  if (hand.isComeOut && !bets?.pass?.line) {
    const newPassLineBet = {
      line: {
        amount: rules.minBet
      }
    }

    bets.pass = newPassLineBet
    bets.new += bets.pass.line.amount
  }

  return bets
}

function minPassLineMaxOdds (opts) {
  const bets = minPassLineOnly(opts)
  const { rules, hand } = opts

  if (DEBUG) writeln(`[decision] make a new pass odds bet?: ${!hand.isComeOut} && ${!bets?.pass?.odds}`)

  if (hand.isComeOut === false && !bets?.pass?.odds) {
    const oddsAmount = rules.maxOddsMultiple[hand.point] * bets.pass.line.amount
    bets.pass.odds = {
      amount: oddsAmount
    }
    bets.new += oddsAmount
  }

  return bets
}



function run() {
  const numHands = document.getElementById('numHands').value;
  const showDetail = false;

  writeln(`Simulating ${numHands} Craps Hand(s)`)
  writeln('Using betting strategy: minPassLineMaxOdds')

  const summaryTemplate = {
    balance: 0,
    rollCount: 0,
    pointsSet: 0,
    pointsWon: 0,
    comeOutWins: 0,
    comeOutLosses: 0,
    netComeOutWins: 0,
    neutrals: 0,
    dist: {
      2: { ct: 0, prob: 1 / 36 },
      3: { ct: 0, prob: 2 / 36 },
      4: { ct: 0, prob: 3 / 36 },
      5: { ct: 0, prob: 4 / 36 },
      6: { ct: 0, prob: 5 / 36 },
      7: { ct: 0, prob: 6 / 36 },
      8: { ct: 0, prob: 5 / 36 },
      9: { ct: 0, prob: 4 / 36 },
      10: { ct: 0, prob: 3 / 36 },
      11: { ct: 0, prob: 2 / 36 },
      12: { ct: 0, prob: 1 / 36 }
    }
  }

  const sessionSummary = Object.assign({}, summaryTemplate)

  const hands = []
  const rules = {
    minBet: 1,
    maxOddsMultiple: {
      4: 3,
      5: 4,
      6: 5,
      8: 5,
      9: 4,
      10: 3
    }
  }

  writeln(`[table rules] minimum bet: $${rules.minBet}`)

  for (let i = 0; i < numHands; i++) {
    const hand = playHand({ rules, bettingStrategy: minPassLineMaxOdds })
    hand.summary = Object.assign({}, summaryTemplate)

    sessionSummary.balance += hand.balance
    hand.summary.balance = hand.balance

    hand.history.reduce((memo, roll) => {
      memo.rollCount++
      hand.summary.rollCount++
      memo.dist[roll.diceSum].ct++

      switch (roll.result) {
        case 'neutral':
          memo.neutrals++
          hand.summary.neutrals++
          break
        case 'point set':
          memo.pointsSet++
          hand.summary.pointsSet++
          break
        case 'point win':
          memo.pointsWon++
          hand.summary.pointsWon++
          break
        case 'comeout win':
          memo.comeOutWins++
          hand.summary.comeOutWins++
          memo.netComeOutWins++
          hand.summary.netComeOutWins++
          break
        case 'comeout loss':
          memo.comeOutLosses++
          hand.summary.comeOutLosses++
          memo.netComeOutWins--
          hand.summary.netComeOutWins--
          break
      }

      return memo
    }, sessionSummary)

    hands.push(hand)
  }

  sessionSummary.handCount = hands.length

  for (const k of Object.keys(sessionSummary.dist)) {
    sessionSummary.dist[k].ref = Number((sessionSummary.dist[k].prob * sessionSummary.rollCount).toFixed(1))
    sessionSummary.dist[k].diff = Number((sessionSummary.dist[k].ct - sessionSummary.dist[k].ref).toFixed(1))
    sessionSummary.dist[k].diff_pct = Number((((sessionSummary.dist[k].ct - sessionSummary.dist[k].ref) / sessionSummary.dist[k].ref) * 100).toFixed(1))
    if (showDetail) {
      sessionSummary.dist[k].ref_work = `${(sessionSummary.dist[k].prob * sessionSummary.rollCount).toFixed(1)} (${sessionSummary.rollCount} * ${sessionSummary.dist[k].prob.toFixed(2)})`
    }
    delete sessionSummary.dist[k].prob
  }
  // writeln('\nDice Roll Distribution')
  // console.table(sessionSummary.dist)
  delete sessionSummary.dist

  writeln('\nSession Summary')
  writeTbl([sessionSummary])

  // writeln('\nHands Summary')
  // console.table(hands.map(hand => {
  //   delete hand.summary.dist
  //   return hand.summary
  // }))

  if (showDetail) {
    writeln('\nHands')
    hands.forEach((hand, handNum) => {
      writeln(`\nHand: ${handNum + 1}, Balance: $${hand.balance}`);
      writeTbl(hand.history);
    })
  }
}
