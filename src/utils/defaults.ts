import { Account } from "../types/config";
import keytar from "keytar";

export const getDefaultCustomer = async (): Promise<number> => {
  const defaultCustomer = await keytar.getPassword(
    "clockodo-cli",
    Account.DefaultCustomer
  );

  if (defaultCustomer === null) {
    throw new Error("No default customer configured.");
  }

  return Number(defaultCustomer);
};
