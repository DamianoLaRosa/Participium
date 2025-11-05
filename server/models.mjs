"use strict";

export function Player(id, username, password, mail, coins) {
  this.id = id;
  this.username = username;
  this.password = password;
  this.mail = mail;
  this.coins = coins;
}

export function Letter(id, char, cost) {
  this.id = id;
  this.char = char.toUpperCase();
  this.cost = cost;

  this.enough = (coinsAmount) => coinsAmount >= this.cost;
}

