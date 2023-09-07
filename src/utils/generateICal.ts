import { v4 as uuidv4 } from 'uuid';

export default function generateICal(name: string, teacher: string, location: string, dateStart: string, dateEnd: string) {
    return `BEGIN:VCALENDAR
    VERSION:2.0
    PRODID:-//Untis Subscription.//iCal 1.0//EN
    BEGIN:VEVENT
    UID:${uuidv4()}
    DTSTAMP:${new Date().toISOString().replace(/[-:.]/g, '').replace(/T/g, '').replace(/Z/g, '')}
    DTSTART:${dateStart}
    DTEND:${dateEnd}
    SUMMARY:${name} (${teacher})
    LOCATION:${location}
    DESCRIPTION:Class '${name}' with ${teacher} in ${location}.
    END:VEVENT
    END:VCALENDAR`;
}