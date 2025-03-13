import { ClockodoProp } from "../types/clockodo";
import { search } from "@inquirer/prompts";

export const meeting = async ({ clockodo }: ClockodoProp) => {
  const { users } = await clockodo.getUsers();

  const user = await search({
    message: "Select an coworker",
    source: async (input) => {
      const filteredUsers = input
        ? users.filter(({ name }) =>
            name.toLowerCase().includes(input.toLowerCase())
          )
        : users;

      return filteredUsers.map((user) => ({
        name: user.name,
        value: user.name,
        description: user.email,
      }));
    },
  });
};
