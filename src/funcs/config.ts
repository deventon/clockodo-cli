import storage from "node-persist";
import keytar from "keytar";
import { Account } from "../types/config";
import inquirer from "inquirer";

export const reset = async () => {
  const { clear } = await inquirer.prompt([
    {
      type: "confirm",
      name: "clear",
      default: false,
      message: "Do you want to clear all stored data?",
    },
  ]);

  if (clear) {
    await storage.clear();
    for (const key of Object.values(Account)) {
      await keytar.deletePassword("clockodo-cli", key);
    }
  }
};
