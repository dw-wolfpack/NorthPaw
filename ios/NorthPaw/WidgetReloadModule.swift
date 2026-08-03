import Foundation
import WidgetKit
import React

@objc(WidgetReloadModule)
class WidgetReloadModule: NSObject {

  @objc
  func reloadWidget(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
      resolve(true)
    } else {
      resolve(false)
    }
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
