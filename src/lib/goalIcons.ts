import { getLang } from '../i18n';

/**
 * Catálogo de iconos de metas. La clave es el nombre del icono en Lucide (kebab-case) y es lo que
 * se guarda en la columna `icon`. Este archivo no importa React Native para poder testearlo.
 */
export type GoalIconCategory = { id: string; label: string; labelEn: string };

export type GoalIconDef = {
  key: string;
  label: string;
  category: string;
  /** Palabras (sin tildes, minúsculas) que, si aparecen en el nombre de la meta, sugieren este icono. */
  keywords: string[];
};

export const ICON_CATEGORIES: GoalIconCategory[] = [
  { id: 'health', label: 'Salud', labelEn: 'Health' },
  { id: 'sport', label: 'Deporte', labelEn: 'Sports' },
  { id: 'money', label: 'Dinero', labelEn: 'Money' },
  { id: 'learn', label: 'Aprender', labelEn: 'Learning' },
  { id: 'travel', label: 'Viajes', labelEn: 'Travel' },
  { id: 'home', label: 'Hogar', labelEn: 'Home' },
  { id: 'work', label: 'Trabajo', labelEn: 'Work' },
  { id: 'hobby', label: 'Hobbies', labelEn: 'Hobbies' },
  { id: 'habits', label: 'Hábitos', labelEn: 'Habits' },
  { id: 'general', label: 'General', labelEn: 'General' },
];

