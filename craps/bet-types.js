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

export const pointPosX = {
  4: 250,
  5: 350,
  6: 450,
  8: 550,
  9: 650,
  10: 750,
}

export const betTypes = [
  { type: PASS, posY: 500, posX: 500, odds: 1 },
  { type: COME, posY: 400, posX: 500, odds: 1 },
  { type: PLACE_4, point: 4, posY: 180, posX: pointPosX[4], odds: 9/5 },
  { type: PLACE_5, point: 5, posY: 180, posX: pointPosX[5], odds: 7/5 },
  { type: PLACE_6, point: 6, posY: 180, posX: pointPosX[6], odds: 7/6 },
  { type: PLACE_8, point: 8, posY: 180, posX: pointPosX[8], odds: 7/6 },
  { type: PLACE_9, point: 9, posY: 180, posX: pointPosX[9], odds: 7/5 },
  { type: PLACE_10, point: 10, posY: 180, posX: pointPosX[10], odds: 9/5 },
  { type: ODDS_PASS, posY: 520, posX: 500, odds: oddsLookup },
  { type: ODDS_COME, posY: 440, posX: 500, odds: oddsLookup },
];
