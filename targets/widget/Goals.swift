import AppIntents
import SwiftUI
import UIKit
import WidgetKit

// MARK: - Datos

/// Espejo de `WidgetGoalItem` en src/lib/widgetData.ts. La app escribe la lista completa en el App Group.
struct GoalItem: Codable, Identifiable {
  let id: String
  let name: String
  let valueText: String
  let unit: String
  let targetNumberText: String
  let percent: Int
  let progress: Double
  let color: String
  let symbol: String
  let completed: Bool

  var tint: Color { Color(hexString: color) ?? Orbe.lilac }

  /// Un SF Symbol que no existe en esta versión de iOS no se pintaría: se cambia por la estrella.
  var safeSymbol: String { UIImage(systemName: symbol) != nil ? symbol : "star" }

  static func loadAll() -> [GoalItem] {
    guard
      let text = UserDefaults(suiteName: "group.dev.carloshmitma.brote")?.string(forKey: "widget_goals"),
      let data = text.data(using: .utf8)
    else { return [] }
    return (try? JSONDecoder().decode([GoalItem].self, from: data)) ?? []
  }

  /// Se muestran en la galería de widgets.
  static let samples: [GoalItem] = [
    GoalItem(id: "1", name: L.t("Peso", "Weight"), valueText: "78.4", unit: "kg", targetNumberText: "72", percent: 51, progress: 0.51, color: "#C9B6FF", symbol: "dumbbell", completed: false),
    GoalItem(id: "2", name: L.t("Agua al día", "Daily water"), valueText: "1.6", unit: "L", targetNumberText: "2", percent: 80, progress: 0.8, color: "#B8F2D4", symbol: "drop", completed: false),
    GoalItem(id: "3", name: L.t("Lectura", "Reading"), valueText: "14", unit: L.t("libros", "books"), targetNumberText: "24", percent: 58, progress: 0.58, color: "#8FE3F0", symbol: "book", completed: false),
    GoalItem(id: "4", name: L.t("Ahorro", "Savings"), valueText: "1,850", unit: "soles", targetNumberText: "5,000", percent: 37, progress: 0.37, color: "#FFD59E", symbol: "dollarsign.circle", completed: false),
    GoalItem(id: "5", name: L.t("Inglés", "Spanish"), valueText: "62", unit: L.t("lecciones", "lessons"), targetNumberText: "100", percent: 62, progress: 0.62, color: "#FF9ECF", symbol: "character.bubble", completed: false),
  ]
}

extension Color {
  /// "#RRGGBB" → Color. Nil si el texto no es un color válido.
  init?(hexString: String) {
    let hex = hexString.hasPrefix("#") ? String(hexString.dropFirst()) : hexString
    guard hex.count == 6, let value = UInt32(hex, radix: 16) else { return nil }
    self.init(hex: value)
  }
}

// MARK: - Configuración: elegir metas

// En "Editar widget" cada meta es una fila "Meta  Casa" y al tocarla iOS abre un menú con todas las
// metas de la app (como el "View" del widget de Todoist).
//
// Qué se guarda: al elegir en el menú, el id de la meta (iOS muestra el título del menú). Los valores
// por defecto, en cambio, iOS los muestra tal cual, así que por defecto se guarda el nombre de la
// meta y "—" para un espacio vacío. Por eso una meta se busca primero por id y luego por nombre.

/// "Ninguna": deja vacío ese espacio de "Mis metas" (se elige en el menú).
let noGoalId = "—"

enum GoalOptions {
  /// Las metas en el orden que ofrece el menú: la de Ajustes primero, luego las demás activas y al
  /// final las cumplidas.
  static func ordered(_ all: [GoalItem] = GoalItem.loadAll()) -> [GoalItem] {
    var active = all.filter { !$0.completed }
    if let preferred = OrbeSnapshot.load()?.goalId, let index = active.firstIndex(where: { $0.id == preferred }) {
      active.insert(active.remove(at: index), at: 0)
    }
    return active + all.filter(\.completed)
  }

  static func collection(allowNone: Bool) -> IntentItemCollection<String> {
    var items = ordered().map { goal in
      IntentItem(goal.id, title: "\(goal.name)", image: DisplayRepresentation.Image(systemName: goal.safeSymbol))
    }
    if allowNone { items.append(IntentItem(noGoalId, title: "None")) }
    return IntentItemCollection(sections: [IntentItemSection(items: items)])
  }

