import { DateTime, Duration } from "luxon";
import { ClockodoProp } from "../types/clockodo";

interface StatusData {
  ticket: string;
  time: string;
}

/**
 * Extracts Jira ticket key from text using regex
 * Returns empty string if no ticket found
 */
const extractJiraTicket = (text: string | undefined): string => {
  if (!text) return "";
  const match = text.match(/\w+-\d+/);
  return match ? match[0] : "";
};

/**
 * Gets status data for machine-readable output
 * Returns current Jira ticket (if any) and total time worked today
 */
export const getStatusData = async ({
  clockodo,
}: ClockodoProp): Promise<StatusData> => {
  // Get running entry to extract ticket
  const { running } = await clockodo.getClock();
  const ticket = extractJiraTicket(running?.text);

  // Calculate total time worked today
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

  // Calculate running duration if exists
  let runningDuration = undefined;
  if (running) {
    runningDuration = DateTime.fromISO(running.timeSince).diffNow().negate();
  }

  // Sum all completed entry durations
  const totalDuration = data.entries
    .filter((e) => "duration" in e)
    .reduce((acc, { duration }) => (acc += duration), 0);

  // Combine durations and format
  const time = Duration.fromMillis(totalDuration * 1000)
    .plus(runningDuration ?? 0)
    .toFormat("hh:mm");

  return { ticket, time };
};

/**
 * Formats status data as space-separated output for p10k
 * Format: "{ticket} {time}" or " {time}" if no ticket
 */
export const formatStatusOutput = ({ ticket, time }: StatusData): string => {
  return `${ticket} ${time}`;
};
