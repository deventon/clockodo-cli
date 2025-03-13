#!/usr/bin/env node
import { program } from "commander";
import inquirer from "inquirer";
import keytar from "keytar";
import { setClockodoData, setJiraToken } from "./utils/auth";
import { Account, Storage } from "./types/config";
import { development } from "./funcs/development";
import { meeting } from "./funcs/meeting";
import { manual } from "./funcs/manual";
import { absence } from "./funcs/absence";
import { exit } from "./funcs/exit";
import { Clockodo } from "clockodo";
import storage from "node-persist";

enum Mode {
  Development = "Development",
  Meeting = "Meeting",
  Manual = "Manual",
  Absence = "Absence",
  Exit = "Exit",
  Logout = "Logout",
}

// Add global handler for unhandled promise rejections
process.on("unhandledRejection", (reason: any) => {
  if (reason?.message?.includes("User force closed the prompt")) {
    console.error("Command interrupted by user");
    process.exit(0); // Exit gracefully
  } else if (reason?.response?.data) {
    // If the rejection is from an Axios request, log the response data
    console.error("Unhandled axios error:");
    console.error(reason.response.data);
    process.exit(1);
  } else {
    // For other types of promise rejections, let them propagate to the main try/catch
    console.error("An unhandled promise rejection occurred:");
    console.error(reason);
    process.exit(1);
  }
});

program.action(async () => {
  await storage.init();
  const apiKey = await keytar.getPassword("clockodo-cli", Account.ApiKey);
  const email = await keytar.getPassword("clockodo-cli", Account.Email);
  const jiraToken = await keytar.getPassword("clockodo-cli", Account.JiraToken);

  if (apiKey === null || email === null) {
    console.log("No Clockodo API key found. Please log in.");
    await setClockodoData();
  }

  // Check Jira API token
  if (jiraToken === null) {
    console.log("No Jira API token found. Please enter it.");
    await setJiraToken();
  }

  const clockodo = new Clockodo({
    client: {
      name: "Clockodo CLI",
      email,
    },
    authentication: {
      user: email,
      apiKey,
    },
  });

  const { mode }: { mode: Mode } = await inquirer.prompt([
    {
      type: "list",
      name: "mode",
      message: "What do you want to do?",
      choices: Object.values(Mode),
    },
  ]);
  switch (mode) {
    case Mode.Development:
      await development({ clockodo });
      break;
    case Mode.Meeting:
      await meeting({ clockodo });
      break;
    case Mode.Manual:
      await manual({ clockodo });
      break;
    case Mode.Absence:
      await absence({ clockodo });
      break;
    case Mode.Exit:
      await exit();
      break;
    case Mode.Logout: {
      await keytar.deletePassword("clockodo-cli", Account.ApiKey);
      await keytar.deletePassword("clockodo-cli", Account.Email);
      await keytar.deletePassword("clockodo-cli", Account.JiraToken);
      await storage.removeItem(Storage.DefaultCustomer);
      console.log("Logged out successfully");
      break;
    }
  }
});

program.parse(process.argv);