  /// Al agregar el widget, el espacio n trae la meta n de la lista; si no hay tantas, queda vacío.
  /// Si no hay tantas metas, la fila dice "Elegir" (iOS muestra el valor por defecto tal cual); como
  /// no coincide con ninguna meta, ese espacio toma la siguiente meta que se cree. "Ninguna" se elige
  /// a mano en el menú.
  static func defaultId(slot: Int, allowNone: Bool) -> String? {
    let goals = ordered()
    if slot < goals.count { return goals[slot].name }
    return L.t("Elegir", "Select")
  }

  /// La meta de un valor guardado: el id (elegido en el menú) o el nombre (valor por defecto).
  static func match(_ value: String, in goals: [GoalItem]) -> GoalItem? {
    goals.first { $0.id == value } ?? goals.first { $0.name == value }
  }
}

/// La meta de los widgets de una meta y del pequeño de "Mis metas" (también el espacio 1).
struct GoalOptionsProvider: DynamicOptionsProvider {
  func results() async throws -> IntentItemCollection<String> { GoalOptions.collection(allowNone: false) }
  func defaultResult() async -> String? { GoalOptions.defaultId(slot: 0, allowNone: false) }
}

// Los espacios 2 a 5 de "Mis metas" aceptan "Ninguna". Un tipo por espacio porque cada uno trae
// por defecto una meta distinta.
struct GoalSlot2Options: DynamicOptionsProvider {
  func results() async throws -> IntentItemCollection<String> { GoalOptions.collection(allowNone: true) }
  func defaultResult() async -> String? { GoalOptions.defaultId(slot: 1, allowNone: true) }
}

struct GoalSlot3Options: DynamicOptionsProvider {
  func results() async throws -> IntentItemCollection<String> { GoalOptions.collection(allowNone: true) }
  func defaultResult() async -> String? { GoalOptions.defaultId(slot: 2, allowNone: true) }
}

struct GoalSlot4Options: DynamicOptionsProvider {
  func results() async throws -> IntentItemCollection<String> { GoalOptions.collection(allowNone: true) }
  func defaultResult() async -> String? { GoalOptions.defaultId(slot: 3, allowNone: true) }
}

struct GoalSlot5Options: DynamicOptionsProvider {
  func results() async throws -> IntentItemCollection<String> { GoalOptions.collection(allowNone: true) }
  func defaultResult() async -> String? { GoalOptions.defaultId(slot: 4, allowNone: true) }
}

/// Cómo se ven las metas del pequeño en StandBy.
enum StandByStyle: String, AppEnum {
  case rings
  case bars

  static var typeDisplayRepresentation: TypeDisplayRepresentation = "Style"
  static var caseDisplayRepresentations: [StandByStyle: DisplayRepresentation] = [
    .rings: "Rings",
    .bars: "Bars",
  ]
}

/// Flujos distintos por tamaño: el pequeño elige 1 meta (y 3 más que solo se ven en StandBy), el
/// mediano 3 y el grande 5.
struct SelectGoalsIntent: WidgetConfigurationIntent {
  static var title: LocalizedStringResource = "Choose goals"
  static var description = IntentDescription("Pick which goals the widget shows. The small widget shows goal 1 on the Home Screen and up to 4 in StandBy.")

  @Parameter(title: "Goal 1", optionsProvider: GoalOptionsProvider())
  var goal: String?

  // Solo del pequeño: se ven en StandBy, junto a la meta 1. Aparte de goal2…goal4 para que cada
  // tamaño guarde lo suyo y el nombre diga dónde se ven.
  @Parameter(title: "Goal 2 · StandBy", optionsProvider: GoalSlot2Options())
  var standby2: String?

  @Parameter(title: "Goal 3 · StandBy", optionsProvider: GoalSlot3Options())
  var standby3: String?

  @Parameter(title: "Goal 4 · StandBy", optionsProvider: GoalSlot4Options())
  var standby4: String?

  @Parameter(title: "Style · StandBy", default: .rings)
  var standbyStyle: StandByStyle

  @Parameter(title: "Goal 1", optionsProvider: GoalOptionsProvider())
  var goal1: String?

  @Parameter(title: "Goal 2", optionsProvider: GoalSlot2Options())
  var goal2: String?

