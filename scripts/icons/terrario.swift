import CoreGraphics
import CoreImage
import Foundation
import ImageIO
import UniformTypeIdentifiers

// Brote · "Orbe terrario": a glass sphere with soil (the goal level) and a sprout.
// Drawn in a 100-unit SVG-style space (y down); sphere centred at (50,50), r = 33.
// usage: terrario <out.png> <px> <minX> <minY> <viewSize> <mode>
// modes: full | dark | tinted | splash | simple | bg | mono

let a = CommandLine.arguments
let out = a[1]
let px = Int(a[2])!
let minX = CGFloat(Double(a[3])!), minY = CGFloat(Double(a[4])!), view = CGFloat(Double(a[5])!)
let mode = a[6]

let opaque = ["full", "dark", "tinted", "simple", "bg"].contains(mode)
let mono = mode == "mono"
let detailed = ["full", "dark", "tinted", "splash"].contains(mode)

func rgb(_ hex: String, _ alpha: CGFloat = 1) -> CGColor {
  let v = UInt32(hex, radix: 16)!
  return CGColor(srgbRed: CGFloat((v >> 16) & 0xFF) / 255, green: CGFloat((v >> 8) & 0xFF) / 255,
                 blue: CGFloat(v & 0xFF) / 255, alpha: alpha)
}
let white = rgb("FFFFFF")

let space = CGColorSpace(name: CGColorSpace.sRGB)!
let ctx = CGContext(data: nil, width: px, height: px, bitsPerComponent: 8, bytesPerRow: 0, space: space,
                    bitmapInfo: (opaque ? CGImageAlphaInfo.noneSkipLast : CGImageAlphaInfo.premultipliedLast).rawValue)!
let size = CGFloat(px)
let k = size / view
ctx.translateBy(x: 0, y: size)
ctx.scaleBy(x: k, y: -k)
ctx.translateBy(x: -minX, y: -minY)
ctx.setLineCap(.round)
ctx.setLineJoin(.round)

func P(_ x: CGFloat, _ y: CGFloat) -> CGPoint { CGPoint(x: x, y: y) }
func gradient(_ stops: [(String, CGFloat)], _ locs: [CGFloat]) -> CGGradient {
  CGGradient(colorsSpace: space, colors: stops.map { rgb($0.0, $0.1) } as CFArray, locations: locs)!
}
func clipped(_ path: CGPath, _ body: () -> Void) {
  ctx.saveGState(); ctx.addPath(path); ctx.clip(); body(); ctx.restoreGState()
}
func fill(_ path: CGPath, _ color: CGColor) { ctx.addPath(path); ctx.setFillColor(color); ctx.fillPath() }
func stroke(_ path: CGPath, _ color: CGColor, _ width: CGFloat) {
  ctx.addPath(path); ctx.setStrokeColor(color); ctx.setLineWidth(width); ctx.strokePath()
}
func circle(_ c: CGPoint, _ r: CGFloat) -> CGPath { CGPath(ellipseIn: CGRect(x: c.x - r, y: c.y - r, width: 2 * r, height: 2 * r), transform: nil) }

let C = P(50, 50), R: CGFloat = 33
let sphere = circle(C, R)

// Shapes
let soil = CGMutablePath()
soil.move(to: P(10, 64))
soil.addQuadCurve(to: P(50, 63), control: P(30, 58))
soil.addQuadCurve(to: P(90, 61), control: P(70, 68))
soil.addLine(to: P(90, 100)); soil.addLine(to: P(10, 100)); soil.closeSubpath()
let soilEdge = CGMutablePath()
soilEdge.move(to: P(10, 64))
soilEdge.addQuadCurve(to: P(50, 63), control: P(30, 58))
soilEdge.addQuadCurve(to: P(90, 61), control: P(70, 68))

let stem = CGMutablePath()
stem.move(to: P(50, 63)); stem.addCurve(to: P(50, 43), control1: P(50, 55), control2: P(49, 50))
let leftLeaf = CGMutablePath()
leftLeaf.move(to: P(50, 51))
leftLeaf.addCurve(to: P(33, 37), control1: P(41, 51), control2: P(34, 46))
leftLeaf.addCurve(to: P(50, 51), control1: P(42, 37), control2: P(49, 42))
leftLeaf.closeSubpath()
let rightLeaf = CGMutablePath()
rightLeaf.move(to: P(50, 44))
rightLeaf.addCurve(to: P(67, 27), control1: P(50, 34), control2: P(56, 28))
rightLeaf.addCurve(to: P(50, 44), control1: P(67, 37), control2: P(61, 43))
rightLeaf.closeSubpath()
let leftVein = CGMutablePath(); leftVein.move(to: P(48.8, 49.6)); leftVein.addQuadCurve(to: P(36, 39.5), control: P(42, 43))
let rightVein = CGMutablePath(); rightVein.move(to: P(51.4, 42.4)); rightVein.addQuadCurve(to: P(64.5, 29.5), control: P(58, 34))
let highlight = CGMutablePath(); highlight.move(to: P(27, 38)); highlight.addQuadCurve(to: P(40, 22), control: P(30, 26))

