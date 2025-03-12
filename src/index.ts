#!/usr/bin/env node
import { program } from "commander";
import inquirer from "inquirer";
import keytar from "keytar";
import { setClockodoData, setJiraToken } from "./utils/auth";
import { MainMode } from "./types/modes";
import { Account } from "./types/auth";

// Add global handler for unhandled promise rejections
process.on("unhandledRejection", (reason: any) => {
  if (reason?.message?.includes("User force closed the prompt")) {
    console.error("Command interrupted by user");
    process.exit(0); // Exit gracefully
  } else {
    // For other types of promise rejections, let them propagate to the main try/catch
    console.error("An unhandled promise rejection occurred:");
    console.error(reason);
    process.exit(1);
  }
});

program.action(async () => {
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

  const { mode }: { mode: MainMode } = await inquirer.prompt([
    {
      type: "list",
      name: "mode",
      message: "What do you want to do?",
      choices: Object.values(MainMode),
    },
  ]);

  if (mode === MainMode.Logout) {
    await keytar.deletePassword("clockodo-cli", Account.ApiKey);
    await keytar.deletePassword("clockodo-cli", Account.Email);
    console.log("Logged out.");
  }

  console.log(mode);
});

program.parse(process.argv);