  @Parameter(title: "Goal 3", optionsProvider: GoalSlot3Options())
  var goal3: String?

  @Parameter(title: "Goal 4", optionsProvider: GoalSlot4Options())
  var goal4: String?

  @Parameter(title: "Goal 5", optionsProvider: GoalSlot5Options())
  var goal5: String?

  static var parameterSummary: some ParameterSummary {
    Switch(.widgetFamily) {
      Case(.systemSmall) {
        Summary {
          \.$goal
          \.$standby2
          \.$standby3
          \.$standby4
          \.$standbyStyle
        }
      }
      Case(.systemMedium) {
        Summary {
          \.$goal1
          \.$goal2
          \.$goal3
        }
      }
      DefaultCase {
        Summary {
          \.$goal1
          \.$goal2
          \.$goal3
          \.$goal4
          \.$goal5
        }
      }
    }
  }

  init() {}

  /// Lo elegido para cada espacio del tamaño, en orden.
  func chosenIds(for family: WidgetFamily) -> [String?] {
    switch family {
    case .systemSmall: [goal]
    case .systemMedium: [goal1, goal2, goal3]
    default: [goal1, goal2, goal3, goal4, goal5]
    }
  }

  /// Las 4 metas del pequeño en StandBy; la primera es la misma de la pantalla de inicio.
  var standbyIds: [String?] { [goal, standby2, standby3, standby4] }
}

// MARK: - Línea de tiempo

struct GoalsEntry: TimelineEntry {
  let date: Date
  /// Todas las metas visibles; la vista recorta según el tamaño.
  let goals: [GoalItem]
  let activeCount: Int
  let completedCount: Int
  var locked = false
  /// En StandBy el pequeño muestra hasta 4 metas: Meta 1 y las tres "· StandBy" de "Editar widget".
  var standbyGoals: [GoalItem] = []
  var standbyStyle: StandByStyle = .rings
}

/// Las metas de cada espacio, en orden. "Ninguna" deja el espacio vacío. Un espacio sin valor o con
/// una meta que ya no existe (borrada o renombrada) toma la siguiente meta de la lista que no esté
/// en otro espacio. Si al final no queda ninguna, se muestran las de la lista: nunca sale vacío.
func resolveGoals(_ values: [String?], ordered: [GoalItem]) -> [GoalItem] {
  let matched = values.map { value in value.flatMap { GoalOptions.match($0, in: ordered) } }
  let taken = Set(matched.compactMap { $0?.id })
  var automatic = ordered.filter { !taken.contains($0.id) }.makeIterator()
  var seen = Set<String>()
  var result: [GoalItem] = []
  for (value, goal) in zip(values, matched) {
    let pick = value == noGoalId ? nil : (goal ?? automatic.next())
    // Sin repetidos: el menú deja elegir la misma meta en dos espacios.
    if let pick, seen.insert(pick.id).inserted { result.append(pick) }
  }
  return result.isEmpty ? Array(ordered.prefix(values.count)) : result
}

struct GoalsProvider: AppIntentTimelineProvider {
  private func entry(for configuration: SelectGoalsIntent, family: WidgetFamily, at date: Date, preview: Bool) -> GoalsEntry {
    let stored = GoalItem.loadAll()
    // En la galería, con menos de 3 metas se muestran ejemplos para que se vea qué hace el widget.
    let useSamples = preview && stored.count < 3
    let all = useSamples ? GoalItem.samples : stored
    let ordered = useSamples ? all : GoalOptions.ordered(all)
    let ids = useSamples ? configuration.chosenIds(for: family).map { _ in nil } : configuration.chosenIds(for: family)
    let goals = resolveGoals(ids, ordered: ordered)
    var standby: [GoalItem] = []
    if family == .systemSmall {
      let standbyIds = useSamples ? configuration.standbyIds.map { _ in nil } : configuration.standbyIds
      standby = resolveGoals(standbyIds, ordered: ordered)
    }
    return GoalsEntry(
      date: date,
      goals: goals,
      activeCount: all.filter { !$0.completed }.count,
      completedCount: all.filter(\.completed).count,
      locked: preview ? false : ProAccess.isLocked(at: date),
      standbyGoals: standby,
      standbyStyle: configuration.standbyStyle
    )
  }

