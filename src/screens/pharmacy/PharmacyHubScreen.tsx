import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Activity,
  ArrowRightLeft,
  Boxes,
  BriefcaseMedical,
  ChevronRight,
  ClipboardList,
  Clock3,
  CreditCard,
  Pill,
  Users,
} from "lucide-react-native";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Rect,
  Stop,
} from "react-native-svg";

import type { RootStackParamList } from "../../navigation/types";
import { colors } from "../../theme/colors";
import { scale, verticalScale } from "../../theme/responsive";
import { shadows } from "../../theme/shadows";
import { typography } from "../../theme/typography";
import { spacing } from "../../theme/tokens";

type PharmacyRouteName =
  | "PharmacyMedicines"
  | "PharmacyInventory"
  | "PharmacyOrders"
  | "PharmacyCustomers"
  | "PharmacySubscriptions"
  | "PatientTracking"
  | "Wallet"
  | "Diagnostics"
  | "FindDoctor";

type HubCard = {
  id: string;
  title: string;
  subtitle: string;
  route: PharmacyRouteName;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  gradient: [string, string];
  shadowColor: string;
};

const HUB_CARDS: HubCard[] = [
  {
    id: "medicines",
    title: "Medicines",
    subtitle: "Catalog & availability",
    route: "PharmacyMedicines",
    icon: Pill,
    gradient: ["#1687D4", "#0E6FAE"],
    shadowColor: "#0E6FAE",
  },
  {
    id: "inventory",
    title: "Inventory",
    subtitle: "Stock & batches",
    route: "PharmacyInventory",
    icon: Boxes,
    gradient: ["#20A86B", "#148452"],
    shadowColor: "#148452",
  },
  {
    id: "orders",
    title: "Orders",
    subtitle: "Track fulfilment",
    route: "PharmacyOrders",
    icon: ClipboardList,
    gradient: ["#F5A623", "#D9820B"],
    shadowColor: "#D9820B",
  },
  {
    id: "customers",
    title: "Customers",
    subtitle: "Profiles & refills",
    route: "PharmacyCustomers",
    icon: Users,
    gradient: ["#FF5A6A", "#F03E64"],
    shadowColor: "#E6496A",
  },
  {
    id: "subscriptions",
    title: "Subscriptions",
    subtitle: "Auto refill plans",
    route: "PharmacySubscriptions",
    icon: Clock3,
    gradient: ["#9B6DFF", "#7A4AE8"],
    shadowColor: "#7A4AE8",
  },
  {
    id: "tracking",
    title: "Tracking",
    subtitle: "Patient follow-ups",
    route: "PatientTracking",
    icon: ArrowRightLeft,
    gradient: ["#14B8A6", "#0F8B81"],
    shadowColor: "#0F8B81",
  },
  {
    id: "wallet",
    title: "Wallet",
    subtitle: "Payments & balance",
    route: "Wallet",
    icon: CreditCard,
    gradient: ["#0EA5E9", "#0369A1"],
    shadowColor: "#0369A1",
  },
  {
    id: "doctor-consultation",
    title: "Doctor Consultation",
    subtitle: "Book specialist visits",
    route: "FindDoctor",
    icon: BriefcaseMedical,
    gradient: ["#2563EB", "#1D4ED8"],
    shadowColor: "#1D4ED8",
  },
  {
    id: "diagnostics",
    title: "Diagnostics",
    subtitle: "Tests & bookings",
    route: "Diagnostics",
    icon: Activity,
    gradient: ["#F97316", "#EA580C"],
    shadowColor: "#EA580C",
  },
];

const HubServiceCard = ({
  item,
  onPress,
}: {
  item: HubCard;
  onPress: (route: PharmacyRouteName) => void;
}) => {
  const Icon = item.icon;

  return (
    <View style={[styles.cardWrap, { shadowColor: item.shadowColor }]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onPress(item.route)}
        style={styles.card}
      >
        <Svg
          height="100%"
          width="100%"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Defs>
            <SvgLinearGradient
              id={`pharmacy-hub-${item.id}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <Stop offset="0%" stopColor={item.gradient[0]} stopOpacity="1" />
              <Stop
                offset="100%"
                stopColor={item.gradient[1]}
                stopOpacity="1"
              />
            </SvgLinearGradient>
          </Defs>
          <Rect
            width="100%"
            height="100%"
            fill={`url(#pharmacy-hub-${item.id})`}
          />
        </Svg>

        <View style={styles.cardOrb} />
        <View style={styles.cardIcon}>
          <Icon size={scale(24)} color="#FFFFFF" />
        </View>
        <View style={styles.cardArrow}>
          <ChevronRight size={scale(18)} color="rgba(255,255,255,0.92)" />
        </View>
        <View style={styles.cardTextBlock}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export const PharmacyHubScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleCardPress = React.useCallback(
    (route: PharmacyRouteName) => {
      if (route === "Wallet") {
        navigation.navigate("Wallet", {
          mode: "pharmacy",
          title: "Pharmacy Wallet",
        });
        return;
      }

      navigation.navigate(route);
    },
    [navigation],
  );

  return (
    <ScrollView
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.grid}>
        {HUB_CARDS.map((item) => (
          <HubServiceCard key={item.id} item={item} onPress={handleCardPress} />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: verticalScale(28),
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cardWrap: {
    width: "48%",
    height: verticalScale(150),
    borderRadius: scale(22),
    marginBottom: verticalScale(16),
    ...shadows.medium,
  },
  card: {
    flex: 1,
    borderRadius: scale(22),
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  cardOrb: {
    position: "absolute",
    width: scale(96),
    height: scale(96),
    borderRadius: scale(48),
    right: scale(-14),
    top: verticalScale(-18),
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  cardIcon: {
    position: "absolute",
    top: verticalScale(18),
    left: scale(16),
    width: scale(50),
    height: scale(50),
    borderRadius: scale(16),
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardArrow: {
    position: "absolute",
    top: verticalScale(18),
    right: scale(16),
  },
  cardTextBlock: {
    position: "absolute",
    left: scale(16),
    right: scale(12),
    bottom: verticalScale(18),
  },
  cardTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: "#FFFFFF",
  },
  cardSubtitle: {
    marginTop: verticalScale(4),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: "rgba(255,255,255,0.85)",
  },
});
