#!/usr/bin/env node
import { program } from "commander";
import inquirer from "inquirer";
import "dotenv/config";

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
  const { mode } = await inquirer.prompt([
    {
      type: "list",
      name: "mode",
      message: "What do you want to do?",
      choices: ["Development", "Meeting", "Manual", "Absence", "Exit"],
    },
  ]);

  console.log(mode);
});

program.parse(process.argv);
