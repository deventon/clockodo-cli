import storage from "node-persist";
import { Account, Storage } from "../types/config";
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
  await storage.removeItem(Account.Email);
  await storage.removeItem(Account.ApiKey);
  console.log("Clockodo credentials have been deleted.");
};

const jira = async () => {
  await storage.removeItem(Account.JiraToken);
  console.log("Jira token has been deleted.");
};
const defaults = async () => {
  await storage.removeItem(Storage.ServiceIdDevelopment);
  await storage.removeItem(Storage.ServiceIdMeeting);
  await storage.removeItem(Storage.ServiceIdTesting);
  await storage.removeItem(Storage.MeetingPresets);
  await storage.removeItem(Storage.DefaultCustomer);
  console.log("Defaults have been reset.");
};
