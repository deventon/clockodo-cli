import { ClockodoProp } from "../types/clockodo";
import inquirer from "inquirer";
import { DateTime } from "luxon";
import { AbsenceType } from "clockodo";
import { confirm, input } from "@inquirer/prompts";

export const absence = async ({ clockodo }: ClockodoProp) => {
  const today = DateTime.now().toISODate();

  let sickNote = undefined;
  let countHours = undefined;
  let halfDay = undefined;

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
    const hasSickNote = await confirm({
      default: false,
      message: "Do you have a sick note?",
    });

    sickNote = Number(hasSickNote);
  }

  if (type === AbsenceType.ReductionOfOvertime) {
    countHours = await input({
      default: "0",
      message: "Enter the amount of hours",
    });
  }

  if (type !== AbsenceType.ReductionOfOvertime && dateSince === dateUntil) {
    const isHalfDay = await confirm({
      default: false,
      message: "Add this as a half day absence?",
    });

    halfDay = Number(isHalfDay);
  }

  await clockodo.addAbsence({
    type,
    dateSince,
    dateUntil,
    halfDay,
    sickNote,
    countHours,
  });
};
