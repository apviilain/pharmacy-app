#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <Speech/Speech.h>

@interface SpeechRecognizerModule
    : RCTEventEmitter <RCTBridgeModule, SFSpeechRecognizerDelegate>

@end
