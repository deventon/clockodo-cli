import { Clockodo } from "clockodo";
import { jira } from "./jira";

export const handleFlags = async (options: any, clockodo: Clockodo) => {
  if (options.jiraDev) {
    await jira({ clockodo, mode: "development", ticket: options.jiraDev });
    process.exit(0);
  }

  if (options.jiraTest) {
    await jira({ clockodo, mode: "review", ticket: options.jiraTest });
    process.exit(0);
  }
}