import storage from "node-persist";
import keytar from "keytar";
import { Account } from "../types/config";
import inquirer from "inquirer";

enum Mode {
  Clockodo = "Clockodo",
  Jira = "Jira",
  Defaults = "Defaults",
}

export const reset = async () => {
  const { mode } = await inquirer.prompt([
    {
      type: "list",
      name: "mode",
      message: "What are you doing on your current branch?",
      choices: Object.values(Mode),
    },
  ]);

  switch (mode) {
    case Mode.Clockodo:
      await clockodo();
      break;
    case Mode.Jira:
      await jira();
      break;
    case Mode.Defaults:
      await defaults();
      break;
  }
};

const clockodo = async () => {
  await keytar.deletePassword("clockodo-cli", Account.Email);
  await keytar.deletePassword("clockodo-cli", Account.ApiKey);
  console.log("Clockodo credentials have been deleted.");
};

const jira = async () => {
  await keytar.deletePassword("clockodo-cli", Account.JiraToken);
  console.log("Jira token has been deleted.");
};
const defaults = async () => {
  await storage.clear();
  console.log("Defaults have been reset.");
};
