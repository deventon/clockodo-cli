import { Clockodo } from "clockodo";
import { jira } from "./jira";
import { getStatusData, formatStatusOutput } from "../utils/status";

export const handleFlags = async (options: any, clockodo: Clockodo) => {
  if (options.status) {
    const statusData = await getStatusData({ clockodo });
    const output = formatStatusOutput(statusData);
    console.log(output);
    process.exit(0);
  }

  if (options.jiraDev) {
    await jira({ clockodo, mode: "development", ticket: options.jiraDev });
    process.exit(0);
  }

  if (options.jiraTest) {
    await jira({ clockodo, mode: "review", ticket: options.jiraTest });
    process.exit(0);
  }
}