/** Palabras en inglés por icono; se suman a las de español para que el nombre funcione en ambos idiomas. */
const EN: Record<string, string[]> = {
  'heart-pulse': ['health', 'heart', 'blood', 'pressure', 'cardio', 'pulse'],
  apple: ['fruit', 'eat', 'healthy', 'nutrition'],
  salad: ['diet', 'salad', 'veggies', 'vegetables', 'vegan', 'vegetarian', 'food', 'meals'],
  carrot: ['vegetable', 'veggie'],
  'glass-water': ['water', 'hydrate', 'drink', 'glasses', 'liters'],
  droplet: ['water', 'hydration'],
  'bed-double': ['sleep', 'rest', 'nap', 'bedtime'],
  brain: ['mind', 'mental', 'meditate', 'meditation', 'therapy', 'anxiety', 'mindfulness'],
  pill: ['medicine', 'vitamin', 'vitamins', 'pills', 'treatment'],
  stethoscope: ['doctor', 'checkup', 'medical'],
  smile: ['happy', 'happiness', 'mood', 'gratitude'],
  dumbbell: ['weight', 'lose', 'diet', 'fat', 'pounds', 'lbs', 'slim', 'gym', 'workout', 'weights', 'lift', 'lifting', 'muscle', 'strength', 'train', 'training', 'exercise', 'fitness'],
  footprints: ['steps', 'walk', 'walking', 'hike'],
  'person-standing': ['run', 'running', 'jog', 'jogging', 'posture'],
  bike: ['bike', 'bicycle', 'cycling', 'cycle', 'ride'],
  waves: ['swim', 'swimming', 'pool', 'surf', 'ocean', 'sea'],
  mountain: ['mountain', 'climb', 'climbing', 'hiking', 'trek', 'summit'],
  volleyball: ['volleyball', 'soccer', 'football', 'ball', 'match', 'sport', 'sports'],
  activity: ['activity', 'calories', 'movement', 'move'],
  timer: ['time', 'record', 'minutes', 'stopwatch', 'pace'],
  medal: ['medal', 'marathon', 'competition', 'race', 'tournament'],
  trophy: ['win', 'champion', 'trophy', 'achievement'],
  'piggy-bank': ['save', 'saving', 'savings', 'fund', 'emergency'],
  wallet: ['money', 'cash', 'spend', 'spending', 'expenses', 'budget'],
  banknote: ['salary', 'income', 'paycheck', 'bills'],
  coins: ['coins', 'savings', 'change'],
  'credit-card': ['debt', 'debts', 'card', 'credit', 'pay', 'payoff', 'loan'],
  'hand-coins': ['loan', 'repay', 'payback', 'donate', 'lend'],
  landmark: ['bank', 'mortgage', 'invest', 'investment'],
  'trending-up': ['invest', 'investing', 'stocks', 'grow', 'growth', 'revenue', 'sales', 'income'],
  receipt: ['bills', 'invoices', 'utilities'],
  gem: ['jewel', 'ring', 'luxury', 'diamond'],
  'book-open': ['read', 'reading', 'book', 'books', 'pages', 'novel'],
  library: ['library', 'study', 'books'],
  'graduation-cap': ['study', 'college', 'university', 'degree', 'course', 'thesis', 'masters', 'exam', 'school', 'graduate'],
  languages: ['english', 'spanish', 'language', 'french', 'german', 'portuguese', 'japanese', 'chinese', 'italian', 'words', 'duolingo'],
  'notebook-pen': ['write', 'journal', 'diary', 'notes'],
  'pen-line': ['write', 'writing', 'blog', 'article', 'poem', 'essay'],
  lightbulb: ['idea', 'learn', 'project', 'startup'],
  'code-xml': ['code', 'coding', 'programming', 'software', 'developer', 'web', 'app'],
  plane: ['trip', 'travel', 'flight', 'vacation', 'holiday', 'abroad', 'europe', 'japan'],
  luggage: ['luggage', 'suitcase', 'trip', 'vacation', 'move', 'moving'],
  backpack: ['backpack', 'backpacking'],
  map: ['map', 'explore', 'visit', 'tour'],
  route: ['miles', 'distance', 'route', 'kilometers'],
  globe: ['world', 'countries', 'international', 'global'],
  tent: ['camping', 'camp', 'tent'],
  car: ['car', 'drive', 'driving', 'license'],
  bus: ['bus', 'commute', 'transport'],
  sailboat: ['boat', 'sail', 'sailing', 'cruise', 'beach'],
  house: ['house', 'home', 'apartment', 'rent', 'downpayment'],
  'building-2': ['building', 'office', 'store'],
  hammer: ['remodel', 'repair', 'fix', 'build', 'renovate', 'diy'],
  baby: ['baby', 'kid', 'kids', 'child', 'pregnancy'],
  users: ['family', 'friends', 'people', 'partner', 'wedding', 'social'],
  heart: ['love', 'partner', 'wedding', 'anniversary', 'date', 'relationship'],
  dog: ['dog', 'puppy', 'pet', 'walk'],
  cat: ['cat', 'kitten', 'pet'],
  sprout: ['plants', 'garden', 'gardening', 'grow', 'seeds'],
  'chef-hat': ['cook', 'cooking', 'recipe', 'recipes', 'chef', 'bake', 'baking'],
  'shopping-cart': ['shopping', 'groceries', 'buy', 'market'],
  briefcase: ['work', 'job', 'career', 'business', 'clients', 'office', 'promotion'],
  laptop: ['laptop', 'computer', 'freelance', 'remote'],
  target: ['goal', 'target', 'sales', 'kpi', 'quota', 'objective'],
  rocket: ['startup', 'launch', 'ship', 'business', 'side', 'hustle'],
  'calendar-check': ['days', 'streak', 'calendar', 'weeks', 'schedule', 'daily'],
  music: ['music', 'song', 'songs', 'sing', 'singing'],
  guitar: ['guitar', 'play', 'instrument', 'band', 'piano'],
  headphones: ['podcast', 'listen', 'audiobook', 'audiobooks'],
  mic: ['sing', 'podcast', 'speak', 'speaking', 'public'],
  palette: ['paint', 'painting', 'art', 'draw', 'drawing', 'design'],
  brush: ['brush', 'watercolor', 'illustrate', 'illustration'],
  camera: ['photo', 'photos', 'photography', 'camera', 'pictures'],
  film: ['movies', 'movie', 'film', 'cinema', 'series', 'video', 'videos', 'youtube'],
  'gamepad-2': ['game', 'games', 'videogames', 'gaming', 'console'],
  fish: ['fishing', 'fish', 'aquarium'],
  'cigarette-off': ['smoke', 'smoking', 'cigarettes', 'tobacco', 'vape', 'vaping', 'quit'],
  'wine-off': ['alcohol', 'drink', 'drinking', 'beer', 'wine', 'sober', 'sobriety'],
  'candy-off': ['sugar', 'sweets', 'candy', 'soda', 'snacks'],
  coffee: ['coffee', 'caffeine', 'tea'],
  smartphone: ['phone', 'screen', 'screentime', 'social', 'instagram', 'tiktok', 'scrolling'],
  tv: ['television', 'netflix', 'binge'],
  sun: ['morning', 'early', 'sunrise', 'sun'],
  'alarm-clock': ['wake', 'early', 'alarm'],
  recycle: ['recycle', 'recycling', 'plastic', 'waste', 'eco', 'green'],
  'hand-heart': ['volunteer', 'volunteering', 'help', 'donate', 'charity'],
  flag: ['finish', 'goal', 'reach'],
  sparkles: ['new', 'change', 'magic', 'glow'],
  zap: ['energy', 'fast', 'productivity', 'productive'],
  flame: ['streak', 'motivation', 'burn', 'calories'],
  clock: ['hours', 'time'],
  hourglass: ['patience', 'countdown'],
  percent: ['percent', 'percentage', 'progress'],
  ruler: ['measure', 'waist', 'inches', 'height'],
  'circle-check': ['complete', 'finish', 'tasks', 'todo', 'habits'],
  gift: ['gift', 'gifts', 'christmas', 'birthday', 'present'],
  trees: ['nature', 'trees', 'forest', 'outdoors'],
};

