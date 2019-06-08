#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const meow = require("meow");
const chalk = require("chalk");
const initit = require("./initit");

// From: https://github.com/jxnblk/mdx-deck/blob/master/packages/create-deck/cli.js

const logo = chalk.magenta("[code-surfer-deck]");
const log = (...args) => {
  console.log(logo, ...args);
};
log.error = (...args) => {
  console.log(chalk.red("[ERROR]"), ...args);
};

const template = "pomber/create-code-surfer-deck/templates/basic";

const cli = meow(
  `
  Usage

    $ npm init code-surfer-deck my-deck

    $ npx create-code-surfer-deck my-deck

`,
  {
    booleanDefault: undefined,
    flags: {
      help: {
        type: "boolean",
        alias: "h"
      },
      version: {
        type: "boolean",
        alias: "v"
      }
    }
  }
);

const [name] = cli.input;

if (!name) {
  cli.showHelp(0);
}

// todo: ensure directory doesn't exist
initit({ name, template })
  .then(res => {
    log("created code-surfer-deck");
    process.exit(0);
  })
  .catch(err => {
    log.error("failed to create code-surfer-deck");
    log.error(err);
    process.exit(1);
  });
