export type CsvGoal = {
  id: string;
  name: string;
  direction: 'up' | 'down';
  unit: string;
  start_value: number;
  target_value: number;
};

export type CsvEntry = {
  goal_id: string;
  value: number;
  note: string | null;
  recorded_at: string;
};

const HEADER = ['meta', 'tipo', 'unidad', 'inicial', 'objetivo', 'fecha', 'valor', 'nota'];

function cell(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const row = (values: (string | number)[]) => values.map(cell).join(',');

/** Una fila por registro; las metas sin registros salen con fecha y valor vacíos. */
export function buildCsv(goals: readonly CsvGoal[], entries: readonly CsvEntry[]): string {
  const lines = [row(HEADER)];
  for (const goal of goals) {
    const base = [
      goal.name,
      goal.direction === 'down' ? 'Decreciente' : 'Creciente',
      goal.unit,
      goal.start_value,
      goal.target_value,
    ];
    const own = entries.filter((entry) => entry.goal_id === goal.id);
    if (own.length === 0) lines.push(row([...base, '', '', '']));
    for (const entry of own) lines.push(row([...base, entry.recorded_at, entry.value, entry.note ?? '']));
  }
  return lines.join('\r\n') + '\r\n';
}
