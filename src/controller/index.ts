import { Request, Response, NextFunction } from 'express';
import axios, { AxiosResponse } from 'axios';
import { Lesson, WebUntis } from 'webuntis';
import * as ics from 'ics';
import dotenv from 'dotenv';

dotenv.config();

const request = async (req: Request, res: Response, next: NextFunction) => {
  /* Fetch something const result: AxiosResponse = await axios.get(
    'https://jsonplaceholder.typicode.com/posts',
  ); */

  const id: string = req.params.userId;
  const token: string = req.params.token;

  if (token.trim() !== '' && token !== process.env[`USER_${id}_TOKEN`]) {
    return res.status(500).json({
      message: "Your token is not correct.",
    });
  }

  const school: string | undefined = process.env[`USER_${id}_SCHOOL`];
  const username: string | undefined = process.env[`USER_${id}_USERNAME`];
  const password: string | undefined = process.env[`USER_${id}_PASSWORD`];
  const baseUrl: string | undefined = process.env[`USER_${id}_BASEURL`];

  if (!school || !username || !password || !baseUrl) {
    return res.status(500).json({
      message: "Internal error with your data.",
    });
  }

  try {
    const untis = new WebUntis(school, username, password, baseUrl);

    await untis.login();

    let timetable: Lesson[] = new Array<Lesson>();

    if (timetable === undefined) {
      return res.status(204).json({
        message: "Timetable is empty.",
      });
    }

    const schoolyearEnd = (await untis.getLatestSchoolyear()).endDate;
    const currentDate = new Date();

    for (let i: Date = new Date(); i <= schoolyearEnd; currentDate.setDate(currentDate.getDate() + 1)) {
      try {
        let currentTimetable = await untis.getOwnTimetableFor(new Date(currentDate.setDate(currentDate.getDate() + 1)));

        for (let j: number = 0; j < currentTimetable.length; j++) {
          timetable.push(currentTimetable[j]);
        }
      } catch (error) {
        break;
      }
    }

    let events: ics.EventAttributes[] = new Array<ics.EventAttributes>();
    
    for (let i: number = 0; i < timetable.length; i++) {
      let startTimeHour: number = timetable[i].startTime.toString().length === 3 ? 
        parseInt(timetable[i].startTime.toString().substring(0, 1)) : 
        parseInt(timetable[i].startTime.toString().substring(0, 2));

      let startTimeMinutes: number = timetable[i].startTime.toString().length === 3 ? 
        parseInt(timetable[i].startTime.toString().substring(2, 3)) : 
        parseInt(timetable[i].startTime.toString().substring(2, 4));

      let endTimeHour: number = timetable[i].endTime.toString().length === 3 ? 
        parseInt(timetable[i].endTime.toString().substring(0, 1)) : 
        parseInt(timetable[i].endTime.toString().substring(0, 2));

      let endTimeMinutes: number = timetable[i].endTime.toString().length === 3 ? 
        parseInt(timetable[i].endTime.toString().substring(2, 3)) : 
        parseInt(timetable[i].endTime.toString().substring(2, 4));

      events.push({
        title: `${timetable[i].kl[0].name} (${timetable[i].te[0].longname})`,
        location: timetable[i].ro[0].name,
        description: `${timetable[i].activityType} (${timetable[i].kl[0].name}): ${timetable[i].kl[0].longname} w/ ${timetable[i].te[0].longname} @ ${timetable[i].ro[0].name}`,
        start: [
          parseInt(timetable[i].date.toString().substring(0, 4)), // Year
          parseInt(timetable[i].date.toString().substring(4, 6)), // Month
          parseInt(timetable[i].date.toString().substring(6, 8)), // Day
          startTimeHour, // Hours
          startTimeMinutes, // Minutes
        ],
        end: [
          parseInt(timetable[i].date.toString().substring(0, 4)), // Year
          parseInt(timetable[i].date.toString().substring(4, 6)), // Month
          parseInt(timetable[i].date.toString().substring(6, 8)), // Day
          endTimeHour, // Hours
          endTimeMinutes, // Minutes
        ],
      });
    }

    const { error, value } = ics.createEvents(events);
    
    if (error) {
      console.log(error);
      return;
    }

    res.setHeader('Content-Type', 'text/calendar');
    return res.send(value);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "An unexpected error occurred",
    });
  }
};

export default {
  request
};