const I = (key: string, label: string, category: string, keywords: string[] = []): GoalIconDef => ({
  key,
  label,
  category,
  keywords: [...new Set([...keywords, ...(EN[key] ?? [])])],
});

export const GOAL_ICONS: GoalIconDef[] = [
  // Salud
  I('heart-pulse', 'Corazón', 'health', ['salud', 'presion', 'cardio', 'pulso', 'corazon']),
  I('apple', 'Manzana', 'health', ['fruta', 'comer', 'sano', 'saludable', 'nutricion']),
  I('salad', 'Ensalada', 'health', ['dieta', 'ensalada', 'verdura', 'vegano', 'vegetariano', 'comida']),
  I('carrot', 'Zanahoria', 'health', ['verdura', 'vegetal']),
  I('glass-water', 'Vaso de agua', 'health', ['agua', 'hidratar', 'tomar', 'vasos', 'litros']),
  I('droplet', 'Gota', 'health', ['agua', 'hidratacion', 'litros']),
  I('bed-double', 'Cama', 'health', ['dormir', 'sueno', 'descanso', 'descansar', 'siesta']),
  I('brain', 'Cerebro', 'health', ['mente', 'mental', 'meditar', 'meditacion', 'terapia', 'ansiedad']),
  I('pill', 'Pastilla', 'health', ['medicina', 'vitamina', 'pastilla', 'tratamiento']),
  I('stethoscope', 'Estetoscopio', 'health', ['medico', 'doctor', 'chequeo']),
  I('smile', 'Sonrisa', 'health', ['feliz', 'felicidad', 'animo', 'gratitud']),
  // Deporte
  I('dumbbell', 'Pesas', 'sport', ['peso', 'bajar', 'adelgazar', 'kilos', 'kg', 'dieta', 'grasa', 'gym', 'gimnasio', 'pesas', 'musculo', 'fuerza', 'entrenar', 'ejercicio']),
  I('footprints', 'Pasos', 'sport', ['pasos', 'caminar', 'caminata', 'andar']),
  I('person-standing', 'Persona', 'sport', ['correr', 'running', 'trotar', 'postura']),
  I('bike', 'Bicicleta', 'sport', ['bici', 'bicicleta', 'ciclismo', 'pedalear', 'spinning']),
  I('waves', 'Olas', 'sport', ['nadar', 'natacion', 'piscina', 'surf', 'mar']),
  I('mountain', 'Montaña', 'sport', ['montana', 'escalar', 'trekking', 'senderismo', 'cerro', 'subir']),
  I('volleyball', 'Pelota', 'sport', ['voley', 'futbol', 'pelota', 'partido', 'deporte']),
  I('activity', 'Actividad', 'sport', ['actividad', 'cardio', 'calorias', 'movimiento']),
  I('timer', 'Cronómetro', 'sport', ['tiempo', 'record', 'marca', 'minutos', 'cronometro']),
  I('medal', 'Medalla', 'sport', ['medalla', 'maraton', 'competencia', 'carrera', 'torneo']),
  I('trophy', 'Trofeo', 'sport', ['ganar', 'campeon', 'trofeo', 'logro']),
  // Dinero
  I('piggy-bank', 'Alcancía', 'money', ['ahorro', 'ahorrar', 'alcancia', 'guardar', 'fondo']),
  I('wallet', 'Billetera', 'money', ['dinero', 'plata', 'soles', 'gasto', 'gastos', 'presupuesto']),
  I('banknote', 'Billete', 'money', ['efectivo', 'sueldo', 'salario', 'billete']),
  I('coins', 'Monedas', 'money', ['monedas', 'ahorro', 'sencillo']),
  I('credit-card', 'Tarjeta', 'money', ['deuda', 'deudas', 'tarjeta', 'credito', 'pagar', 'cuotas']),
  I('hand-coins', 'Préstamo', 'money', ['prestamo', 'pagar', 'devolver', 'donar']),
  I('landmark', 'Banco', 'money', ['banco', 'hipoteca', 'inversion', 'invertir']),
  I('trending-up', 'Crecimiento', 'money', ['invertir', 'inversion', 'acciones', 'crecer', 'ingresos', 'ventas']),
  I('receipt', 'Recibo', 'money', ['cuentas', 'recibos', 'facturas', 'servicios']),
  I('gem', 'Gema', 'money', ['joya', 'anillo', 'lujo']),
  // Aprender
  I('book-open', 'Libro', 'learn', ['leer', 'lectura', 'libro', 'libros', 'paginas', 'novela']),
  I('library', 'Biblioteca', 'learn', ['biblioteca', 'estudiar', 'libros']),
  I('graduation-cap', 'Graduación', 'learn', ['estudiar', 'universidad', 'carrera', 'curso', 'tesis', 'maestria', 'titulo', 'examen']),
  I('languages', 'Idiomas', 'learn', ['ingles', 'idioma', 'frances', 'aleman', 'portugues', 'japones', 'chino', 'italiano', 'palabras']),
  I('notebook-pen', 'Cuaderno', 'learn', ['escribir', 'diario', 'apuntes', 'notas', 'journal']),
  I('pen-line', 'Pluma', 'learn', ['escribir', 'blog', 'articulo', 'redactar', 'poema']),
  I('lightbulb', 'Idea', 'learn', ['idea', 'aprender', 'proyecto', 'emprender', 'emprendimiento']),
  I('code-xml', 'Código', 'learn', ['programar', 'programacion', 'codigo', 'app', 'software', 'web']),
  // Viajes
  I('plane', 'Avión', 'travel', ['viaje', 'viajar', 'vuelo', 'avion', 'vacaciones', 'europa', 'extranjero']),
  I('luggage', 'Maleta', 'travel', ['maleta', 'viaje', 'vacaciones', 'mudanza']),
  I('backpack', 'Mochila', 'travel', ['mochila', 'mochilear', 'cusco', 'machu', 'picchu']),
  I('map', 'Mapa', 'travel', ['mapa', 'recorrer', 'conocer', 'ruta']),
  I('route', 'Ruta', 'travel', ['km', 'kilometros', 'distancia', 'ruta', 'recorrido']),
  I('globe', 'Mundo', 'travel', ['mundo', 'paises', 'internacional']),
  I('tent', 'Carpa', 'travel', ['camping', 'acampar', 'carpa']),
  I('car', 'Auto', 'travel', ['auto', 'carro', 'coche', 'manejar', 'brevete', 'licencia']),
  I('bus', 'Bus', 'travel', ['bus', 'transporte']),
  I('sailboat', 'Velero', 'travel', ['barco', 'velero', 'crucero', 'playa']),
  // Hogar
  I('house', 'Casa', 'home', ['casa', 'depa', 'departamento', 'hogar', 'vivienda', 'alquiler', 'inicial']),
  I('building-2', 'Edificio', 'home', ['edificio', 'oficina', 'local']),
  I('hammer', 'Martillo', 'home', ['remodelar', 'arreglar', 'construir', 'obra']),
  I('baby', 'Bebé', 'home', ['bebe', 'hijo', 'hija', 'embarazo', 'nino']),
  I('users', 'Familia', 'home', ['familia', 'amigos', 'personas', 'pareja', 'boda']),
  I('heart', 'Corazón', 'home', ['amor', 'pareja', 'boda', 'aniversario', 'cita']),
  I('dog', 'Perro', 'home', ['perro', 'mascota', 'pasear']),
  I('cat', 'Gato', 'home', ['gato', 'mascota']),
  I('sprout', 'Brote', 'home', ['plantas', 'jardin', 'huerto', 'sembrar', 'crecer']),
  I('chef-hat', 'Cocina', 'home', ['cocinar', 'cocina', 'receta', 'recetas', 'chef']),
  I('shopping-cart', 'Compras', 'home', ['compras', 'mercado', 'supermercado', 'comprar']),
  // Trabajo
  I('briefcase', 'Maletín', 'work', ['trabajo', 'chamba', 'empleo', 'negocio', 'clientes', 'oficina']),
  I('laptop', 'Laptop', 'work', ['laptop', 'computadora', 'freelance', 'remoto']),
  I('target', 'Objetivo', 'work', ['objetivo', 'meta', 'ventas', 'kpi', 'cuota']),
  I('rocket', 'Cohete', 'work', ['startup', 'lanzar', 'lanzamiento', 'emprender', 'negocio']),
  I('calendar-check', 'Calendario', 'work', ['dias', 'racha', 'calendario', 'semanas', 'agenda']),
  // Hobbies
  I('music', 'Música', 'hobby', ['musica', 'cancion', 'canciones', 'cantar']),
  I('guitar', 'Guitarra', 'hobby', ['guitarra', 'tocar', 'instrumento', 'banda']),
  I('headphones', 'Audífonos', 'hobby', ['podcast', 'escuchar', 'audiolibro']),
  I('mic', 'Micrófono', 'hobby', ['cantar', 'podcast', 'hablar', 'oratoria']),
  I('palette', 'Paleta', 'hobby', ['pintar', 'pintura', 'arte', 'dibujar', 'dibujo', 'diseno']),
  I('brush', 'Pincel', 'hobby', ['pincel', 'acuarela', 'ilustrar']),
  I('camera', 'Cámara', 'hobby', ['fotos', 'foto', 'fotografia', 'camara']),
  I('film', 'Película', 'hobby', ['peliculas', 'pelicula', 'cine', 'series', 'video', 'videos']),
  I('gamepad-2', 'Videojuegos', 'hobby', ['juego', 'juegos', 'videojuegos', 'gaming', 'consola']),
  I('fish', 'Pez', 'hobby', ['pescar', 'pesca', 'acuario']),
  // Hábitos
  I('cigarette-off', 'Sin fumar', 'habits', ['fumar', 'cigarro', 'cigarrillos', 'tabaco', 'vape']),
  I('wine-off', 'Sin alcohol', 'habits', ['alcohol', 'tomar', 'cerveza', 'trago', 'sobrio']),
  I('candy-off', 'Sin azúcar', 'habits', ['azucar', 'dulces', 'golosinas', 'gaseosa']),
  I('coffee', 'Café', 'habits', ['cafe', 'cafeina', 'te']),
  I('smartphone', 'Celular', 'habits', ['celular', 'pantalla', 'redes', 'instagram', 'tiktok', 'telefono']),
  I('tv', 'Televisión', 'habits', ['tele', 'television', 'netflix']),
  I('sun', 'Sol', 'habits', ['madrugar', 'manana', 'temprano', 'sol']),
  I('alarm-clock', 'Despertador', 'habits', ['despertar', 'madrugar', 'levantarme', 'alarma']),
  I('recycle', 'Reciclar', 'habits', ['reciclar', 'plastico', 'basura', 'ecologico']),
  I('hand-heart', 'Ayudar', 'habits', ['voluntariado', 'ayudar', 'donar', 'caridad']),
  // General
  I('star', 'Estrella', 'general', []),
  I('flag', 'Bandera', 'general', ['meta', 'llegar', 'final']),
  I('sparkles', 'Brillos', 'general', ['nuevo', 'cambio', 'magia']),
  I('zap', 'Rayo', 'general', ['energia', 'rapido', 'productividad']),
  I('flame', 'Fuego', 'general', ['racha', 'motivacion', 'quemar', 'calorias']),
  I('clock', 'Reloj', 'general', ['horas', 'tiempo']),
  I('hourglass', 'Reloj de arena', 'general', ['paciencia', 'cuenta', 'regresiva']),
  I('percent', 'Porcentaje', 'general', ['porcentaje', 'avance', 'progreso']),
  I('ruler', 'Regla', 'general', ['medir', 'cintura', 'centimetros', 'cm', 'altura']),
  I('circle-check', 'Check', 'general', ['completar', 'terminar', 'tareas', 'pendientes']),
  I('gift', 'Regalo', 'general', ['regalo', 'navidad', 'cumpleanos', 'sorpresa']),
  I('trees', 'Bosque', 'general', ['naturaleza', 'arboles', 'bosque', 'aire', 'libre']),
];

