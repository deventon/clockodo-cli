import inquirer from "inquirer";
import { ClockodoProp } from "../types/clockodo";
import { Separator } from "@inquirer/prompts";
import { ManualMode } from "../types/modes";

export const manual = async ({ clockodo }: ClockodoProp) => {
  const { mode }: { mode: ManualMode } = await inquirer.prompt([
    {
      type: "list",
      name: "mode",
      message: "What do you want to do?",
      choices: Object.values(ManualMode),
    },
  ]);

  switch (mode) {
    case ManualMode.Start:
      await start({ clockodo });
      break;
    case ManualMode.Stop:
      await stop({ clockodo });
      break;
    case ManualMode.Change:
      await change({ clockodo });
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
