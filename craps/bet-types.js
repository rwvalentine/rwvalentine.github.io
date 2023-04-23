export const PASS = 'PASS';
export const COME = 'COME';
export const PLACE_4 = 'PLACE_4';
export const PLACE_5 = 'PLACE_5';
export const PLACE_6 = 'PLACE_6';
export const PLACE_8 = 'PLACE_8';
export const PLACE_9 = 'PLACE_9';
export const PLACE_10 = 'PLACE_10';
export const ODDS_PASS = 'ODDS_PASS';
export const ODDS_COME = 'ODDS_COME';

export const oddsLookup = {
  4: 2,
  5: 3/2,
  6: 6/5,
  8: 6/5,
  9: 3/2,
  10: 2,
};

export const betTypes = [
  { type: PASS, posY: 500, posX: 500, odds: 1 },
  { type: COME, posY: 420, posX: 500, odds: 1 },
  { type: PLACE_4, posY: 180, posX: 250, odds: 9/5 },
  { type: PLACE_5, posY: 180, posX: 350, odds: 7/5 },
  { type: PLACE_6, posY: 180, posX: 450, odds: 7/6 },
  { type: PLACE_8, posY: 180, posX: 550, odds: 7/6 },
  { type: PLACE_9, posY: 180, posX: 650, odds: 7/5 },
  { type: PLACE_10, posY: 180, posX: 750, odds: 9/5 },
  { type: ODDS_PASS, posY: 520, posX: 500, odds: oddsLookup },
  { type: ODDS_COME, posY: 440, posX: 500, odds: oddsLookup },
];
