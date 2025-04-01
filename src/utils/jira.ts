import axios from "axios";
import chalk from "chalk";
import ora from "ora";

export const getJiraData = async ({
  key,
  jiraToken,
}: {
  key: string;
  jiraToken: string;
}) => {
  const spinner = ora(`Fetching ticket ${key}...`).start();

  const response = await axios.get(
    `https://clickbits.atlassian.net/rest/api/2/issue/${key}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${jiraToken}`,
      },
    }
  );

  let res = response.data;
  spinner.succeed(chalk.green("Ticket information retrieved."));

  if (res.fields.issuetype.subtask) {
    console.log();
    const spinner = ora(`Subtask detected. Fetching parent ticket...`).start();
    const parentTaskRes = await axios.get(
      `https://clickbits.atlassian.net/rest/api/2/issue/${res.fields.parent.key}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${jiraToken}`,
        },
      }
    );
    res = parentTaskRes.data;
    spinner.succeed(chalk.green("Parent ticket information retrieved."));
  }

  const project = res.fields.parent?.fields?.summary;

  const summary = res.fields.summary;
  const relevantKey = res.key;

  console.info(
    project
      ? `\nThis ticket has an epic ${chalk.yellow(
          project
        )}. The project will be set accordingly.`
      : "No epic set. The entry will be started without a project."
  );

  return { text: `${relevantKey} ${summary}`, project };
};
