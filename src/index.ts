#!/usr/bin/env node
import { program } from "commander";
import inquirer from "inquirer";
import keytar from "keytar";
import { setClockodoData } from "./utils/auth";
import { Account } from "./types/config";
import { meeting } from "./funcs/meeting";
import { manual } from "./funcs/manual";
import { absence } from "./funcs/absence";
import { exit } from "./funcs/exit";
import { Clockodo } from "clockodo";
import storage from "node-persist";
import { reset } from "./funcs/config";
import { jira } from "./funcs/jira";
import path from "path";
import os from "os";

enum Mode {
  Jira = "Jira",
  Meeting = "Meeting",
  Manual = "Manual",
  Absence = "Absence",
  Reset = "Reset",
  Exit = "Exit",
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
  await storage.init({ dir: path.join(os.homedir(), ".clockodo-cli") });
  let apiKey = await keytar.getPassword("clockodo-cli", Account.ApiKey);
  let email = await keytar.getPassword("clockodo-cli", Account.Email);

  if (apiKey === null || email === null) {
    console.log("No Clockodo API key found. Please log in.");
    const loginData = await setClockodoData();
    apiKey = loginData.apiKey;
    email = loginData.email;
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
    case Mode.Jira:
      await jira({ clockodo });
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
    case Mode.Reset:
      await reset();
      break;
    case Mode.Exit:
      await exit();
      break;
  }
});

program.parse(process.argv);
