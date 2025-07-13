import chalk from "chalk";
import ora from "ora";
import { DateTime, Duration } from "luxon";
import { ClockodoProp } from "../types/clockodo";

export const logWorkTimes = async ({ clockodo }: ClockodoProp) => {
  const spinner = ora(`Fetching work times...`).start();
  const startOfToday = DateTime.local({ zone: "Europe/Berlin" })
    .startOf("day")
    .startOf("second")
    .toUTC()
    .toISO({ suppressMilliseconds: true });
  const endOfToday = DateTime.local({ zone: "Europe/Berlin" })
    .endOf("day")
    .startOf("second")
    .toUTC()
    .toISO({ suppressMilliseconds: true });

  const data = await clockodo.getEntries({
    timeSince: startOfToday,
    timeUntil: endOfToday,
  });

  const { running } = await clockodo.getClock();
  let runningDuration = undefined;

  if (running) {
    runningDuration = DateTime.fromISO(running.timeSince).diffNow().negate();
  }

  const totalDuration = data.entries
    .filter((e) => "duration" in e)
    .reduce((acc, { duration }) => (acc += duration), 0);

  const duration = Duration.fromMillis(totalDuration * 1000)
    .plus(runningDuration ?? 0)
    .toFormat("hh:mm");
  if (!data.entries) {
    spinner.fail(chalk.red("No running entry.\n"));
    return;
  }
  spinner.succeed(chalk.green(`You have worked ${duration}h today.`));
  console.log(); // Add newline at the end
};

export const logRunningEntry = async ({ clockodo }: ClockodoProp) => {
  console.log(); // Add newline at the beginning
  const spinner = ora(`Fetching running entry...`).start();
  const { running } = await clockodo.getClock();

  if (!running) {
    spinner.info("Welcome to Clockodo! You are currently not tracking time.");
    return;
  }

  const { customer } = await clockodo.getCustomer({ id: running.customersId });

  const duration = DateTime.fromISO(running.timeSince)
    .diffNow()
    .negate()
    .toFormat("hh:mm");

  spinner.succeed(chalk.green(`Welcome to Clockodo!`));
  console.info(
    chalk.magenta(
      `You are currently tracking ${
        running.text ? `'${running.text}'` : "without description"
      } on ${customer.name} for ${duration}h.`
    )
  );

  return running;
};
