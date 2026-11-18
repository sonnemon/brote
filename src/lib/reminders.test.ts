import { describe, expect, it } from 'vitest';

import {
  defaultReminder,
  MAX_SCHEDULED,
  notificationRoute,
  parseTime,
  planReminders,
  reminderFromColumns,
  serializeTime,
  type ReminderGoal,
} from './reminders';

const ID = '44444444-4444-4444-8444-444444444444';
const goal: ReminderGoal = {
  id: ID,
  name: 'Bajar de peso',
  unit: 'kg',
  target_value: 72,
  current: 78.4,
  completed_at: null,
  archived_at: null,
  reminder_weekday: 1,
  reminder_hour: 7,
  reminder_minute: 30,
};
const on = { plus: true, enabled: true };

describe('planReminders', () => {
  it('convierte el día al formato del trigger', () => {
    const [r] = planReminders([goal], on);
    expect(r).toMatchObject({ goalId: ID, title: 'Bajar de peso', triggerWeekday: 2, hour: 7, minute: 30 });
    expect(planReminders([{ ...goal, reminder_weekday: 0 }], on)[0].triggerWeekday).toBe(1);
    expect(planReminders([{ ...goal, reminder_weekday: 6 }], on)[0].triggerWeekday).toBe(7);
  });
  it('sin día programa uno diario', () => {
    expect(planReminders([{ ...goal, reminder_weekday: null }], on)[0].triggerWeekday).toBeNull();
  });
  it('incluye el avance actual en el texto', () => {
    expect(planReminders([goal], on)[0].body).toBe('Registra tu avance. Vas en 78.4 de 72 kg.');
  });
  it('sin Plus o apagado no programa nada', () => {
    expect(planReminders([goal], { plus: false, enabled: true })).toEqual([]);
    expect(planReminders([goal], { plus: true, enabled: false })).toEqual([]);
  });
  it('omite metas sin recordatorio, cumplidas o archivadas', () => {
    expect(planReminders([{ ...goal, reminder_hour: null }], on)).toEqual([]);
    expect(planReminders([{ ...goal, completed_at: 'x' }], on)).toEqual([]);
    expect(planReminders([{ ...goal, archived_at: 'x' }], on)).toEqual([]);
  });
  it('respeta el límite de iOS', () => {
    expect(planReminders(Array.from({ length: 80 }, () => goal), on)).toHaveLength(MAX_SCHEDULED);
  });
});

describe('configuración', () => {
  const sunday = new Date(2026, 10, 8, 12);
  const time = { hour: 7, minute: 0 };
  it('por defecto usa la frecuencia de la meta', () => {
    expect(defaultReminder('daily', sunday, time).weekday).toBeNull();
    expect(defaultReminder('weekly', sunday, time).weekday).toBe(0);
  });
  it('lee las columnas', () => {
    expect(reminderFromColumns({ reminder_weekday: null, reminder_hour: null, reminder_minute: null })).toBeNull();
    expect(reminderFromColumns({ reminder_weekday: 2, reminder_hour: 9, reminder_minute: null })).toEqual({
      weekday: 2,
      hour: 9,
      minute: 0,
    });
  });
  it('serializa la hora ida y vuelta', () => {
    expect(serializeTime({ hour: 7, minute: 5 })).toBe('07:05');
    expect(parseTime('21:30')).toEqual({ hour: 21, minute: 30 });
    expect(parseTime(null)).toEqual(time);
    expect(parseTime('basura')).toEqual(time);
  });
});

describe('notificationRoute', () => {
  it('solo acepta ids de meta', () => {
    expect(notificationRoute(ID)).toBe(`/goal/${ID}`);
    expect(notificationRoute('../settings')).toBeNull();
    expect(notificationRoute(undefined)).toBeNull();
  });
});
