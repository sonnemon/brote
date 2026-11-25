import SwiftUI
import WidgetKit

// MARK: - Piezas

struct OrbeBackground: View {
  var body: some View {
    ZStack {
      Color(hex: 0x110E28)
      RadialGradient(colors: [Orbe.lilac.opacity(0.36), .clear], center: UnitPoint(x: 0.12, y: 0), startRadius: 0, endRadius: 170)
      RadialGradient(colors: [Orbe.pink.opacity(0.28), .clear], center: UnitPoint(x: 1, y: 1), startRadius: 0, endRadius: 160)
    }
  }
}

struct Ring: View {
  let progress: Double
  let lineWidth: CGFloat

  var body: some View {
    ZStack {
      Circle().stroke(Orbe.track, lineWidth: lineWidth)
      if progress > 0 {
        Circle()
          .trim(from: 0, to: progress)
          .stroke(Orbe.progress, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
          .rotationEffect(.degrees(-90))
          .shadow(color: Orbe.lilac.opacity(0.8), radius: 5)
      }
    }
  }
}

struct HeroValue: View {
  let snapshot: OrbeSnapshot
  var size: CGFloat = 40

  var body: some View {
    HStack(alignment: .firstTextBaseline, spacing: 3) {
      Text(snapshot.valueText)
        .font(Orbe.semibold(size))
        .tracking(-size * 0.03)
        .foregroundStyle(Orbe.strong)
        .shadow(color: Orbe.lilac.opacity(0.5), radius: 9)
        .minimumScaleFactor(0.5)
        .lineLimit(1)
      Text(snapshot.unit).font(Orbe.regular(14)).foregroundStyle(Orbe.secondary)
    }
  }
}

struct ProgressBar: View {
  let progress: Double

  var body: some View {
    GeometryReader { geometry in
      ZStack(alignment: .leading) {
        Capsule().fill(Orbe.lilac.opacity(0.16))
        Capsule().fill(Orbe.bar).frame(width: max(geometry.size.width * progress, progress > 0 ? 6 : 0))
      }
    }
    .frame(height: 6)
  }
}

private func points(_ values: [Double], in size: CGSize) -> [CGPoint] {
  guard let low = values.min(), let high = values.max(), values.count > 1 else { return [] }
  let span = high - low
  let padding: CGFloat = 6
  let usableHeight = size.height - padding * 2
  return values.enumerated().map { index, value in
    CGPoint(
      x: padding + CGFloat(index) * (size.width - padding * 2) / CGFloat(values.count - 1),
      y: span == 0 ? size.height / 2 : padding + (1 - CGFloat((value - low) / span)) * usableHeight
    )
  }
}

struct TrendLine: Shape {
  let values: [Double]

  func path(in rect: CGRect) -> Path {
    Path { path in path.addLines(points(values, in: rect.size)) }
  }
}

struct TrendArea: Shape {
  let values: [Double]

  func path(in rect: CGRect) -> Path {
    let line = points(values, in: rect.size)
    guard let first = line.first, let last = line.last else { return Path() }
    return Path { path in
      path.addLines(line)
      path.addLine(to: CGPoint(x: last.x, y: rect.maxY))
      path.addLine(to: CGPoint(x: first.x, y: rect.maxY))
      path.closeSubpath()
    }
  }
}

struct TrendChart: View {
  let values: [Double]