const BY_KEY = new Map(GOAL_ICONS.map((icon) => [icon.key, icon]));

/** Claves antiguas guardadas antes del catálogo de Lucide. */
const LEGACY: Record<string, string> = { book: 'book-open', scale: 'dumbbell' };

export const DEFAULT_ICON = 'star';

/** Devuelve una clave válida del catálogo (corrige claves antiguas o desconocidas). */
export function resolveIconKey(key: string): string {
  const resolved = LEGACY[key] ?? key;
  return BY_KEY.has(resolved) ? resolved : DEFAULT_ICON;
}

/** Nombre del icono en inglés: la clave de Lucide legible ("piggy-bank" → "Piggy bank"). */
function englishLabel(key: string): string {
  const words = key.replace(/-\d+$/, '').replace(/-off$/, ' off').replace(/-/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function iconLabel(key: string): string {
  const resolved = resolveIconKey(key);
  if (getLang() === 'en') return englishLabel(resolved);
  return BY_KEY.get(resolved)?.label ?? 'Icono';
}

export const categoryLabel = (category: GoalIconCategory) => (getLang() === 'en' ? category.labelEn : category.label);

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9%/ ]/g, ' ');
}

/** Opciones genéricas cuando el nombre todavía no da pistas. */
const GENERIC = ['star', 'target', 'flag', 'sparkles', 'trophy', 'rocket'];

