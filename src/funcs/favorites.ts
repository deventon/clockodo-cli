import { ClockodoProp } from "../types/clockodo";
import actionSelect from "inquirer-action-select";
import { confirm, input } from "@inquirer/prompts";
import { getEntryData } from "./manual";
import chalk from "chalk";

export const favorites = async ({ clockodo }: ClockodoProp) => {
  const response = await clockodo.api.get("v2/favorites");
  const favorites = response.data;
  const { customers } = await clockodo.getCustomers();
  const { projects } = await clockodo.getProjects();
  const { services } = await clockodo.getServices();

  console.log(favorites);

  const mappedFavorites = favorites.reduce(
    (acc, favorite) => {
      const { name: customer } = customers.find(
        ({ id }) => id === favorite.customersId
      );

      const { name: project } =
        projects.find(({ id }) => id === favorite.projectsId) ?? {};

      const { name: service } = services.find(
        ({ id }) => id === favorite.servicesId
      );

      let details = "";
      details += chalk.blue(chalk.bold(customer));
      details += project ? ` - ${chalk.blue(project)}` : "";
      details += " | " + chalk.green(service);
      details += favorite.text ? ` | ${chalk.gray(favorite.text)}` : "";
      details +=
        " | " + (favorite.billable ? chalk.green("€") : chalk.grey("€"));

      acc[favorite.position] = {
        ...favorite,
        value: favorite.id,
        description: details,
      };
      return acc;
    },
    Array.from({ length: 8 }, (_, value) => ({
      name: chalk.yellow("[+]"),
      value: `new-${value}`,
      description: "Create new favorite",
    }))
  );

  const selectedEntry = await actionSelect({
    message: "Select, edit or add a favorite:",
    actions: [
      // { value: "edit", name: "Edit", key: "e" }, - not implemented yet
      { value: "start", name: "Start/Add", key: "enter" },
      { value: "delete", name: "Delete", key: "x" },
      { value: "quit", name: "Quit", key: "q" },
    ],
    choices: mappedFavorites,
    loop: false,
    pageSize: 25,
  });

  if (
    typeof selectedEntry.answer === "string" &&
    selectedEntry.answer.startsWith("new-")
  ) {
    if (selectedEntry.action === "delete") {
      console.error(chalk.red("Cannot delete an empty favorite slot."));
      return;
    }

    if (selectedEntry.action === "quit") {
      return;
    }

    const position = Number(selectedEntry.answer.replace("new-", ""));

    const name = await input({
      message: "Enter a name for the new favorite",
      required: true,
    });

    const { customersId, projectsId, servicesId, text } = await getEntryData({
      clockodo,
    });

    const billable = Number(
      await confirm({
        message: "Is this favorite billable?",
        default: false,
      })
    );

    await clockodo.api.post("v2/favorites", {
      name,
      position,
      customersId,
      projectsId,
      servicesId,
      text,
      billable,
      color: 1,
    });

    console.log(chalk.green(`Favorite ${name} created.`));
    return;
  }

  const favorite = favorites.find(({ id }) => id === selectedEntry.answer);

  switch (selectedEntry.action) {
    case "edit":
      // Handle edit action
      console.log(
        chalk.yellow(
          "Editing favorites is not yet implemented. Please delete the favorite and create a new one."
        )
      );
      break;
    case "delete":
      const answer = await confirm({
        message: chalk.yellow(
          `Are you sure you want to delete the favorite: ${favorite.name}?`
        ),
        default: true,
      });

      if (!answer) {
        console.log(chalk.yellow("Deletion cancelled."));
        return;
      } else {
        await clockodo.api.delete(`v2/favorites/${selectedEntry.answer}`);
        console.log(chalk.green("Deletion successful."));
      }
      break;
    case "quit":
      return;

    default:
      await clockodo.startClock(favorite);
      console.log(chalk.green(`Started clock for favorite: ${favorite.name}`));
      break;
  }
};