  var body: some View {
    GeometryReader { geometry in
      ZStack(alignment: .topLeading) {
        TrendArea(values: values)
          .fill(LinearGradient(colors: [Orbe.lilac.opacity(0.35), Orbe.pink.opacity(0)], startPoint: .top, endPoint: .bottom))
        TrendLine(values: values)
          .stroke(Orbe.line, style: StrokeStyle(lineWidth: 2.5, lineCap: .round, lineJoin: .round))
        if let last = points(values, in: geometry.size).last {
          Circle().fill(Orbe.pink.opacity(0.25)).frame(width: 14, height: 14).position(last)
          Circle().fill(.white).frame(width: 7, height: 7).position(last)
        }
      }
    }
  }
}

/// Sin Pro: candado y "Toca para desbloquear". Abre el paywall de la app.
struct LockedWidget: View {
  var body: some View {
    VStack(spacing: 8) {
      ZStack {
        Circle().fill(LinearGradient(colors: [Orbe.lilac, Orbe.pink], startPoint: .topLeading, endPoint: .bottomTrailing))
        Image(systemName: "lock.fill").font(.system(size: 18, weight: .semibold)).foregroundStyle(Color(hex: 0x15112A))
      }
      .frame(width: 44, height: 44)
      .shadow(color: Orbe.lilac.opacity(0.6), radius: 10)
      Text(L.t("Toca para desbloquear", "Tap to unlock"))
        .font(Orbe.semibold(13))
        .foregroundStyle(Orbe.text)
        .multilineTextAlignment(.center)
      Text("Brote Pro").font(Orbe.regular(11)).foregroundStyle(Orbe.secondary)
    }
  }
}

/// Versión de pantalla bloqueada: un solo tono.
struct LockedAccessory: View {
  @Environment(\.widgetFamily) private var family

  var body: some View {
    switch family {
    case .accessoryRectangular:
      HStack(spacing: 6) {
        Image(systemName: "lock.fill")
        Text(L.t("Toca para desbloquear", "Tap to unlock")).font(Orbe.semibold(13)).lineLimit(2)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
    case .accessoryInline:
      Label(L.t("Toca para desbloquear", "Tap to unlock"), systemImage: "lock.fill")
    default:
      Image(systemName: "lock.fill").font(.system(size: 18, weight: .semibold))
    }
  }
}

struct EmptyWidget: View {
  var body: some View {
    VStack(spacing: 6) {
      Image(systemName: "plus.circle").font(.system(size: 24)).foregroundStyle(Orbe.lilac)
      Text(L.t("Crea tu primera meta", "Create your first goal"))
        .font(Orbe.medium(13))
        .foregroundStyle(Orbe.text)
        .multilineTextAlignment(.center)
    }
  }
}

// MARK: - Contenedor

/// Fondo Nébula, enlace profundo y estado vacío comunes a los widgets de pantalla de inicio.
struct HomeWidget<Content: View>: View {
  let entry: OrbeEntry
  @ViewBuilder let content: (OrbeSnapshot) -> Content

  var body: some View {
    Group {
      if entry.locked {
        LockedWidget().widgetURL(URL(string: "brote:///paywall"))
      } else if let snapshot = entry.snapshot {
        content(snapshot).widgetURL(URL(string: "brote:///goal/\(snapshot.goalId)"))
      } else {
        EmptyWidget().widgetURL(URL(string: "brote:///"))
      }
    }
    .containerBackground(for: .widget) { OrbeBackground() }
  }
}

/// La pantalla bloqueada pinta en un solo tono: no lleva fondo ni gradientes.
struct LockWidget<Content: View>: View {
  let entry: OrbeEntry
  @ViewBuilder let content: (OrbeSnapshot) -> Content

  var body: some View {
    Group {
      if entry.locked {
        LockedAccessory().widgetURL(URL(string: "brote:///paywall"))
      } else if let snapshot = entry.snapshot {
        content(snapshot).widgetURL(URL(string: "brote:///goal/\(snapshot.goalId)"))
      } else {
        Image(systemName: "plus.circle").widgetURL(URL(string: "brote:///"))
      }
    }
    .containerBackground(for: .widget) { AccessoryWidgetBackground() }
  }
}

// MARK: - Pantalla de inicio

struct SmallValueView: View {
  let snapshot: OrbeSnapshot

