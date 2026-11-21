import SwiftUI
import WidgetKit

/// Espejo de `WidgetSnapshot` en src/lib/widgetData.ts. La app entrega todo ya formateado.
struct OrbeSnapshot: Codable {
  let goalId: String
  let name: String
  let valueText: String
  let unit: String
  let percent: Int
  let progress: Double
  let changeText: String
  let targetText: String
  let targetNumberText: String
  let streakDays: Int
  let streakProgress: Double
  let weeklyText: String
  let weekProgress: Double
  let series: [Double]
  let startDateLabel: String
  let startValueLabel: String

  /// Se muestra en la galería de widgets.
  static let sample = OrbeSnapshot(
    goalId: "",
    name: L.t("Peso", "Weight"),
    valueText: "78.4",
    unit: "kg",
    percent: 51,
    progress: 0.51,
    changeText: "▾ 6.6 kg",
    targetText: "72 kg",
    targetNumberText: "72",
    streakDays: 12,
    streakProgress: 0.4,
    weeklyText: "−0.9",
    weekProgress: 0.7,
    series: [85, 84, 83.2, 82, 81.1, 80, 79.2, 78.4],
    startDateLabel: "20 sep",
    startValueLabel: "85 kg · 20 sep"
  )

  static func load() -> OrbeSnapshot? {
    guard
      let text = UserDefaults(suiteName: "group.pe.orbe.app")?.string(forKey: "widget_snapshot"),
      let data = text.data(using: .utf8)
    else { return nil }
    return try? JSONDecoder().decode(OrbeSnapshot.self, from: data)
  }
}

/// Textos del widget en el idioma de la app (la app guarda "es" o "en" en el App Group).
/// Sin ese dato, sigue el idioma del sistema.
enum L {
  static var isEnglish: Bool {
    if let lang = UserDefaults(suiteName: "group.pe.orbe.app")?.string(forKey: "widget_lang") {
      return lang == "en"
    }
    return !(Locale.preferredLanguages.first ?? "es").hasPrefix("es")
  }

  static func t(_ es: String, _ en: String) -> String { isEnglish ? en : es }

  static func days(_ n: Int) -> String {
    isEnglish ? "\(n) \(n == 1 ? "day" : "days")" : "\(n) \(n == 1 ? "día" : "días")"
  }
}

/// Hasta cuándo hay Pro (fin de la prueba gratis o compra). La app lo escribe en el App Group;
/// vacío o vencido significa que los widgets se muestran bloqueados.
enum ProAccess {
  static func until() -> Date? {
    guard let text = UserDefaults(suiteName: "group.pe.orbe.app")?.string(forKey: "widget_pro_until"), !text.isEmpty
    else { return nil }
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return formatter.date(from: text) ?? ISO8601DateFormatter().date(from: text)
  }

  static func isLocked(at date: Date) -> Bool {
    guard let until = until() else { return true }
    return date >= until
  }
}

struct OrbeEntry: TimelineEntry {
  let date: Date
  /// Nil cuando el usuario aún no tiene metas.
  let snapshot: OrbeSnapshot?
  /// Sin Pro (la prueba terminó y no compró): se muestra "Toca para desbloquear".
  var locked = false
}

/// La app avisa con `reloadWidget` cada vez que cambian los datos.
struct OrbeProvider: TimelineProvider {
  func placeholder(in context: Context) -> OrbeEntry {
    OrbeEntry(date: .now, snapshot: .sample)
  }

  func getSnapshot(in context: Context, completion: @escaping (OrbeEntry) -> Void) {
    // La galería siempre muestra el widget con datos, para que se vea qué se desbloquea.
    if context.isPreview {
      completion(OrbeEntry(date: .now, snapshot: OrbeSnapshot.load() ?? .sample))
    } else {
      completion(OrbeEntry(date: .now, snapshot: OrbeSnapshot.load(), locked: ProAccess.isLocked(at: .now)))
    }
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<OrbeEntry>) -> Void) {
    let now = Date.now
    let snapshot = OrbeSnapshot.load()
    var entries = [OrbeEntry(date: now, snapshot: snapshot, locked: ProAccess.isLocked(at: now))]
    // Al terminar la prueba el widget se bloquea solo, aunque la app no se abra.
    if let until = ProAccess.until(), until > now {
      entries.append(OrbeEntry(date: until, snapshot: snapshot, locked: true))
    }
    completion(Timeline(entries: entries, policy: .never))
  }
}

enum Orbe {
  static let lilac = Color(hex: 0xC9B6FF)
  static let pink = Color(hex: 0xFF9ECF)
  static let cyan = Color(hex: 0x8FE3F0)
  static let lilacSoft = Color(hex: 0xD9CCFF)
  static let strong = Color(hex: 0xF5F2FF)
  static let text = Color(hex: 0xEEEAFE)
  static let secondary = Color(hex: 0xBDB6DC)
  static let tertiary = Color(hex: 0xA49DC4)
  static let track = lilac.opacity(0.14)
  static let progress = LinearGradient(colors: [cyan, lilac, pink], startPoint: .topLeading, endPoint: .bottomTrailing)
  static let line = LinearGradient(colors: [cyan, lilac, pink], startPoint: .leading, endPoint: .trailing)
  static let bar = LinearGradient(colors: [cyan, lilac], startPoint: .leading, endPoint: .trailing)

  static func regular(_ size: CGFloat) -> Font { .custom("Sora-Regular", size: size) }
  static func medium(_ size: CGFloat) -> Font { .custom("Sora-Medium", size: size) }
  static func semibold(_ size: CGFloat) -> Font { .custom("Sora-SemiBold", size: size) }
}

extension Color {
  init(hex: UInt32) {
    self.init(
      red: Double((hex >> 16) & 255) / 255,
      green: Double((hex >> 8) & 255) / 255,
      blue: Double(hex & 255) / 255
    )
  }
}
