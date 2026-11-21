import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { strings } from '@/i18n';
import { buildCsv } from '@/lib/csv';

import { getAllGoals } from './store';

/** Escribe el CSV en caché y abre la hoja de compartir. El BOM hace que Excel respete las tildes. */
export async function exportCsv() {
  const goals = getAllGoals();
  const csv = '﻿' + buildCsv(goals, goals.flatMap((goal) => goal.entries));
  const file = new File(Paths.cache, strings().csv.file);
  file.create({ overwrite: true });
  file.write(csv);
  await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
}