  var body: some View {
    VStack(alignment: .leading) {
      HStack {
        Text(snapshot.name).font(Orbe.medium(13)).foregroundStyle(Orbe.lilac).lineLimit(1)
        Spacer()
        Image(systemName: "circle.circle").font(.system(size: 14)).foregroundStyle(Orbe.lilac)
      }
      Spacer()
      HeroValue(snapshot: snapshot)
      Text(snapshot.changeText).font(Orbe.regular(12)).foregroundStyle(Orbe.lilacSoft).padding(.top, 2)
      Spacer(minLength: 8)
      ProgressBar(progress: snapshot.progress)
    }
  }
}

struct SmallRingView: View {
  let snapshot: OrbeSnapshot

  var body: some View {
    ZStack {
      Ring(progress: snapshot.progress, lineWidth: 9)
      VStack(spacing: 2) {
        Text("\(snapshot.percent)%").font(Orbe.semibold(28)).foregroundStyle(Orbe.text)
        Text(L.t("de tu meta", "of your goal")).font(Orbe.regular(11)).foregroundStyle(Orbe.secondary)
      }
    }
    .padding(2)
  }
}

struct MediumTrendView: View {
  let snapshot: OrbeSnapshot

  var body: some View {
    HStack(spacing: 16) {
      VStack(alignment: .leading) {
        Text(snapshot.name).font(Orbe.medium(13)).foregroundStyle(Orbe.lilac).lineLimit(1)
        Spacer()
        HeroValue(snapshot: snapshot)
        Text(snapshot.changeText)
          .font(Orbe.regular(11))
          .foregroundStyle(Orbe.lilacSoft)
          .padding(.horizontal, 8)
          .frame(height: 22)
          .background(Capsule().fill(Orbe.lilac.opacity(0.14)))
        Spacer()
        Text("\(L.t("Meta", "Goal")) \(snapshot.targetText)").font(Orbe.regular(11)).foregroundStyle(Orbe.tertiary)
      }
      .frame(width: 136, alignment: .leading)

      VStack(spacing: 6) {
        TrendChart(values: snapshot.series)
        HStack {
          Text(snapshot.startDateLabel)
          Spacer()
          Text(L.t("Hoy", "Today"))
        }
        .font(Orbe.regular(10))
        .foregroundStyle(Orbe.tertiary)
      }
    }
  }
}

// MARK: - Pantalla bloqueada

struct CircularGoalView: View {
  let snapshot: OrbeSnapshot

  var body: some View {
    Gauge(value: snapshot.progress) {
      Text(L.t("META", "GOAL")).font(Orbe.medium(9))
    } currentValueLabel: {
      Text("\(snapshot.percent)").font(Orbe.semibold(18))
    }
    .gaugeStyle(.accessoryCircular)
  }
}

struct CircularStreakView: View {
  let snapshot: OrbeSnapshot

  var body: some View {
    VStack(spacing: 2) {
      Image(systemName: "star.fill").font(.system(size: 16))
      Text("\(snapshot.streakDays)").font(Orbe.semibold(16))
    }
  }
}

struct RectangularValueView: View {
  let snapshot: OrbeSnapshot

  var body: some View {
    VStack(alignment: .leading, spacing: 1) {
      Text(snapshot.name).font(Orbe.semibold(12)).lineLimit(1)
      Text("\(snapshot.valueText) \(snapshot.unit)").font(Orbe.semibold(22)).minimumScaleFactor(0.6).lineLimit(1)
      Text("\(snapshot.changeText) · \(L.t("meta", "goal")) \(snapshot.targetNumberText)").font(Orbe.regular(11)).opacity(0.8).lineLimit(1)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }
}

struct RectangularTrendView: View {
  let snapshot: OrbeSnapshot

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      Text(L.t("Tendencia 8 sem", "8-week trend")).font(Orbe.semibold(12)).lineLimit(1)
      TrendLine(values: snapshot.series)
        .stroke(.primary, style: StrokeStyle(lineWidth: 2.4, lineCap: .round, lineJoin: .round))
    }
  }
}

struct InlineView: View {
  let snapshot: OrbeSnapshot

  var body: some View {
    Label("\(snapshot.streakDays) días · \(snapshot.valueText) \(snapshot.unit)", systemImage: "star.fill")
  }
}
