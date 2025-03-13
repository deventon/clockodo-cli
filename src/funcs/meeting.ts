import { ClockodoProp } from "../types/clockodo";
import { search } from "@inquirer/prompts";
import inquirer from "inquirer";
import {
  getDefaultCustomer,
  getMeetingPresets,
  getMeetingServiceId,
} from "../utils/defaults";

enum Mode {
  Preset = "Preset",
  Call = "Call",
  Manual = "Manual",
}

export const meeting = async ({ clockodo }: ClockodoProp) => {
  const { mode }: { mode: Mode } = await inquirer.prompt([
    {
      type: "list",
      name: "mode",
      message: "What do you want to do?",
      choices: Object.values(Mode),
    },
  ]);

  switch (mode) {
    case Mode.Preset:
      await preset({ clockodo });
      break;
    case Mode.Call:
      await call({ clockodo });
      break;
    case Mode.Manual:
      await manual({ clockodo });
      break;
  }
};

const preset = async ({ clockodo }: ClockodoProp) => {
  const presets = await getMeetingPresets();
  const customersId = await getDefaultCustomer({ clockodo });
  const servicesId = await getMeetingServiceId({ clockodo });

  const { text } = await inquirer.prompt([
    {
      type: "list",
      name: "text",
      message: "Select a preset",
      choices: presets,
    },
  ]);

  await clockodo.startClock({
    customersId,
    servicesId,
    text,
  });
};

const call = async ({ clockodo }: ClockodoProp) => {
  const customersId = await getDefaultCustomer({ clockodo });
  const servicesId = await getMeetingServiceId({ clockodo });
  const { users } = await clockodo.getUsers({ filterActive: true });

  const user = await search({
    message: "Select a coworker",
    source: async (input) => {
      const filteredUsers = input
        ? users.filter(({ name }) =>
            name.toLowerCase().includes(input.toLowerCase())
          )
        : users;

      return filteredUsers.map((user) => ({
        name: user.name,
        value: user.name,
      }));
    },
  });

  await clockodo.startClock({
    customersId,
    servicesId,
    text: `Abstimmung ${user}`,
  });
};

const manual = async ({ clockodo }: ClockodoProp) => {
  const customersId = await getDefaultCustomer({ clockodo });
  const servicesId = await getMeetingServiceId({ clockodo });
  const { text } = await inquirer.prompt([
    {
      type: "input",
      name: "text",
      message: "Enter description...",
    },
  ]);

  await clockodo.startClock({
    customersId,
    servicesId: Number(servicesId),
    text,
  });
};