  func placeholder(in context: Context) -> GoalsEntry {
    GoalsEntry(date: .now, goals: GoalItem.samples, activeCount: 5, completedCount: 0, standbyGoals: Array(GoalItem.samples.prefix(4)))
  }

  func snapshot(for configuration: SelectGoalsIntent, in context: Context) async -> GoalsEntry {
    entry(for: configuration, family: context.family, at: .now, preview: context.isPreview)
  }

  func timeline(for configuration: SelectGoalsIntent, in context: Context) async -> Timeline<GoalsEntry> {
    let now = Date.now
    var entries = [entry(for: configuration, family: context.family, at: now, preview: false)]
    // Al terminar la prueba el widget se bloquea solo, aunque la app no se abra.
    if let until = ProAccess.until(), until > now {
      var locked = entry(for: configuration, family: context.family, at: until, preview: false)
      locked.locked = true
      entries.append(locked)
    }
    return Timeline(entries: entries, policy: .never)
  }
}

// MARK: - Vistas

private func goalURL(_ goal: GoalItem) -> URL { URL(string: "brote:///goal/\(goal.id)")! }

private func countText(active: Int, completed: Int) -> String {
  let activeText = L.isEnglish ? "\(active) active" : "\(active) \(active == 1 ? "activa" : "activas")"
  guard completed > 0 else { return activeText }
  let completedText = L.isEnglish ? "\(completed) done" : "\(completed) \(completed == 1 ? "cumplida" : "cumplidas")"
  return "\(activeText) · \(completedText)"
}

/// Medidas de una fila según el tamaño del widget (en StandBy el pequeño se ve ampliado).
struct RowStyle {
  let chip: CGFloat
  let radius: CGFloat
  let icon: CGFloat
  let name: CGFloat
  let value: CGFloat
  let bar: CGFloat
  let gap: CGFloat
  let showValue: Bool

  static let small = RowStyle(chip: 24, radius: 8, icon: 12, name: 12, value: 0, bar: 4, gap: 8, showValue: false)
  static let medium = RowStyle(chip: 30, radius: 10, icon: 14, name: 13, value: 12, bar: 5, gap: 10, showValue: true)
  static let large = RowStyle(chip: 36, radius: 12, icon: 16, name: 14, value: 13, bar: 6, gap: 12, showValue: true)
}

struct GoalListRow: View {
  let goal: GoalItem
  let style: RowStyle

  var body: some View {
    HStack(spacing: style.gap) {
      ZStack {
        RoundedRectangle(cornerRadius: style.radius).fill(goal.tint.opacity(0.16))
        Image(systemName: goal.completed ? "checkmark" : goal.safeSymbol)
          .font(.system(size: style.icon, weight: .semibold))
          .foregroundStyle(goal.tint)
      }
      .frame(width: style.chip, height: style.chip)

      VStack(alignment: .leading, spacing: max(4, style.bar)) {
        HStack(alignment: .firstTextBaseline, spacing: 8) {
          Text(goal.name).font(Orbe.medium(style.name)).foregroundStyle(Orbe.text).lineLimit(1)
          if style.showValue {
            Spacer(minLength: 0)
            Text("\(goal.valueText) \(goal.unit)")
              .font(Orbe.regular(style.value))
              .foregroundStyle(Orbe.secondary)
              .lineLimit(1)
              .layoutPriority(1)
          }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        GeometryReader { geometry in
          ZStack(alignment: .leading) {
            Capsule().fill(goal.tint.opacity(0.16))
            Capsule()
              .fill(goal.tint)
              .frame(width: max(geometry.size.width * goal.progress, goal.progress > 0 ? style.bar : 0))
              .shadow(color: goal.tint.opacity(0.7), radius: style.bar)
          }
        }
        .frame(height: style.bar)
      }
    }
  }
}

/// Cada fila abre su meta. Con el máximo de metas se reparten a lo alto; con menos, van juntas
/// (centradas en pequeño y mediano, arriba en el grande, bajo el encabezado).
struct GoalList: View {
  let goals: ArraySlice<GoalItem>
  let style: RowStyle
  let capacity: Int
  var centered = true

