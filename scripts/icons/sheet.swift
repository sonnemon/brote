import CoreGraphics
import CoreText
import Foundation
import ImageIO
import UniformTypeIdentifiers

// Contact sheet of the Brote icon set. usage: sheet <assets/icons dir> <out.png>
let dir = CommandLine.arguments[1], out = CommandLine.arguments[2]
func load(_ name: String) -> CGImage {
  let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: "\(dir)/\(name)") as CFURL, nil)!
  return CGImageSourceCreateImageAtIndex(src, 0, nil)!
}

enum Shape { case squircle, circle, plain }
let items: [(String, [String], Shape, String)] = [
  ("iOS · light", ["ios-light.png"], .squircle, "1024 · opaco"),
  ("iOS · dark", ["ios-dark.png"], .squircle, "1024 · opaco"),
  ("iOS · tinted", ["ios-tinted.png"], .squircle, "1024 · grises"),
  ("Android adaptive", ["android-background.png", "android-foreground.png"], .circle, "fondo + frente 512"),
  ("Android monocromo", ["android-monochrome.png"], .circle, "temático 512"),
  ("Notificación", ["notification.png"], .plain, "96 · blanco"),
  ("Splash", ["splash.png"], .plain, "1024 · transparente"),
  ("Favicon", ["favicon.png"], .squircle, "48"),
]

let cols = 4, tile: CGFloat = 300, icon: CGFloat = 200, pad: CGFloat = 24
let W = Int(CGFloat(cols) * tile), H = Int(CGFloat((items.count + cols - 1) / cols) * tile)
let space = CGColorSpace(name: CGColorSpace.sRGB)!
let ctx = CGContext(data: nil, width: W, height: H, bitsPerComponent: 8, bytesPerRow: 0, space: space,
                    bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
ctx.setFillColor(CGColor(srgbRed: 0.09, green: 0.09, blue: 0.11, alpha: 1))
ctx.fill(CGRect(x: 0, y: 0, width: W, height: H))
ctx.interpolationQuality = .high

func text(_ s: String, _ x: CGFloat, _ y: CGFloat, _ size: CGFloat, _ alpha: CGFloat) {
  let font = CTFontCreateWithName("SFProText-Regular" as CFString, size, nil)
  let attr = NSAttributedString(string: s, attributes: [
    NSAttributedString.Key(kCTFontAttributeName as String): font,
    NSAttributedString.Key(kCTForegroundColorAttributeName as String): CGColor(srgbRed: 1, green: 1, blue: 1, alpha: alpha),
  ])
  let line = CTLineCreateWithAttributedString(attr)
  let w = CTLineGetTypographicBounds(line, nil, nil, nil)
  ctx.textPosition = CGPoint(x: x - CGFloat(w) / 2, y: y)
  CTLineDraw(line, ctx)
}

for (i, item) in items.enumerated() {
  let col = CGFloat(i % cols), row = CGFloat(i / cols)
  let ox = col * tile, oy = CGFloat(H) - (row + 1) * tile
  let rect = CGRect(x: ox + (tile - icon) / 2, y: oy + pad + 56, width: icon, height: icon)
  ctx.saveGState()
  switch item.2 {
  case .squircle: ctx.addPath(CGPath(roundedRect: rect, cornerWidth: icon * 0.225, cornerHeight: icon * 0.225, transform: nil)); ctx.clip()
  case .circle: ctx.addPath(CGPath(ellipseIn: rect, transform: nil)); ctx.clip()
  case .plain:
    ctx.setFillColor(CGColor(srgbRed: 0.03, green: 0.02, blue: 0.1, alpha: 1))
    ctx.fill(rect)
  }
  if item.0 == "Android monocromo" {
    ctx.setFillColor(CGColor(srgbRed: 0.2, green: 0.25, blue: 0.22, alpha: 1)); ctx.fill(rect)
  }
  for name in item.1 {
    let img = load(name)
    let r = item.0 == "Notificación" ? rect.insetBy(dx: 52, dy: 52) : rect
    ctx.draw(img, in: r)
  }
  ctx.restoreGState()
  text(item.0, ox + tile / 2, oy + pad + 22, 22, 0.95)
  text(item.3, ox + tile / 2, oy + pad, 16, 0.55)
}

let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: out) as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(dest, ctx.makeImage()!, nil)
CGImageDestinationFinalize(dest)
print("wrote \(out)")
