#!/usr/bin/env node
import { program } from "commander";
import inquirer from "inquirer";
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
import { logRunningEntry, logWorkTimes } from "./utils/workTimes";
import { favorites } from "./funcs/favorites";
import { handleFlags } from "./funcs/flags";

enum Mode {
  Jira = "Jira/Git integration",
  Favorites = "Favorites", 
  Manual = "Manual clock options",
  Meeting = "Meeting options",
  Absence = "Add absence",
  Reset = "Reset configuration",
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

program
  .option("-d, --jira-dev [ticket]", "Skip interactive mode and directly start Jira development tracking")
  .option("-t, --jira-test [ticket]", "Skip interactive mode and directly start Jira review tracking")

program.action(async (options) => {
  await storage.init({ dir: path.join(os.homedir(), ".clockodo-cli") });
  let apiKey = await storage.getItem(Account.ApiKey);
  let email = await storage.getItem(Account.Email);

  if (apiKey === undefined || email === undefined) {
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
    baseUrl: "https://my.clockodo.com/api",
  });

  await handleFlags(options, clockodo);

  const runningEntry = await logRunningEntry({ clockodo });
  await logWorkTimes({ clockodo });

  const { mode }: { mode: Mode } = await inquirer.prompt([
    {
      type: "list",
      name: "mode",
      message: "What do you want to track?",
      choices: [
        { name: "🔗 Jira/Git integration", value: Mode.Jira },
        { name: "⭐ Favorites", value: Mode.Favorites },
        { name: "✏️ Manual clock options", value: Mode.Manual },
        new inquirer.Separator("── Other Actions ──"),
        { name: "🤝 Meeting options", value: Mode.Meeting },
        { name: "🏖️ Add absence", value: Mode.Absence },
        { name: "⚙️ Reset configuration", value: Mode.Reset },
        { name: "👋 Exit", value: Mode.Exit },
      ],
      loop: false,
      pageSize: 10,
    },
  ]);
  switch (mode) {
    case Mode.Jira:
      await jira({ clockodo });
      break;
    case Mode.Favorites:
      await favorites({ clockodo });
      break;
    case Mode.Meeting:
      await meeting({ clockodo });
      break;
    case Mode.Manual:
      await manual({ clockodo, runningEntry });
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
