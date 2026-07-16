#import "SpeechRecognizerModule.h"

#import <AVFoundation/AVFoundation.h>

@implementation SpeechRecognizerModule {
  SFSpeechRecognizer *_speechRecognizer;
  SFSpeechAudioBufferRecognitionRequest *_recognitionRequest;
  SFSpeechRecognitionTask *_recognitionTask;
  AVAudioEngine *_audioEngine;
}

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents {
  return @[
    @"onSpeechStart",
    @"onSpeechEnd",
    @"onSpeechResults",
    @"onSpeechPartialResults",
    @"onSpeechError"
  ];
}

- (void)startObserving {}

- (void)stopObserving {}

RCT_EXPORT_METHOD(startListening:(NSString *)localeString) {
  [SFSpeechRecognizer
      requestAuthorization:^(SFSpeechRecognizerAuthorizationStatus status) {
        if (status != SFSpeechRecognizerAuthorizationStatusAuthorized) {
          [self sendEventWithName:@"onSpeechError"
                             body:@{
                               @"message" : @"Speech recognition permission denied."
                             }];
          return;
        }

        [[AVAudioSession sharedInstance]
            requestRecordPermission:^(BOOL granted) {
              if (!granted) {
                [self sendEventWithName:@"onSpeechError"
                                   body:@{
                                     @"message" : @"Microphone permission denied."
                                   }];
                return;
              }

              dispatch_async(dispatch_get_main_queue(), ^{
                [self beginListeningWithLocale:localeString];
              });
            }];
      }];
}

RCT_EXPORT_METHOD(stopListening) {
  dispatch_async(dispatch_get_main_queue(), ^{
    [self->_audioEngine stop];
    [self->_recognitionRequest endAudio];
    [self sendEventWithName:@"onSpeechEnd" body:nil];
  });
}

RCT_EXPORT_METHOD(destroy) {
  dispatch_async(dispatch_get_main_queue(), ^{
    [self cleanup];
  });
}

- (void)beginListeningWithLocale:(NSString *)localeString {
  NSLocale *locale = [NSLocale localeWithLocaleIdentifier:localeString];
  _speechRecognizer = [[SFSpeechRecognizer alloc] initWithLocale:locale];
  _speechRecognizer.delegate = self;

  NSError *sessionError = nil;
  [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryRecord
                                          mode:AVAudioSessionModeMeasurement
                                       options:AVAudioSessionCategoryOptionDuckOthers
                                         error:&sessionError];
  [[AVAudioSession sharedInstance]
      setActive:YES
    withOptions:AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation
          error:&sessionError];

  if (sessionError) {
    [self sendEventWithName:@"onSpeechError"
                       body:@{@"message" : sessionError.localizedDescription}];
    return;
  }

  _audioEngine = [[AVAudioEngine alloc] init];

  if (_recognitionTask) {
    [_recognitionTask cancel];
    _recognitionTask = nil;
  }

  _recognitionRequest = [[SFSpeechAudioBufferRecognitionRequest alloc] init];
  _recognitionRequest.shouldReportPartialResults = YES;

  __weak typeof(self) weakSelf = self;
  _recognitionTask = [_speechRecognizer
      recognitionTaskWithRequest:_recognitionRequest
                   resultHandler:^(SFSpeechRecognitionResult *_Nullable result,
                                   NSError *_Nullable error) {
                     if (error) {
                       [weakSelf
                           sendEventWithName:@"onSpeechError"
                                        body:@{
                                          @"message" : error.localizedDescription
                                        }];
                       [weakSelf cleanup];
                     } else if (result) {
                       NSString *text =
                           result.bestTranscription.formattedString ?: @"";
                       if (result.isFinal) {
                         [weakSelf sendEventWithName:@"onSpeechResults"
                                                 body:@{@"value" : text}];
                         [weakSelf cleanup];
                       } else {
                         [weakSelf
                             sendEventWithName:@"onSpeechPartialResults"
                                          body:@{@"value" : text}];
                       }
                     }
                   }];

  AVAudioInputNode *inputNode = _audioEngine.inputNode;
  AVAudioFormat *recordingFormat = [inputNode outputFormatForBus:0];
  [inputNode removeTapOnBus:0];
  [inputNode installTapOnBus:0
                  bufferSize:1024
                      format:recordingFormat
                       block:^(AVAudioPCMBuffer *_Nonnull buffer,
                               AVAudioTime *_Nonnull when) {
                         [self->_recognitionRequest appendAudioPCMBuffer:buffer];
                       }];

  [_audioEngine prepare];
  NSError *audioError = nil;
  [_audioEngine startAndReturnError:&audioError];

  if (audioError) {
    [self sendEventWithName:@"onSpeechError"
                       body:@{@"message" : audioError.localizedDescription}];
    [self cleanup];
  } else {
    [self sendEventWithName:@"onSpeechStart" body:nil];
  }
}

- (void)cleanup {
  [_audioEngine stop];
  [_audioEngine.inputNode removeTapOnBus:0];
  [_recognitionTask cancel];
  _recognitionRequest = nil;
  _recognitionTask = nil;
  _speechRecognizer = nil;
  _audioEngine = nil;
}

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

@end
