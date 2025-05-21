import { DateTime } from "luxon";
import { ClockodoProp } from "../types/clockodo";
import actionSelect from "inquirer-action-select";
import { confirm } from "@inquirer/prompts";

export const timetable = async ({ clockodo }: ClockodoProp) => {
  const { customers } = await clockodo.getCustomers();
  const { projects } = await clockodo.getProjects();
  const { services } = await clockodo.getServices();
  const {
    user: { timezone: zone },
  } = await clockodo.getAggregatesUsersMe();

  const startOfDay = DateTime.local({ zone })
    .startOf("day")
    .setZone("utc")
    .set({ millisecond: 0 });
  const endOfDay = DateTime.local({ zone })
    .endOf("day")
    .setZone("utc")
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
      name += entry.timeUntil
        ? DateTime.fromISO(entry.timeUntil).toFormat("HH:mm")
        : "now";
      name += "] ";
      name += entry.text ?? `No description (${customer})`;

      let details = "";
      details += customer;
      details += project ? ` - ${project}` : "";
      details += " - " + service;
      details += entry.text ? ` - ${entry.text}` : "";

      return { name, value: entry.id, description: details };
    });

  const selectedEntry = await actionSelect({
    message: "What do you want to track?",
    actions: [
      { value: "edit", name: "Edit", key: "e" },
      { value: "delete", name: "Delete", key: "x" },
      { value: "merge", name: "Merge", key: "m" },
      { value: "split", name: "Split", key: "s" },
      { value: "quit", name: "Quit", key: "q" },
    ],
    choices: mappedEntries,
    loop: false,
    pageSize: 25,
  });

  if (selectedEntry.action === "delete") {
    const answer = await confirm({
      message: "Are you sure you want to delete the selected entry?",
      default: true,
    });

    if (answer) {
      await clockodo.deleteEntry({ id: selectedEntry.answer });
      console.log("Entry deleted.");
    } else {
      console.log("Entry not deleted.");
    }
  }
};
