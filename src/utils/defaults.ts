import inquirer from "inquirer";
import { ClockodoProp } from "../types/clockodo";
import { Storage } from "../types/config";
import storage from "node-persist";

export const getDefaultCustomer = async ({
  clockodo,
}: ClockodoProp): Promise<number> => {
  const defaultCustomer = await storage.getItem(Storage.DefaultCustomer);

  if (defaultCustomer === undefined) {
    console.warn("No default customer configured. Please choose a customer.");
    const defaultCustomerId = await selectDefaultCustomer({ clockodo });
    storage.setItem(Storage.DefaultCustomer, defaultCustomerId);
    return defaultCustomerId;
  }

  return Number(defaultCustomer);
};

export const getDevelopmentServiceId = async ({
  clockodo,
}: ClockodoProp): Promise<number> => {
  const serviceId = await storage.getItem(Storage.ServiceIdDevelopment);

  if (serviceId === undefined) {
    console.warn(
      "No service ID for development configured. Please choose a default."
    );
    const defaultServiceId = selectDefaultService({ clockodo });
    storage.setItem(Storage.ServiceIdMeeting, defaultServiceId);
    return defaultServiceId;
  }

  return serviceId;
};

export const getTestingServiceId = async ({
  clockodo,
}: ClockodoProp): Promise<number> => {
  const serviceId = await storage.getItem(Storage.ServiceIdTesting);

  if (serviceId === undefined) {
    console.warn(
      "No service ID for testing configured. Please choose a default."
    );
    const defaultServiceId = selectDefaultService({ clockodo });
    storage.setItem(Storage.ServiceIdTesting, defaultServiceId);
    return defaultServiceId;
  }

  return serviceId;
};

export const getMeetingServiceId = async ({
  clockodo,
}: ClockodoProp): Promise<number> => {
  const serviceId = await storage.getItem(Storage.ServiceIdMeeting);

  if (serviceId === undefined) {
    console.warn(
      "No service ID for meetings configured. Please choose a default."
    );
    const defaultServiceId = selectDefaultService({ clockodo });
    storage.setItem(Storage.ServiceIdMeeting, defaultServiceId);
    return defaultServiceId;
  }

  return serviceId;
};

const selectDefaultService = async ({ clockodo }: ClockodoProp) => {
  const { services } = await clockodo.getServices({ filterActive: true });
  const { serviceId } = await inquirer.prompt([
    {
      type: "list",
      name: "serviceId",
      message: "Select a service",
      choices: services.map((service) => ({
        name: service.name,
        value: service.id,
      })),
    },
  ]);

  return serviceId;
};

const selectDefaultCustomer = async ({ clockodo }: ClockodoProp) => {
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

  return defaultCustomer;
};
