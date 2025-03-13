import inquirer from "inquirer";
import { ClockodoProp } from "../types/clockodo";
import keytar from "keytar";
import { Account } from "../types/config";

export const setDefaultData = async ({
  clockodo,
}: ClockodoProp): Promise<void> => {
  const { customers } = await clockodo.getCustomers({ filterActive: true });

  const { defaultCustomer } = await inquirer.prompt([
    {
      type: "list",
      name: "defaultCustomer",
      message: "Select your default customer",
      choices: customers.map((customer) => ({
        name: customer.name,
        value: customer.id,
      })),
    },
  ]);

  await keytar.setPassword(
    "clockodo-cli",
    Account.DefaultCustomer,
    String(defaultCustomer)
  );
};