if mono {
  // Single-colour silhouette (Android themed icon / notification): alpha carries the shape.
  stroke(sphere, white, 3.2)
  clipped(sphere) { fill(soil, white) }
  stroke(stem, white, 3.4)
  fill(leftLeaf, white); fill(rightLeaf, white)
  stroke(highlight, white, 3.2)
} else {
  let dark = mode == "dark" || mode == "tinted"

  // Background + nebula glow
  if opaque {
    ctx.setFillColor(rgb(dark ? "000000" : "07061A"))
    ctx.fill(CGRect(x: minX - 10, y: minY - 10, width: view + 20, height: view + 20))
    let glow = gradient([("C9B6FF", dark ? 0.16 : 0.34), ("C9B6FF", 0)], [0, 1])
    ctx.drawRadialGradient(glow, startCenter: P(50, 54), startRadius: 0, endCenter: P(50, 54), endRadius: 52, options: [])
    if mode != "dark" {
      let pink = gradient([("FF9ECF", 0.12), ("FF9ECF", 0)], [0, 1])
      ctx.drawRadialGradient(pink, startCenter: P(86, 90), startRadius: 0, endCenter: P(86, 90), endRadius: 40, options: [])
    }
  }

  if mode != "bg" {
    if detailed && opaque {
      for (x, y, r, o) in [(18.0, 20.0, 0.9, 0.7), (84.0, 18.0, 0.7, 0.5), (86.0, 70.0, 1.0, 0.6), (14.0, 74.0, 0.7, 0.45), (72.0, 10.0, 0.6, 0.4)] {
        fill(circle(P(x, y), r), rgb("FFFFFF", o))
      }
    }
    // Contact shadow below the sphere
    if detailed {
      let shadow = gradient([("000000", 0.55), ("000000", 0)], [0, 1])
      ctx.saveGState()
      ctx.translateBy(x: 50, y: 86); ctx.scaleBy(x: 1, y: 0.16)
      ctx.drawRadialGradient(shadow, startCenter: .zero, startRadius: 0, endCenter: .zero, endRadius: 24, options: [])
      ctx.restoreGState()
    }

    // Glass body
    clipped(sphere) {
      let body = gradient([("2E2470", 1), ("15103D", 1), ("0B0826", 1)], [0, 0.6, 1])
      ctx.drawRadialGradient(body, startCenter: P(38, 32), startRadius: 0, endCenter: P(44, 40), endRadius: 46, options: [.drawsAfterEndLocation])

      // Soil = goal level (lilac → pink), shaded towards the bottom
      clipped(soil) {
        ctx.drawLinearGradient(gradient([("C9B6FF", 1), ("FF9ECF", 1)], [0, 1]), start: P(17, 0), end: P(83, 0), options: [])
        ctx.drawLinearGradient(gradient([("07061A", 0), ("07061A", 0.45)], [0, 1]), start: P(0, 62), end: P(0, 84), options: [])
        if detailed {
          for (x, y, r) in [(34.0, 70.0, 1.1), (44.0, 76.0, 0.8), (58.0, 71.0, 1.0), (66.0, 77.0, 0.8), (40.0, 68.0, 0.6), (62.0, 66.5, 0.6)] {
            fill(circle(P(x, y), r), rgb("FFFFFF", 0.22))
          }
        }
      }
      stroke(soilEdge, rgb("FFFFFF", 0.4), 1.2)

      // Inner rim light at the bottom-right (glass refraction)
      let rim = CGMutablePath(); rim.addArc(center: C, radius: R - 3, startAngle: .pi * 0.08, endAngle: .pi * 0.42, clockwise: false)
      stroke(rim, rgb("8FE3F0", detailed ? 0.35 : 0.25), 1.6)
    }

    // Sprout
    stroke(stem, rgb("B8F2D4"), 3.2)
    clipped(leftLeaf) {
      ctx.drawLinearGradient(gradient([("3FB88F", 1), ("C8F7DF", 1)], [0, 1]), start: P(50, 51), end: P(33, 37), options: [])
    }
    clipped(rightLeaf) {
      ctx.drawLinearGradient(gradient([("8FE3F0", 1), ("F0FFF8", 1)], [0, 1]), start: P(50, 44), end: P(67, 27), options: [])
    }
    if detailed {
      stroke(leftVein, rgb("07061A", 0.25), 1.0)
      stroke(rightVein, rgb("07061A", 0.2), 1.0)
      // Dew drop catching the light
      fill(circle(P(62, 33), 1.5), rgb("FFFFFF", 0.85))
    }

    // Glass rim + highlights
    stroke(sphere, rgb("C9B6FF", 0.6), 1.6)
    stroke(highlight, rgb("FFFFFF", 0.5), 3)
    fill(circle(P(44, 20.5), 1.4), rgb("FFFFFF", 0.55))
  }
}

var img = ctx.makeImage()!

// Tinted (iOS 18+): grayscale artwork on black; the system applies the user's tint.
if mode == "tinted" {
  let ci = CIImage(cgImage: img).applyingFilter("CIColorControls", parameters: [kCIInputSaturationKey: 0, kCIInputContrastKey: 1.15])
  img = CIContext().createCGImage(ci, from: ci.extent, format: .RGBA8, colorSpace: space)!
  let flat = CGContext(data: nil, width: px, height: px, bitsPerComponent: 8, bytesPerRow: 0, space: space,
                       bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
  flat.draw(img, in: CGRect(x: 0, y: 0, width: size, height: size))
  img = flat.makeImage()!
}

let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: out) as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(dest, img, nil)
CGImageDestinationFinalize(dest)
print("wrote \((out as NSString).lastPathComponent) \(px)px \(mode)")
