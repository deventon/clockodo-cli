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
        : "No response from server."
    );
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
