import React from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  NativeEventEmitter,
  NativeModules,
  PermissionsAndroid,
  Platform,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Voice from "@react-native-voice/voice";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { Crosshair, Mic, Search, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../state/authStore";
import { useLocationSelectionStore } from "../../state/locationSelectionStore";
import { locationService } from "../../services/locationService";
import { colors } from "../../theme/colors";
import { scale, verticalScale } from "../../theme/responsive";
import { typography } from "../../theme/typography";

const DELHI_FALLBACK = {
  latitude: 28.6139,
  longitude: 77.209,
};

const { SpeechRecognizerModule } = NativeModules as {
  SpeechRecognizerModule?: {
    startListening?: (locale: string) => void;
    stopListening?: () => void;
    destroy?: () => void;
  };
};



const searchLocationByQuery = async (query: string) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(
      query,
    )}`,
    {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en-IN",
        "User-Agent": "PharmacyApp/1.0 (admin@freenace.com)",
      },
    },
  );
  const payload = (await response.json()) as Array<{
    lat?: string;
    lon?: string;
    display_name?: string;
    name?: string;
  }>;

  return payload.map((result) => ({
    coords: {
      latitude: Number(result.lat),
      longitude: Number(result.lon),
    },
    title: result.name || query,
    subtitle: result.display_name || query,
  }));
};

export const SelectLocationScreen = () => {
  const insets = useSafeAreaInsets();
  const initialLocationSelection = React.useMemo(
    () => useLocationSelectionStore.getState(),
    [],
  );
  const speechEventEmitter = React.useMemo(
    () =>
      SpeechRecognizerModule
        ? new NativeEventEmitter(SpeechRecognizerModule as never)
        : null,
    [],
  );
  const mapRef = React.useRef<MapView>(null);
  const pulseAnim = React.useRef(new Animated.Value(0)).current;
  const waveAnim = React.useRef(new Animated.Value(0)).current;
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<
    Array<{
      coords: { latitude: number; longitude: number };
      title: string;
      subtitle: string;
    }>
  >([]);
  const [isListening, setIsListening] = React.useState(false);
  const [isResolvingSearch, setIsResolvingSearch] = React.useState(false);
  const [coords, setCoords] = React.useState(initialLocationSelection.coords);
  const [status, setStatus] = React.useState(initialLocationSelection.status);
  const [message, setMessage] = React.useState(
    initialLocationSelection.message,
  );
  const [title, setTitle] = React.useState(initialLocationSelection.title);
  const [subtitle, setSubtitle] = React.useState(
    initialLocationSelection.subtitle,
  );
  const profileUser = useAuthStore((state) => state.user);
  const profileCity = String(profileUser?.city || "Delhi");
  const profileState = String(profileUser?.state || "Saved address");
  const profileLatitude = Number(profileUser?.latitude);
  const profileLongitude = Number(profileUser?.longitude);

  const profileCoords = React.useMemo(() => {
    if (Number.isFinite(profileLatitude) && Number.isFinite(profileLongitude)) {
      return {
        latitude: profileLatitude,
        longitude: profileLongitude,
      };
    }

    return DELHI_FALLBACK;
  }, [profileLatitude, profileLongitude]);

  const previewCoords = coords || profileCoords;
  const mapRegion = React.useMemo<Region>(
    () => ({
      latitude: previewCoords.latitude,
      longitude: previewCoords.longitude,
      latitudeDelta: 0.045,
      longitudeDelta: 0.045,
    }),
    [previewCoords.latitude, previewCoords.longitude],
  );

  React.useEffect(() => {
    if (!coords) {
      setCoords(profileCoords);
      setTitle(profileCity);
      setSubtitle(`${profileCity}, ${profileState}`);
      setStatus("granted");
    }
  }, [coords, profileCity, profileCoords, profileState]);

  const animateToCoords = React.useCallback(
    (nextLatitude: number, nextLongitude: number) => {
      mapRef.current?.animateToRegion(
        {
          latitude: nextLatitude,
          longitude: nextLongitude,
          latitudeDelta: 0.045,
          longitudeDelta: 0.045,
        },
        320,
      );
    },
    [],
  );

  const updateSelectedLocation = React.useCallback(
    async (
      nextLatitude: number,
      nextLongitude: number,
      nextMessage = "Address updated from map selection.",
    ) => {
      const nextCoords = {
        latitude: nextLatitude,
        longitude: nextLongitude,
      };

      setCoords(nextCoords);
      setStatus("granted");
      setMessage(nextMessage);

      try {
        const resolvedAddress = await locationService.reverseGeocodeLocation(
          nextLatitude,
          nextLongitude,
        );
        setTitle(resolvedAddress.title);
        setSubtitle(resolvedAddress.subtitle);
      } catch {
        setTitle("Selected location");
        setSubtitle("Location details not available");
      }
    },
    [],
  );

  React.useEffect(() => {
    if (!isListening) {
      pulseAnim.stopAnimation();
      waveAnim.stopAnimation();
      pulseAnim.setValue(0);
      waveAnim.setValue(0);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    const waveLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    pulseLoop.start();
    waveLoop.start();

    return () => {
      pulseLoop.stop();
      waveLoop.stop();
    };
  }, [isListening, pulseAnim, waveAnim]);

  const requestCurrentLocation = React.useCallback(async () => {
    setStatus("loading");
    setMessage("");

    try {
      const result = await locationService.requestCurrentLocation();

      if (result.status === "granted" && result.coords) {
        animateToCoords(result.coords.latitude, result.coords.longitude);
        await updateSelectedLocation(
          result.coords.latitude,
          result.coords.longitude,
          result.message || "Current location selected.",
        );
        return;
      }

      setStatus(result.status);
      setMessage(result.message || "");
    } catch (error) {
      const nextMessage =
        error instanceof Error
          ? error.message
          : "Unable to access your current location.";
      setStatus("unavailable");
      setMessage(nextMessage);
    }
  }, [animateToCoords, updateSelectedLocation]);

  React.useEffect(() => {
    if (status !== "idle") return;
    requestCurrentLocation().catch(() => {});
  }, [requestCurrentLocation, status]);

  React.useEffect(() => {
    if (speechEventEmitter && SpeechRecognizerModule) {
      const onStart = speechEventEmitter.addListener("onSpeechStart", () => {
        setIsListening(true);
      });
      const onEnd = speechEventEmitter.addListener("onSpeechEnd", () => {
        setIsListening(false);
      });
      const onResults = speechEventEmitter.addListener(
        "onSpeechResults",
        (event: { value?: string }) => {
          const nextText = event?.value?.trim();
          if (nextText) {
            setSearchQuery(nextText);
          }
        },
      );
      const onPartial = speechEventEmitter.addListener(
        "onSpeechPartialResults",
        (event: { value?: string }) => {
          const nextText = event?.value?.trim();
          if (nextText) {
            setSearchQuery(nextText);
          }
        },
      );
      const onError = speechEventEmitter.addListener(
        "onSpeechError",
        (event: {
          message?: string;
          error?: number | { message?: string };
        }) => {
          setIsListening(false);
          const rawMessage =
            typeof event?.error === "object"
              ? event.error?.message
              : event?.message;
          const errorMessage = String(rawMessage || "").trim();
          if (errorMessage && !/cancel|no match|aborted/i.test(errorMessage)) {
            Alert.alert("Voice Search", errorMessage);
          }
        },
      );

      return () => {
        onStart.remove();
        onEnd.remove();
        onResults.remove();
        onPartial.remove();
        onError.remove();
        SpeechRecognizerModule.destroy?.();
      };
    }

    Voice.onSpeechStart = () => {
      setIsListening(true);
    };
    Voice.onSpeechEnd = () => {
      setIsListening(false);
    };
    Voice.onSpeechResults = (event) => {
      const nextText = event.value?.[0]?.trim();
      if (nextText) {
        setSearchQuery(nextText);
      }
    };
    Voice.onSpeechPartialResults = (event) => {
      const nextText = event.value?.[0]?.trim();
      if (nextText) {
        setSearchQuery(nextText);
      }
    };
    Voice.onSpeechError = (event) => {
      setIsListening(false);
      const errorMessage = event.error?.message?.trim();
      if (errorMessage && !/cancel|no match|aborted/i.test(errorMessage)) {
        Alert.alert("Voice Search", errorMessage);
      }
    };

    return () => {
      Voice.destroy()
        .catch(() => {})
        .finally(() => {
          Voice.removeAllListeners();
        });
    };
  }, [speechEventEmitter]);

  const openSettings = React.useCallback(() => {
    locationService.openSettings().catch(() => {
      Alert.alert(
        "Unable to open settings",
        "Please open app settings manually and allow location access.",
      );
    });
  }, []);

  const handleVoiceSearch = React.useCallback(async () => {
    try {
      if (isListening) {
        if (SpeechRecognizerModule) {
          SpeechRecognizerModule.stopListening?.();
        } else {
          await Voice.stop();
        }
        setIsListening(false);
        return;
      }

      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "Microphone Permission",
            message: "This app needs microphone access for voice search.",
            buttonPositive: "Allow",
            buttonNegative: "Deny",
          },
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          return;
        }
      }

      setSearchQuery("");
      if (SpeechRecognizerModule) {
        SpeechRecognizerModule.startListening?.("en-IN");
      } else {
        await Voice.start("en-IN");
      }
    } catch (error) {
      setIsListening(false);
      const nextMessage =
        error instanceof Error
          ? error.message
          : "Unable to start voice search right now.";
      Alert.alert("Voice Search", nextMessage);
    }
  }, [isListening]);

  const handleSelectSearchResult = React.useCallback(
    (result: {
      coords: { latitude: number; longitude: number };
      title: string;
      subtitle: string;
    }) => {
      animateToCoords(result.coords.latitude, result.coords.longitude);
      setCoords(result.coords);
      setTitle(result.title);
      setSubtitle(result.subtitle);
      setStatus("granted");
      setMessage("Search result selected.");
      setSearchResults([]);
      setSearchQuery(result.title);
    },
    [animateToCoords],
  );

  const submitLocationSearch = React.useCallback(async () => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      setIsResolvingSearch(true);
      const results = await searchLocationByQuery(trimmedQuery);
      setSearchResults(results);
    } catch (error) {
      const nextMessage =
        error instanceof Error
          ? error.message
          : "Unable to search this location right now.";
      Alert.alert("Location Search", nextMessage);
      setSearchResults([]);
    } finally {
      setIsResolvingSearch(false);
    }
  }, [searchQuery]);

  React.useEffect(() => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      submitLocationSearch().catch(() => {});
    }, 650);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, submitLocationSearch]);

  const clearSearchText = React.useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  const handleMapSelection = React.useCallback(
    (nextLatitude: number, nextLongitude: number) => {
      animateToCoords(nextLatitude, nextLongitude);
      updateSelectedLocation(
        nextLatitude,
        nextLongitude,
        "Pin location selected.",
      ).catch(() => {});
    },
    [animateToCoords, updateSelectedLocation],
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
      >
        <View style={styles.mapShell}>
          <MapView
            ref={mapRef}
            style={styles.mapView}
            provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
            initialRegion={mapRegion}
            onPress={({ nativeEvent }) =>
              handleMapSelection(
                nativeEvent.coordinate.latitude,
                nativeEvent.coordinate.longitude,
              )
            }
            showsUserLocation={status === "granted"}
            showsMyLocationButton={false}
            loadingEnabled
            mapPadding={{
              top: verticalScale(88),
              right: scale(18),
              bottom: verticalScale(88),
              left: scale(18),
            }}
          >
            <Marker
              coordinate={previewCoords}
              draggable
              title={title}
              description={subtitle}
              onDragEnd={({ nativeEvent }) =>
                handleMapSelection(
                  nativeEvent.coordinate.latitude,
                  nativeEvent.coordinate.longitude,
                )
              }
            />
          </MapView>

          <View style={styles.searchBar}>
            <Search size={scale(18)} color={colors.textSecondary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => {
                const trimmedQuery = searchQuery.trim();
                if (trimmedQuery.length >= 3) {
                  submitLocationSearch().catch(() => {});
                }
              }}
              placeholder="Search area, landmark, or pincode"
              placeholderTextColor="#7C8BA1"
              style={styles.searchInput}
            />
            {searchQuery.trim().length ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={clearSearchText}
                style={styles.clearButton}
              >
                <X size={scale(14)} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
            {isResolvingSearch ? (
              <View style={styles.searchLoaderWrap}>
                <ActivityIndicator size="small" color={colors.primaryBlue} />
              </View>
            ) : null}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleVoiceSearch}
              style={[
                styles.voiceButton,
                isListening && styles.voiceButtonActive,
              ]}
            >
              {isListening ? (
                <>
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.voiceWave,
                      {
                        opacity: waveAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.34, 0],
                        }),
                        transform: [
                          {
                            scale: waveAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.95],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.voicePulse,
                      {
                        transform: [
                          {
                            scale: pulseAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.14],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                </>
              ) : null}
              <Mic
                size={scale(17)}
                color={isListening ? "#FFFFFF" : colors.primaryBlue}
              />
            </TouchableOpacity>
          </View>

          {searchResults.length > 0 ? (
            <View style={styles.searchResultsContainer}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                style={styles.searchResultsList}
              >
                {searchResults.map((result, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.searchResultItem}
                    onPress={() => handleSelectSearchResult(result)}
                  >
                    <Text style={styles.searchResultTitle} numberOfLines={1}>
                      {result.title}
                    </Text>
                    <Text style={styles.searchResultSubtitle} numberOfLines={2}>
                      {result.subtitle}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {isListening ? (
            <View style={styles.listeningBadge} pointerEvents="none">
              <View style={styles.listeningBars}>
                {[0, 1, 2].map((index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.listeningBar,
                      {
                        transform: [
                          {
                            scaleY: pulseAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange:
                                index === 1 ? [0.72, 1.28] : [0.88, 1.06],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.listeningText}>Listening...</Text>
            </View>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => requestCurrentLocation().catch(() => {})}
            style={styles.currentLocationFab}
          >
            {status === "loading" ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Crosshair size={scale(20)} color="#FFFFFF" strokeWidth={2.4} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.addressStrip}>
          <Text style={styles.addressStripLabel}>Selected Address</Text>
          <Text style={styles.addressStripTitle}>{title}</Text>
          <Text style={styles.addressStripSubtitle}>{subtitle}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.goBack()}
          style={styles.inlineSpacer}
        />
      </ScrollView>

      <View
        style={[
          styles.bottomActionBar,
          { paddingBottom: Math.max(insets.bottom, verticalScale(10)) },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            if (coords) {
              useLocationSelectionStore.getState().setDeviceLocation(coords, {
                title,
                subtitle,
                message,
              });
            }
            useLocationSelectionStore
              .getState()
              .setLocationStatus(status, message);
            navigation.goBack();
          }}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Save Address</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F9FF",
  },
  scrollContent: {
    paddingBottom: verticalScale(150),
  },
  mapShell: {
    marginHorizontal: scale(16),
    marginTop: verticalScale(16),
    borderRadius: scale(24),
    overflow: "hidden",
    backgroundColor: "#DDE9F4",
    height: verticalScale(360),
    borderWidth: 1,
    borderColor: "#D9E6F4",
  },
  mapView: {
    flex: 1,
    backgroundColor: "#DDE9F4",
  },
  addressStrip: {
    marginHorizontal: scale(16),
    marginTop: verticalScale(12),
    marginBottom: verticalScale(16),
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(14),
    borderRadius: scale(20),
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9E4F0",
  },
  addressStripLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(11),
    color: colors.primaryBlue,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: verticalScale(4),
  },
  addressStripTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(16),
    color: colors.textHeader,
    marginBottom: verticalScale(2),
  },
  addressStripSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: scale(13),
    color: colors.textSecondary,
    lineHeight: scale(18),
  },
  searchBar: {
    position: "absolute",
    left: scale(16),
    right: scale(16),
    top: verticalScale(18),
    minHeight: verticalScale(56),
    borderRadius: scale(22),
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  searchInput: {
    flex: 1,
    marginLeft: scale(10),
    paddingVertical: 0,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
  },
  clearButton: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: scale(8),
  },
  searchLoaderWrap: {
    marginLeft: scale(8),
    width: scale(24),
    alignItems: "center",
    justifyContent: "center",
  },
  searchResultsContainer: {
    position: "absolute",
    top: verticalScale(80),
    left: scale(16),
    right: scale(16),
    maxHeight: verticalScale(200),
    backgroundColor: "#FFFFFF",
    borderRadius: scale(16),
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
    zIndex: 10,
    overflow: "hidden",
  },
  searchResultsList: {
    flexGrow: 0,
  },
  searchResultItem: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  searchResultTitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(14),
    color: colors.textHeader,
    marginBottom: verticalScale(2),
  },
  searchResultSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: scale(12),
    color: colors.textSecondary,
  },
  voiceButton: {
    overflow: "visible",
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "#EDF5FF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: scale(10),
  },
  voiceButtonActive: {
    backgroundColor: colors.primaryBlue,
  },
  voiceWave: {
    position: "absolute",
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "rgba(21, 114, 183, 0.28)",
  },
  voicePulse: {
    position: "absolute",
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  listeningBadge: {
    position: "absolute",
    top: verticalScale(84),
    left: scale(18),
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: scale(18),
    backgroundColor: "rgba(9, 34, 53, 0.7)",
  },
  listeningBars: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(3),
    marginRight: scale(8),
  },
  listeningBar: {
    width: scale(3),
    height: verticalScale(12),
    borderRadius: scale(2),
    backgroundColor: "#FFFFFF",
  },
  listeningText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(12),
    color: "#FFFFFF",
  },
  currentLocationFab: {
    position: "absolute",
    right: scale(18),
    bottom: verticalScale(24),
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    backgroundColor: colors.primaryBlue,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 4,
  },
  primaryButton: {
    minHeight: verticalScale(54),
    borderRadius: scale(20),
    backgroundColor: colors.primaryBlue,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: scale(16),
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 5,
  },
  inlineSpacer: {
    height: 0,
  },
  bottomActionBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: verticalScale(12),
    backgroundColor: "rgba(245,249,255,0.96)",
    borderTopWidth: 1,
    borderTopColor: "#DCE8F5",
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: "#FFFFFF",
  },
  secondaryButton: {
    minHeight: verticalScale(50),
    borderRadius: scale(18),
    borderWidth: 1,
    borderColor: "#D9E4F0",
    backgroundColor: "#F9FBFE",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: scale(8),
  },
  secondaryButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.primaryBlue,
  },
});
