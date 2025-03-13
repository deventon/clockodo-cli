import { ClockodoProp } from "../types/clockodo";
import inquirer from "inquirer";
import { DateTime } from "luxon";
import { AbsenceType } from "clockodo";

export const absence = async ({ clockodo }: ClockodoProp) => {
  const today = DateTime.now().toISODate();

  let sick_note = undefined;
  let count_hours = undefined;
  let half_day = undefined;

  const { type }: { type: AbsenceType } = await inquirer.prompt([
    {
      type: "list",
      name: "type",
      message: "What kind of absence do you want to add?",
      choices: [
        { name: "Home office", value: AbsenceType.HomeOffice },
        { name: "Sick", value: AbsenceType.SickDay },
        { name: "Sick (child)", value: AbsenceType.SickDayOfChild },
        { name: "Holiday", value: AbsenceType.RegularHoliday },
        { name: "Overtime", value: AbsenceType.ReductionOfOvertime },
      ],
    },
  ]);

  const { dateSince } = await inquirer.prompt([
    {
      type: "input",
      name: "dateSince",
      default: today,
      message: "Enter the start date of the absence",
    },
  ]);

  const { dateUntil } = await inquirer.prompt([
    {
      type: "input",
      name: "dateUntil",
      default: dateSince,
      message: "Enter the end date of the absence",
    },
  ]);

  if (type === AbsenceType.SickDay || type === AbsenceType.SickDayOfChild) {
    const { hasSickNote } = await inquirer.prompt([
      {
        type: "confirm",
        name: "hasSickNote",
        default: false,
        message: "Do you have a sick note?",
      },
    ]);
    sick_note = Number(hasSickNote);
  }

  if (type === AbsenceType.ReductionOfOvertime) {
    const { countHours } = await inquirer.prompt([
      {
        type: "input",
        name: "countHours",
        default: "0",
        message: "Enter the amount of hours",
      },
    ]);
    count_hours = countHours;
  }

  if (type !== AbsenceType.ReductionOfOvertime && dateSince === dateUntil) {
    const { halfDay } = await inquirer.prompt([
      {
        type: "confirm",
        name: "halfDay",
        default: false,
        message: "Half day?",
      },
    ]);

    half_day = Number(halfDay);
  }

  await clockodo.addAbsence({
    type,
    dateSince,
    dateUntil,
    half_day,
    sick_note,
    count_hours,
  });
};