  var body: some View {
    if goals.count >= capacity {
      VStack(spacing: 0) {
        ForEach(Array(goals.enumerated()), id: \.element.id) { index, goal in
          if index > 0 { Spacer(minLength: 4) }
          Link(destination: goalURL(goal)) { GoalListRow(goal: goal, style: style) }
        }
      }
    } else if !centered {
      // Grande: cada fila ocupa su lugar de una lista completa, así el ritmo no cambia con menos metas.
      VStack(spacing: 0) {
        ForEach(goals) { goal in
          Link(destination: goalURL(goal)) { GoalListRow(goal: goal, style: style) }
            .frame(maxHeight: .infinity)
        }
        ForEach(0..<(capacity - goals.count), id: \.self) { _ in
          Color.clear.frame(maxHeight: .infinity)
        }
      }
    } else {
      VStack(spacing: style.chip * 0.45) {
        Spacer(minLength: 0)
        ForEach(goals) { goal in
          Link(destination: goalURL(goal)) { GoalListRow(goal: goal, style: style) }
        }
        Spacer(minLength: 0)
      }
    }
  }
}

/// Pequeño: una sola meta, con su color e ícono (en StandBy, solo si hay una meta).
struct SmallGoalView: View {
  let goal: GoalItem

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      HStack(spacing: 8) {
        ZStack {
          RoundedRectangle(cornerRadius: 8).fill(goal.tint.opacity(0.16))
          Image(systemName: goal.completed ? "checkmark" : goal.safeSymbol)
            .font(.system(size: 12, weight: .semibold))
            .foregroundStyle(goal.tint)
        }
        .frame(width: 26, height: 26)
        Text(goal.name).font(Orbe.medium(13)).foregroundStyle(goal.tint).lineLimit(1)
        Spacer(minLength: 0)
      }
      Spacer(minLength: 6)
      HStack(alignment: .firstTextBaseline, spacing: 3) {
        Text(goal.valueText)
          .font(Orbe.semibold(34))
          .tracking(-1)
          .foregroundStyle(Orbe.strong)
          .shadow(color: goal.tint.opacity(0.45), radius: 8)
          .minimumScaleFactor(0.5)
          .lineLimit(1)
        Text(goal.unit).font(Orbe.regular(13)).foregroundStyle(Orbe.secondary).lineLimit(1)
      }
      Text("\(L.t("Meta", "Goal")) \(goal.targetNumberText) · \(goal.percent)%")
        .font(Orbe.regular(11))
        .foregroundStyle(Orbe.tertiary)
        .lineLimit(1)
        .padding(.top, 2)
      Spacer(minLength: 8)
      GeometryReader { geometry in
        ZStack(alignment: .leading) {
          Capsule().fill(goal.tint.opacity(0.16))
          Capsule()
            .fill(goal.tint)
            .frame(width: max(geometry.size.width * goal.progress, goal.progress > 0 ? 6 : 0))
            .shadow(color: goal.tint.opacity(0.7), radius: 5)
        }
      }
      .frame(height: 6)
    }
  }
}

struct LargeGoalsView: View {
  let entry: GoalsEntry

  var body: some View {
    VStack(spacing: 16) {
      HStack {
        Text(L.t("Mis metas", "My goals")).font(Orbe.semibold(16)).foregroundStyle(Orbe.text)
        Spacer()
        Text(countText(active: entry.activeCount, completed: entry.completedCount))
          .font(Orbe.regular(11))
          .foregroundStyle(Orbe.lilacSoft)
          .padding(.horizontal, 10)
          .frame(height: 24)
          .background(Capsule().fill(Orbe.lilac.opacity(0.14)))
      }
      GoalList(goals: entry.goals.prefix(5), style: .large, capacity: 5, centered: false)
    }
  }
}

/// StandBy: hasta 4 metas en anillos de 2×2, cada una con su color y el porcentaje adentro.
/// El pequeño no admite enlaces por meta, así que todo el widget abre la app.
struct StandByRingsView: View {
  let goals: [GoalItem]

  var body: some View {
    Grid(horizontalSpacing: 10, verticalSpacing: 8) {
      GridRow {
        cell(at: 0)
        cell(at: 1)
      }
      GridRow {
        cell(at: 2)
        cell(at: 3)
      }
    }
  }

  @ViewBuilder
  private func cell(at index: Int) -> some View {
    if index < goals.count {
      StandByRing(goal: goals[index])
    } else {
      Color.clear
    }
  }
}

struct StandByRing: View {
  let goal: GoalItem

