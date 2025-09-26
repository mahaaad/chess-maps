import "react-native-gesture-handler"; // safe to import here too
import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TextInput,
  TouchableOpacity,
  Platform,
  SafeAreaView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

/** ---------- ZoomableImage (drag + pinch + wheel zoom) ---------- */
type ZoomableImageProps = {
  source: any;      // require(...) or { uri: string }
  minScale?: number;
  maxScale?: number;
};

function ZoomableImage({ source, minScale = 1, maxScale = 4 }: ZoomableImageProps) {
  const scale = useSharedValue(1);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const startScale = useSharedValue(1);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // Pan (mouse/touch drag)
  const pan = Gesture.Pan()
    .onBegin(() => {
      startX.value = offsetX.value;
      startY.value = offsetY.value;
    })
    .onUpdate((e) => {
      offsetX.value = startX.value + e.translationX;
      offsetY.value = startY.value + e.translationY;
    });

  // Pinch (trackpad/touch)
  const pinch = Gesture.Pinch()
    .onBegin(() => {
      startScale.value = scale.value;
    })
    .onUpdate((e) => {
      let next = startScale.value * e.scale;
      if (next < minScale) next = minScale;
      if (next > maxScale) next = maxScale;
      scale.value = next;
    });

  // Mouse wheel zoom (web/desktop)
  const containerRef = useRef<View>(null);
  useEffect(() => {
    // @ts-ignore web-only; native will ignore
    const node = containerRef.current && (containerRef.current as any);
    if (!node || !node.addEventListener) return;

    const onWheel = (e: any) => {
      const factor = e.deltaY > 0 ? 0.95 : 1.05;
      let next = scale.get() * factor;
      if (next < minScale) next = minScale;
      if (next > maxScale) next = maxScale;
      scale.value = next;
      e.preventDefault?.();
    };

    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, []);

  const composed = Gesture.Simultaneous(pan, pinch);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <View ref={containerRef} style={styles.zoomRoot}>
      <GestureDetector gesture={composed}>
        <Animated.View style={[styles.zoomCanvas, animatedStyle]}>
          <ImageBackground source={source} resizeMode="cover" style={styles.mapImage} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

/** ------------------------- Main Screen ------------------------- */
export default function Index() {
  // Fake current user (remote avatar)
  const [me] = useState({
    name: "You",
    avatar: {
      uri: "https://i.natgeofe.com/n/548467d8-c5f1-4551-9f58-6817a8d2c45e/NationalGeographic_2572187_16x9.jpg?w=1200",
    },
  });

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} />

      {/* Header + Search */}
      <View style={styles.headerWrap}>
        <View style={styles.headerRow}>
          <Ionicons name="people" size={22} color="#E6F4EA" style={{ marginRight: 6 }} />
          <Text style={styles.headerTitle}>
            Find <Text style={{ fontWeight: "700" }}>Players</Text>
          </Text>
          <Ionicons name="location" size={18} color="#9BE09B" style={{ marginLeft: 6 }} />
        </View>

        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color="#7C8A93" style={styles.searchIcon} />
          <TextInput
            placeholder="Search"
            placeholderTextColor="#7C8A93"
            style={styles.searchInput}
          />
          <TouchableOpacity style={styles.filterBtn} activeOpacity={0.8}>
            <Ionicons name="options" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map area (draggable/zoomable image) */}
      <View style={styles.mapContainer}>
        <ZoomableImage
          source={require("../assets/images/image 14.png")} // your local mock map
          minScale={1}
          maxScale={4}
        />

        {/* Centered profile marker (fixed over viewport) */}
        <View pointerEvents="none" style={styles.markerCenterWrap}>
          <View style={styles.markerShadow} />
          <View style={styles.markerAvatar}>
            <Image source={me.avatar} style={styles.markerImage} />
          </View>
        </View>

        {/* Big Quick Pairing button (fixed) */}
        <TouchableOpacity activeOpacity={0.85} style={styles.quickPairBtn}>
          <Ionicons name="time-outline" size={18} color="#fff" />
          <Text style={styles.quickPairText}>Quick Pairing</Text>
        </TouchableOpacity>

        {/* Bottom nav (fixed) */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.8}>
            <MaterialCommunityIcons name="camera-iris" size={22} color="#C7D5CF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.8}>
            <Ionicons name="chatbubbles-outline" size={22} color="#C7D5CF" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navItem, styles.navActive]} activeOpacity={0.8}>
            <Ionicons name="location" size={22} color="#111" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.8}>
            <Ionicons name="person-circle-outline" size={24} color="#C7D5CF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.8}>
            <Feather name="settings" size={22} color="#C7D5CF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/** ---------------------------- Styles --------------------------- */
const ACCENT = "#8FD39B"; // green from your mock
const DARK = "#0F1416";   // app background
const PANEL = "#1A2327";  // darker panels
const GLASS = "rgba(255,255,255,0.12)";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: DARK },
  safe: { backgroundColor: DARK },

  /* Header */
  headerWrap: {
    position: "absolute",
    zIndex: 20,
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: Platform.select({ ios: 8, android: 16 }),
  },
  headerRow: {
    display: 'none',
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 8,
  },
  headerTitle: {
    display: 'none',
    color: "#E6F4EA",
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  /* Search */
  searchRow: {
    marginTop: 6,
    height: 40,
    borderRadius: 20,
    backgroundColor: GLASS,
    overflow: "visible",
    flexDirection: "row",
    alignItems: "center",
  },
  searchIcon: { marginLeft: 12, marginRight: 8 },
  searchInput: {
    flex: 1,
    color: "#E6F4EA",
    paddingVertical: 8,
    paddingRight: 48, // space for filter button
  },
  filterBtn: {
    position: "absolute",
    right: 6,
    height: 28,
    width: 44,
    borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  /* Map region */
  mapContainer: {
    flex: 1,
    marginTop: 96, // push down to reveal header
  },
  zoomRoot: {
    flex: 1,
    overflow: "hidden", // keep image inside bounds
    backgroundColor: "#000",
  },
  zoomCanvas: {
    width: "100%",
    height: "100%",
  },
  mapImage: {
    width: "100%",
    height: "100%",
  },

  /* Marker fixed at center of the viewport */
  markerCenterWrap: {
    position: "absolute",
    top: "42%",
    left: "50%",
    transform: [{ translateX: -24 }],
    alignItems: "center",
    zIndex: 15,
  },
  markerShadow: {
    position: "absolute",
    top: 56,
    width: 36,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.35)",
    ...(Platform.OS === "web" ? { filter: "blur(6px)" } : {}),
    alignSelf: "center",
  },
  markerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  markerImage: { width: "100%", height: "100%", resizeMode: "cover" },

  /* Quick Pairing button */
  quickPairBtn: {
    position: "absolute",
    bottom: 88,
    left: 16,
    right: 16,
    height: 64,
    borderRadius: 20,
    backgroundColor: ACCENT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    zIndex: 15,
  },
  quickPairText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },

  /* Bottom nav */
  bottomNav: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    height: 56,
    borderRadius: 18,
    backgroundColor: PANEL,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    zIndex: 15,
  },
  navItem: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  navActive: {
    backgroundColor: ACCENT,
  },
});