/**
 * Sugerencias de icono según el nombre de la meta, de la más a la menos probable.
 * Coincidencias por palabra completa pesan más que por prefijo ("ahorr" → ahorro/ahorrar).
 */
export function suggestIcons(name: string, limit = 6): string[] {
  const words = normalize(name).split(/\s+/).filter((w) => w.length >= 2);
  const scores = new Map<string, number>();

  for (const icon of GOAL_ICONS) {
    let score = 0;
    for (const word of words) {
      for (const keyword of icon.keywords) {
        if (word === keyword) score += 3;
        else if (word.length >= 4 && (keyword.startsWith(word) || word.startsWith(keyword)) && keyword.length >= 4) {
          score += 1;
        }
      }
    }
    if (score > 0) scores.set(icon.key, score);
  }

  // Orden estable: puntaje y luego posición en el catálogo.
  const ranked = [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || GOAL_ICONS.indexOf(BY_KEY.get(a[0])!) - GOAL_ICONS.indexOf(BY_KEY.get(b[0])!))
    .map(([key]) => key);

  const result: string[] = [];
  for (const key of [...ranked, ...GENERIC]) {
    if (!result.includes(key)) result.push(key);
    if (result.length === limit) break;
  }
  return result;
}

/** Asegura que el icono actual aparezca entre las opciones (reemplaza la última). */
export function withCurrent(suggestions: string[], current: string): string[] {
  return suggestions.includes(current) ? suggestions : [current, ...suggestions.slice(0, -1)];
}

/** Filtra el catálogo por texto (etiqueta o palabra clave). */
export function searchIcons(query: string): GoalIconDef[] {
  const q = normalize(query).trim();
  if (!q) return GOAL_ICONS;
  return GOAL_ICONS.filter(
    (icon) =>
      normalize(icon.label).includes(q) || icon.key.replace(/-/g, ' ').includes(q) || icon.keywords.some((k) => k.startsWith(q)),
  );
}
