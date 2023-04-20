// Define the bet types as constants
import { isOn } from "./craps-simulator.js";
import * as bt from "./bet-types.js";

const PASS = "pass";
const PLACE_4 = "place4";
const PLACE_10 = "place10";

const bettingStrategies = [
  {
    id: 'pass',
    name: "Simple Pass Bet",
    nextBet: (player) => {
      return [
        {
          type: bt.PASS,
          amount: 10 // Example fixed bet amount
        }
      ];
    }
  },
  {
    id: '410',
    name: "4-10 Strategy",
    nextBet: (player) => {
      return [
          {
            type: bt.PLACE_4,
            amount: 10 // Example fixed bet amount
          },
          {
            type: bt.PLACE_10,
            amount: 10 // Example fixed bet amount
          }
        ];
      }
    }
  ];

export { bettingStrategies };
