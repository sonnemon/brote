import SwiftUI
import WidgetKit

@main
struct OrbeWidgets: WidgetBundle {
  var body: some Widget {
    ValueWidget()
    RingWidget()
    TrendWidget()
    SummaryWidget()
    StreakWidget()
  }
}

struct ValueView: View {
  @Environment(\.widgetFamily) private var family
  let entry: OrbeEntry

  var body: some View {
    switch family {
    case .accessoryRectangular: LockWidget(entry: entry) { RectangularValueView(snapshot: $0) }
    case .accessoryInline: LockWidget(entry: entry) { InlineView(snapshot: $0) }
    default: HomeWidget(entry: entry) { SmallValueView(snapshot: $0) }
    }
  }
}

struct ValueWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "OrbeValue", provider: OrbeProvider()) { ValueView(entry: $0) }
      .configurationDisplayName(L.t("Valor actual", "Current value"))
      .description(L.t("Tu número de hoy y cuánto has avanzado.", "Today's number and how far you've come."))
      .supportedFamilies([.systemSmall, .accessoryRectangular, .accessoryInline])
  }
}

struct RingView: View {
  @Environment(\.widgetFamily) private var family
  let entry: OrbeEntry

  var body: some View {
    if family == .accessoryCircular {
      LockWidget(entry: entry) { CircularGoalView(snapshot: $0) }
    } else {
      HomeWidget(entry: entry) { SmallRingView(snapshot: $0) }
    }
  }
}

struct RingWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "OrbeRing", provider: OrbeProvider()) { RingView(entry: $0) }
      .configurationDisplayName(L.t("Anillo de meta", "Goal ring"))
      .description(L.t("El porcentaje de tu meta. Ideal para StandBy.", "Your goal percentage. Great for StandBy."))
      .supportedFamilies([.systemSmall, .accessoryCircular])
  }
}

struct TrendView: View {
  @Environment(\.widgetFamily) private var family
  let entry: OrbeEntry

  var body: some View {
    if family == .accessoryRectangular {
      LockWidget(entry: entry) { RectangularTrendView(snapshot: $0) }
    } else {
      HomeWidget(entry: entry) { MediumTrendView(snapshot: $0) }
    }
  }
}

struct TrendWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "OrbeTrend", provider: OrbeProvider()) { TrendView(entry: $0) }
      .configurationDisplayName(L.t("Tendencia", "Trend"))
      .description(L.t("Cómo va tu meta en las últimas 8 semanas.", "How your goal has gone over the last 8 weeks."))
      .supportedFamilies([.systemMedium, .accessoryRectangular])
  }
}

struct SummaryWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "OrbeSummary", provider: OrbeProvider()) { entry in
      HomeWidget(entry: entry) { LargeSummaryView(snapshot: $0) }
    }
    .configurationDisplayName(L.t("Resumen", "Summary"))
    .description(L.t("Valor, racha, ritmo y tendencia.", "Value, streak, pace and trend."))
    .supportedFamilies([.systemLarge])
  }
}

struct StreakWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "OrbeStreak", provider: OrbeProvider()) { entry in
      LockWidget(entry: entry) { CircularStreakView(snapshot: $0) }
    }
    .configurationDisplayName(L.t("Racha", "Streak"))
    .description(L.t("Tus días de racha en la pantalla bloqueada.", "Your streak days on the Lock Screen."))
    .supportedFamilies([.accessoryCircular])
  }
}
