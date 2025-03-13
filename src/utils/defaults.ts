import inquirer from "inquirer";
import { ClockodoProp } from "../types/clockodo";
import { Storage } from "../types/config";
import storage from "node-persist";

export const getDefaultCustomer = async ({
  clockodo,
}: ClockodoProp): Promise<number> => {
  const defaultCustomer = await storage.getItem(Storage.DefaultCustomer);

  if (typeof defaultCustomer !== "number") {
    console.warn("No default customer configured. Please choose a customer.");
    const defaultCustomerId = await selectDefaultCustomer({ clockodo });
    await storage.setItem(Storage.DefaultCustomer, defaultCustomerId);
    return defaultCustomerId;
  }

  return Number(defaultCustomer);
};

export const getDevelopmentServiceId = async ({
  clockodo,
}: ClockodoProp): Promise<number> => {
  const serviceId = await storage.getItem(Storage.ServiceIdDevelopment);

  if (typeof serviceId !== "number") {
    console.warn(
      "No service ID for development configured. Please choose a default."
    );
    const defaultServiceId = await selectDefaultService({ clockodo });
    await storage.setItem(Storage.ServiceIdDevelopment, defaultServiceId);
    return defaultServiceId;
  }

  return serviceId;
};

export const getTestingServiceId = async ({
  clockodo,
}: ClockodoProp): Promise<number> => {
  const serviceId = await storage.getItem(Storage.ServiceIdTesting);

  if (typeof serviceId !== "number") {
    console.warn(
      "No service ID for testing configured. Please choose a default."
    );
    const defaultServiceId = await selectDefaultService({ clockodo });
    await storage.setItem(Storage.ServiceIdTesting, defaultServiceId);
    return defaultServiceId;
  }

  return serviceId;
};

export const getMeetingServiceId = async ({
  clockodo,
}: ClockodoProp): Promise<number> => {
  const serviceId = await storage.getItem(Storage.ServiceIdMeeting);

  if (typeof serviceId !== "number") {
    console.warn(
      "No service ID for meetings configured. Please choose a default."
    );
    const defaultServiceId = await selectDefaultService({ clockodo });
    await storage.setItem(Storage.ServiceIdMeeting, defaultServiceId);
    return defaultServiceId;
  }

  return serviceId;
};

export const getMeetingPresets = async () => {
  const presets = await storage.getItem(Storage.MeetingPresets);

  if (presets === undefined || presets.length === 0) {
    console.warn("No meeting presets found. Please add some.");
    const presets = await selectPresets();
    await storage.setItem(Storage.MeetingPresets, presets);
    return presets;
  }

  return presets;
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

const selectPresets = async () => {
  const { text } = await inquirer.prompt([
    {
      type: "input",
      name: "text",
      default: "Daily,Refinement,Sprint",
      message: "Enter your desired presets separated by a comma",
    },
  ]);

  return text.split(",");
};
