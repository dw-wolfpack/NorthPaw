#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetReloadModule, NSObject)

RCT_EXTERN_METHOD(reloadWidget:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
