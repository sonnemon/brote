import { useWindowDimensions } from 'react-native';

/** Desde este ancho de ventana (iPad, también en horizontal o en pantalla dividida ancha) se usa el diseño ancho. */
export const WIDE_MIN_WIDTH = 700;

/** Ancho máximo de las pantallas con cuadrícula o columnas (inicio, detalle de meta). */
export const WIDE_CONTENT_WIDTH = 1100;

const GRID_GAP = 16;
const SIDE_PADDING = 20;

export type Layout = {
  /** Ventana ancha: iPad o pantalla dividida amplia. En iPhone siempre es false. */
  wide: boolean;
  /** Columnas de la cuadrícula de metas: 1 en iPhone, 2 en iPad vertical, 3 en iPad horizontal. */
  columns: number;
  /** Ancho de cada tarjeta de la cuadrícula. */
  cardWidth: number;
  gap: number;
};

export function useLayout(): Layout {
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_MIN_WIDTH;
  const columns = width >= 1200 ? 3 : wide ? 2 : 1;
  const inner = Math.min(width, WIDE_CONTENT_WIDTH) - SIDE_PADDING * 2;
  const gap = wide ? GRID_GAP : 12;
  return {
    wide,
    columns,
    gap,
    cardWidth: (inner - gap * (columns - 1)) / columns,
  };
}
