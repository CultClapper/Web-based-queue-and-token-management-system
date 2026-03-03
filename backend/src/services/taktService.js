const { DateTime } = require('luxon');
const TaktConfig = require('../models/TaktConfig');
const Service = require('../models/Service');
const ScheduleSlot = require('../models/ScheduleSlot');

async function getCurrentConfig() {
  let config = await TaktConfig.findOne();
  if (!config) {
    config = await TaktConfig.create({
      taktTimeMinutes: 60,
      workingDayStart: '08:00',
      workingDayEnd: '18:00',
      timeZone: 'Asia/Kolkata'
    });
  }
  return config;
}

async function generateDaySlots(dateISO) {
  const config = await getCurrentConfig();
  const { taktTimeMinutes, workingDayStart, workingDayEnd, timeZone } = config;

  const base = DateTime.fromISO(dateISO, { zone: timeZone });
  const [sH, sM] = workingDayStart.split(':').map(Number);
  const [eH, eM] = workingDayEnd.split(':').map(Number);

  let cursor = base.set({ hour: sH, minute: sM, second: 0, millisecond: 0 });
  const endOfDay = base.set({ hour: eH, minute: eM, second: 0, millisecond: 0 });

  const services = await Service.find({ status: 'active' });
  const slots = [];

  let seq = 1;
  while (cursor < endOfDay) {
    const next = cursor.plus({ minutes: taktTimeMinutes });
    for (const service of services) {
      slots.push({
        service: service._id,
        startTime: cursor.toJSDate(),
        endTime: next.toJSDate(),
        taktSequence: seq
      });
    }
    cursor = next;
    seq += 1;
  }

  const created = await ScheduleSlot.insertMany(slots, { ordered: false }).catch(() => []);
  return created;
}

module.exports = { getCurrentConfig, generateDaySlots };



