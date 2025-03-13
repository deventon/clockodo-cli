import inquirer from "inquirer";
import axios from "axios";
import keytar from "keytar";
import { Account } from "../types/config";

export async function setClockodoData(): Promise<void> {
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
    const response = await axios.post(
      "https://my.clockodo.com/api/apikey",
      {
        autologin: false,
        email: answers.email,
        password: answers.password,
        start_session: 1,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      }
    );

    const apiKey = response.data.apikey;

    await keytar.setPassword("clockodo-cli", Account.ApiKey, apiKey);
    await keytar.setPassword("clockodo-cli", Account.Email, answers.email);

    console.log("Clockodo login successful!");
  } catch (error) {
    console.error(
      "Login failed:",
      error.response
        ? [
            error.response.data,
            error.response.data.errors,
            error.response.data.message,
          ]
        : "No response from server."
    );
  }
}

export async function setJiraToken(): Promise<void> {
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

  await keytar.setPassword("clockodo-cli", "jira-api-token", encodedJiraToken);

  console.log("Jira API token generation successful!");
}
