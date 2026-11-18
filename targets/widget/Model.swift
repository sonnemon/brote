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
    name: "Peso",
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

struct OrbeEntry: TimelineEntry {
  let date: Date
  /// Nil cuando el usuario aún no tiene metas.
  let snapshot: OrbeSnapshot?
}

/// La app avisa con `reloadWidget` cada vez que cambian los datos.
struct OrbeProvider: TimelineProvider {
  func placeholder(in context: Context) -> OrbeEntry {
    OrbeEntry(date: .now, snapshot: .sample)
  }

  func getSnapshot(in context: Context, completion: @escaping (OrbeEntry) -> Void) {
    completion(OrbeEntry(date: .now, snapshot: context.isPreview ? (OrbeSnapshot.load() ?? .sample) : OrbeSnapshot.load()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<OrbeEntry>) -> Void) {
    completion(Timeline(entries: [OrbeEntry(date: .now, snapshot: OrbeSnapshot.load())], policy: .never))
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
