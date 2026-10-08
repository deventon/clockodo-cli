import inquirer from "inquirer";
import axios from "axios";
import storage from "node-persist";
import { Account } from "../types/config";

export const setClockodoData = async () => {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "email",
      message: "Enter your email address:",
    },
    {
      type: "password",
      name: "password",
      message: "Enter your password:",
    },
  ]);

  try {
    // The unversioned `/apikey` endpoint has been decommissioned (HTTP 410);
    // `/v2/apikey` replaces it and wraps the key in a `{ data }` envelope.
    const response = await axios.post(
      "https://my.clockodo.com/api/v2/apikey",
      {
        email: answers.email,
        password: answers.password,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          // Mandatory for API-key requests; without it the API answers with
          // HTTP 200 and an error body instead of the key.
          "X-Clockodo-External-Application": `Clockodo CLI;${answers.email}`,
        },
      }
    );

    const apiKey = response.data?.data?.api_key;

    if (!apiKey) {
      throw new Error(response.data?.message ?? "No API key in response.");
    }

    await storage.setItem(Account.ApiKey, apiKey);
    await storage.setItem(Account.Email, answers.email);

    console.log("Clockodo login successful!");
    return { apiKey, email: answers.email };
  } catch (error) {
    console.error(
      "Login failed:",
      error.response
        ? [
            error.response.data,
            error.response.data.errors,
            error.response.data.message,
          ]
        : error.request
          ? "No response from server."
          : error.message
    );
    process.exit(1);
  }
};

export const setJiraToken = async () => {
  const { jiraEmail } = await inquirer.prompt([
    {
      type: "input",
      name: "jiraEmail",
      message: "Enter your Jira email:",
    },
  ]);

  const { jiraToken } = await inquirer.prompt([
    {
      type: "input",
      name: "jiraToken",
      message: "Enter your Jira API token:",
    },
  ]);

  const encodedJiraToken = Buffer.from(`${jiraEmail}:${jiraToken}`).toString(
    "base64"
  );

  await storage.setItem(Account.JiraToken, encodedJiraToken);

  console.log("Jira API token generation successful!");

  return encodedJiraToken;
};

export const getJiraToken = async () => {
  const jiraToken = await storage.getItem(Account.JiraToken);

  // Check Jira API token
  if (jiraToken === undefined) {
    console.log("No Jira API token found. Please enter it.");
    const generatedJiraToken = await setJiraToken();

    await storage.setItem(Account.JiraToken, generatedJiraToken);

    return generatedJiraToken;
  }

  return jiraToken;
};
