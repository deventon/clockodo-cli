import inquirer from "inquirer";
import { ClockodoProp } from "../types/clockodo";
import { getJiraToken } from "../utils/auth";
import { getBranch } from "../utils/git";
import { getJiraData } from "../utils/jira";
import {
  getDefaultCustomer,
  getDevelopmentServiceId,
  getTestingServiceId,
} from "../utils/defaults";

enum Mode {
  Development = "Development",
  Review = "Review",
}

export const jira = async ({ clockodo }: ClockodoProp) => {
  const jiraToken = await getJiraToken();

  const { mode } = await inquirer.prompt([
    {
      type: "list",
      name: "mode",
      message: "What do you want to do?",
      choices: Object.values(Mode),
    },
  ]);

  switch (mode) {
    case Mode.Development:
      await development({ clockodo, jiraToken });
      break;
    case Mode.Review:
      await review({ clockodo, jiraToken });
      break;
  }
};

const development = async ({
  clockodo,
  jiraToken,
}: ClockodoProp & { jiraToken: string }) => {
  const customersId = await getDefaultCustomer({ clockodo });
  const servicesId = await getDevelopmentServiceId({ clockodo });

  const branch = await getBranch();
  const key = branch.match(/\w+-\d+/)?.[0];
  if (!key) {
    console.error("No Jira key found in branch name.");
    process.exit(1);
  }

  const { text, projectsId } = await getJiraData({ jiraToken, key });

  await clockodo.startClock({
    customersId,
    servicesId,
    projectsId,
    text,
  });
};

const review = async ({
  clockodo,
  jiraToken,
}: ClockodoProp & { jiraToken: string }) => {
  const customersId = await getDefaultCustomer({ clockodo });
  const servicesId = await getTestingServiceId({ clockodo });

  const branch = await getBranch();
  const key = branch.match(/\w+-\d+/)[0];

  const { text, projectsId } = await getJiraData({ jiraToken, key });

  await clockodo.startClock({
    customersId,
    servicesId,
    projectsId,
    text,
  });
};
