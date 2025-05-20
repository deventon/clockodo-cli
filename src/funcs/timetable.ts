import { DateTime } from "luxon";
import { ClockodoProp } from "../types/clockodo";
import inquirer from "inquirer";

export const timetable = async ({ clockodo }: ClockodoProp) => {
  const { customers } = await clockodo.getCustomers();
  const { projects } = await clockodo.getProjects();
  const { services } = await clockodo.getServices();

  const startOfDay = DateTime.local({ zone: "utc" })
    .startOf("day")
    .set({ millisecond: 0 });
  const endOfDay = DateTime.local({ zone: "utc" })
    .endOf("day")
    .set({ millisecond: 0 });
  const { entries } = await clockodo.getEntries({
    timeSince: startOfDay.toISO({ suppressMilliseconds: true }),
    timeUntil: endOfDay.toISO({ suppressMilliseconds: true }),
  });

  const mappedEntries = entries
    .filter((e) => "servicesId" in e)
    .map((entry) => {
      const { name: customer } = customers.find(
        ({ id }) => id === entry.customersId
      );

      const { name: project } =
        projects.find(({ id }) => id === entry.projectsId) ?? {};

      const { name: service } = services.find(
        ({ id }) => id === entry.servicesId
      );

      let name = "[";
      name += DateTime.fromISO(entry.timeSince).toFormat("HH:mm");
      name += " - ";
      name += DateTime.fromISO(entry.timeUntil).toFormat("HH:mm");
      name += "] ";
      name += entry.text ?? `No description (${customer})`;

      let details = "";
      details += customer;
      details += project ? ` - ${project}` : "";
      details += " - " + service;
      details += entry.text ? ` - ${entry.text}` : "";

      return { name, value: entry.id, description: details };
    });

  const { selectedEntry } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedEntry",
      message: "What do you want to track?",
      choices: mappedEntries,
      loop: false,
      pageSize: 25,
    },
  ]);

  console.log(selectedEntry);
};
