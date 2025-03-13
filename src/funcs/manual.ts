import inquirer from "inquirer";
import { ClockodoProp } from "../types/clockodo";
import { Separator } from "@inquirer/prompts";
import ora from "ora";
import { ClockEditReturnType, Entry, TimeEntry } from "clockodo";
import chalk from "chalk";

enum Mode {
  Start = "Start clock",
  Stop = "Stop clock",
  Change = "Change running entry",
  Extend = "Extend running entry",
}

export const manual = async ({
  clockodo,
  runningEntry,
}: ClockodoProp & { runningEntry: TimeEntry }) => {
  const { mode }: { mode: Mode } = await inquirer.prompt([
    {
      type: "list",
      name: "mode",
      message: "What do you want to do?",
      choices: Object.values(Mode),
    },
  ]);

  switch (mode) {
    case Mode.Start:
      await start({ clockodo });
      break;
    case Mode.Stop:
      await stop({ clockodo });
      break;
    case Mode.Change:
      await change({ clockodo });
      break;
    case Mode.Extend:
      await extend({ clockodo, runningEntry });
      break;
  }
};

const getEntryData = async ({ clockodo }: ClockodoProp) => {
  const { customers } = await clockodo.getCustomers({ filterActive: true });
  const { services } = await clockodo.getServices({ filterActive: true });

  const { customersId } = await inquirer.prompt([
    {
      type: "list",
      name: "customersId",
      message: "Select your customer",
      choices: customers.map((customer) => ({
        name: customer.name,
        value: customer.id,
      })),
    },
  ]);

  const { projects } = await clockodo.getProjects({
    filterCustomersId: customersId,
    filterActive: true,
  });

  const { projectsId } = await inquirer.prompt([
    {
      type: "list",
      name: "projectsId",
      message: "Select your project",
      choices: [
        new Separator(),
        { name: "No project", value: undefined },
        new Separator(),
        ...projects.map((project) => ({
          name: project.name,
          value: project.id,
        })),
      ],
    },
  ]);

  const { servicesId } = await inquirer.prompt([
    {
      type: "list",
      name: "servicesId",
      message: "Select your service",
      choices: services.map((service) => ({
        name: service.name,
        value: service.id,
      })),
    },
  ]);

  const { text } = await inquirer.prompt([
    {
      type: "input",
      name: "text",
      message: "Enter a description",
    },
  ]);

  return { customersId, projectsId, servicesId, text };
};

const start = async ({ clockodo }: ClockodoProp) => {
  const { customersId, projectsId, servicesId, text } = await getEntryData({
    clockodo,
  });

  await clockodo.startClock({
    customersId,
    projectsId,
    servicesId,
    text,
  });
};

const stop = async ({ clockodo }: ClockodoProp) => {
  const { running } = await clockodo.getClock();
  if (running === null) {
    console.log("No running entry found.");
    return;
  }

  await clockodo.stopClock({ entriesId: running.id });
};

const change = async ({ clockodo }: ClockodoProp) => {
  const { running } = await clockodo.getClock();
  if (running === null) {
    console.log("No running entry found.");
    return;
  }

  const { customersId, projectsId, servicesId, text } = await getEntryData({
    clockodo,
  });

  await clockodo.editEntry({
    id: running.id,
    customersId,
    projectsId,
    servicesId,
    text,
  });
};

const extend = async ({
  clockodo,
  runningEntry,
}: ClockodoProp & { runningEntry: Entry }) => {
  const { minutes } = await inquirer.prompt([
    {
      type: "number",
      name: "minutes",
      message: "How many minutes?",
    },
  ]);

  const data = (await clockodo.changeClockDuration({
    time_since_before: runningEntry.timeSince,
    entriesId: runningEntry.id,
    durationBefore: 0,
    duration: 60 * minutes,
  })) as ClockEditReturnType & { overlappingCorrection: any };

  console.log(data.overlappingCorrection);

  const spinner = ora(`Updating running entry...`).start();

  const { overlappingCorrection } = data;
  const { running } = data;

  const previousEntryId = overlappingCorrection?.truncatePreviousEntry;

  if (previousEntryId) {
    await clockodo.editEntry({
      id: previousEntryId,
      timeUntil: running.timeSince,
      transferTimeFrom: runningEntry.id,
    });

    return spinner.succeed(
      chalk.green("Running entry updated, previous entry truncated.\n")
    );
  } else if (overlappingCorrection?.overlappingFreeTimeSince) {
    const timeSince =
      new Date(overlappingCorrection.overlappingFreeTimeSince)
        .toISOString()
        .split(".")[0] + "Z";

    await clockodo.editEntry({
      id: runningEntry.id,
      timeSince,
      timeSinceBefore: runningEntry.timeSince,
    });

    return spinner.succeed(
      chalk.green(
        "Running entry updated, start fit to previous entry's end time.\n"
      )
    );
  }

  return spinner.warn(
    chalk.yellow(
      "Running entry updated, no previous entry found. Check your timetable if you did not expect this.\n"
    )
  );
};