  var body: some View {
    VStack(spacing: 4) {
      ZStack {
        Circle().stroke(goal.tint.opacity(0.18), lineWidth: 6)
        if goal.progress > 0 {
          Circle()
            .trim(from: 0, to: min(goal.progress, 1))
            .stroke(goal.tint, style: StrokeStyle(lineWidth: 6, lineCap: .round))
            .rotationEffect(.degrees(-90))
            .shadow(color: goal.tint.opacity(0.6), radius: 4)
        }
        if goal.completed {
          Image(systemName: "checkmark").font(.system(size: 16, weight: .bold)).foregroundStyle(goal.tint)
        } else {
          Text("\(goal.percent)%")
            .font(Orbe.semibold(14))
            .foregroundStyle(Orbe.strong)
            .minimumScaleFactor(0.6)
            .lineLimit(1)
            .padding(.horizontal, 6)
        }
      }
      .aspectRatio(1, contentMode: .fit)
      .frame(maxWidth: .infinity, maxHeight: .infinity)
      .padding(3)
      Text(goal.name)
        .font(Orbe.medium(10))
        .foregroundStyle(goal.tint)
        .lineLimit(1)
    }
  }
}

/// StandBy: hasta 4 metas en filas con nombre, porcentaje y barra.
struct StandByBarsView: View {
  let goals: [GoalItem]

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      ForEach(goals.prefix(4)) { goal in
        VStack(alignment: .leading, spacing: 4) {
          HStack(alignment: .firstTextBaseline, spacing: 6) {
            Text(goal.name)
              .font(Orbe.medium(11))
              .foregroundStyle(goal.tint)
              .lineLimit(1)
            Spacer(minLength: 4)
            if goal.completed {
              Image(systemName: "checkmark").font(.system(size: 11, weight: .bold)).foregroundStyle(goal.tint)
            } else {
              Text("\(goal.percent)%")
                .font(Orbe.semibold(12))
                .foregroundStyle(Orbe.strong)
                .lineLimit(1)
            }
          }
          GeometryReader { proxy in
            ZStack(alignment: .leading) {
              Capsule().fill(Color.white.opacity(0.12))
              if goal.progress > 0 {
                Capsule()
                  .fill(goal.tint)
                  .frame(width: max(proxy.size.width * min(goal.progress, 1), 6))
                  .shadow(color: goal.tint.opacity(0.6), radius: 3)
              }
            }
          }
          .frame(height: 6)
        }
        .frame(maxHeight: .infinity)
      }
    }
  }
}

struct GoalsView: View {
  @Environment(\.widgetFamily) private var family
  /// Falso en StandBy: ahí el widget se muestra sin fondo y ampliado.
  @Environment(\.showsWidgetContainerBackground) private var showsBackground
  let entry: GoalsEntry

  var body: some View {
    Group {
      if entry.locked {
        LockedWidget().widgetURL(URL(string: "brote:///paywall"))
      } else if entry.goals.isEmpty {
        EmptyWidget().widgetURL(URL(string: "brote:///"))
      } else if family == .systemSmall, !showsBackground, entry.standbyGoals.count > 1 {
        Group {
          switch entry.standbyStyle {
          case .rings: StandByRingsView(goals: entry.standbyGoals)
          case .bars: StandByBarsView(goals: entry.standbyGoals)
          }
        }
        .widgetURL(URL(string: "brote:///"))
      } else if family == .systemSmall, let goal = entry.goals.first {
        // El pequeño no admite enlaces por fila: todo el widget abre la meta.
        SmallGoalView(goal: goal).widgetURL(goalURL(goal))
      } else {
        Group {
          switch family {
          case .systemLarge: LargeGoalsView(entry: entry)
          default: GoalList(goals: entry.goals.prefix(3), style: .medium, capacity: 3)
          }
        }
        .widgetURL(URL(string: "brote:///"))
      }
    }
    .containerBackground(for: .widget) { OrbeBackground() }
  }
}

struct GoalsWidget: Widget {
  var body: some WidgetConfiguration {
    AppIntentConfiguration(kind: "OrbeGoals", intent: SelectGoalsIntent.self, provider: GoalsProvider()) { entry in
      GoalsView(entry: entry)
    }
    .configurationDisplayName(L.t("Mis metas", "My goals"))
    .description(L.t("Varias metas a la vez, también en StandBy. Mantén presionado para elegir cuáles.", "Several goals at once, in StandBy too. Touch and hold to choose which."))
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
  }
}
