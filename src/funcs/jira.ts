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
import chalk from "chalk";

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
      message: "What are you doing on your current branch?",
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

  const key = await parseJiraTicketFromBranch();

  const { text, project } = await getJiraData({ jiraToken, key });

  const projectsId = await getOrCreateProject({
    clockodo,
    project,
    customersId,
  });

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

  const key = await parseJiraTicketFromBranch();

  const { text, project } = await getJiraData({ jiraToken, key });

  const projectsId = await getOrCreateProject({
    clockodo,
    project,
    customersId,
  });

  await clockodo.startClock({
    customersId,
    servicesId,
    projectsId,
    text,
  });
};

const parseJiraTicketFromBranch = async () => {
  const branch = await getBranch();
  const key = branch.match(/\w+-\d+/)?.[0];

  if (!key) {
    console.error("No Jira key found in branch name.");
    process.exit(1);
  }

  return key;
};

const getOrCreateProject = async ({
  clockodo,
  project,
  customersId,
}: ClockodoProp & { project?: string; customersId: number }) => {
  let projectsId: number | undefined;
  if (project) {
    const { projects } = await clockodo.getProjects();
    projectsId = projects?.find(({ name }) => name === project)?.id;

    if (!projectsId) {
      const { createProject } = await inquirer.prompt([
        {
          type: "confirm",
          name: "createProject",
          message: `Project ${chalk.yellow(
            project
          )} does not exist. Do you want to create it?`,
        },
      ]);

      if (createProject) {
        const {
          project: { id },
        } = await clockodo.addProject({
          name: project,
          customersId,
        });
        console.log(`Project ${chalk.yellow(project)} created.`);
        projectsId = id;
      } else {
        console.log(
          `Project ${chalk.yellow(
            project
          )} not created. Starting entry without project.`
        );
      }
    }
  }

  return projectsId;
};
