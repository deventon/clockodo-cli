import { Clockodo } from "clockodo";
import { jira } from "./jira";

export const handleFlags = async (options: any, clockodo: Clockodo) => {
  if (options.jiraDev) {
    await jira({ clockodo, mode: "development" });
    process.exit(0);
  }

  if (options.jiraTest) {
    await jira({ clockodo, mode: "review" });
    process.exit(0);
  }
}