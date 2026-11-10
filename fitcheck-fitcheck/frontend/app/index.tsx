import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Sharing from "expo-sharing";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";

import {
  analyzeFace,
  colorRecommendationEngine,
  FaceProfile,
  getScoreCategory,
  profileForTone,
  RecommendationRule,
  SCORE_CATEGORY_LABEL,
  ScoreCategory,
  Undertone,
} from "@/src/color-analysis";
import {
  addSavedLook,
  getSavedLooks,
  removeSavedLook,
  SavedLook,
} from "@/src/saved-looks";
import { makeStyles, useTheme } from "@/src/theme";

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.surface },
    fill: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
    scroll: { paddingHorizontal: 20 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22, gap: 10 },
    headerCopy: { flex: 1, minWidth: 0, paddingRight: 12 },
    eyebrow: { color: colors.brand, fontSize: 11, letterSpacing: 2.2, fontWeight: "500" },
    title: { color: colors.onSurface, fontSize: 32, lineHeight: 38, fontFamily: "Georgia", fontWeight: "500", marginTop: 8, flexShrink: 1, maxWidth: "100%" },
    subtitle: { color: colors.onSurfaceTertiary, fontSize: 14, lineHeight: 21, marginTop: 8, maxWidth: 280 },
    savedPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, height: 36, borderRadius: 99, backgroundColor: colors.brandTertiary, borderWidth: 1, borderColor: colors.border },
    savedPillText: { color: colors.brand, fontSize: 12, fontWeight: "600", letterSpacing: 0.4 },
    preview: { height: Math.min(Dimensions.get("window").width * 0.92, 390), minHeight: 290, borderRadius: 22, overflow: "hidden", borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surfaceSecondary, marginBottom: 16 },
    previewImage: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
    previewShade: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, padding: 16, justifyContent: "space-between" },
    previewTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    previewBottom: { flexDirection: "row", justifyContent: "flex-end" },
    matchChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, backgroundColor: "rgba(0,0,0,0.55)", borderWidth: 1, borderColor: colors.border },
    matchChipDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.brand },
    matchChipText: { color: colors.onSurface, fontSize: 12, fontWeight: "600", letterSpacing: 0.4 },
    tag: { alignSelf: "flex-start", backgroundColor: colors.surface, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 99, borderWidth: 1, borderColor: colors.border },
    tagText: { color: colors.onSurfaceSecondary, fontSize: 11, letterSpacing: 0.8, fontWeight: "500" },
    emptyPreview: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
    emptyIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center", marginBottom: 18 },
    emptyTitle: { color: colors.onSurface, fontFamily: "Georgia", fontSize: 22, fontWeight: "500", textAlign: "center" },
    emptyCopy: { color: colors.onSurfaceTertiary, fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 8, maxWidth: 240 },
    camera: { flex: 1 },
    cameraFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    roundButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
    shutter: { width: 70, height: 70, borderRadius: 35, borderWidth: 5, borderColor: colors.onSurface, backgroundColor: colors.brand },
    actionRow: { flexDirection: "row", gap: 10, marginBottom: 28 },
    actionButton: { flex: 1, minHeight: 54, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surfaceSecondary },
    primaryButton: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
    actionText: { color: colors.onSurface, fontSize: 14, fontWeight: "500" },
    primaryText: { color: colors.onBrandPrimary },
    loadingCard: { borderRadius: 18, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, padding: 18, marginBottom: 20 },
    loadingHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
    sectionLabel: { color: colors.onSurface, fontSize: 15, fontWeight: "500" },
    progressText: { color: colors.brand, fontSize: 18, fontFamily: "Georgia" },
    track: { height: 5, borderRadius: 4, overflow: "hidden", backgroundColor: colors.surfaceTertiary },
    progress: { height: "100%", backgroundColor: colors.brand },
    resultCard: { borderRadius: 22, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, padding: 20, marginBottom: 20 },
    resultTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    label: { color: colors.onSurfaceTertiary, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: "500" },
    resultTitle: { color: colors.onSurface, fontFamily: "Georgia", fontSize: 25, fontWeight: "500", marginTop: 6 },
    resultDescription: { color: colors.onSurfaceTertiary, fontSize: 13, marginTop: 5 },
    scoreBlock: { alignItems: "flex-end" },
    score: { color: colors.brand, fontFamily: "Georgia", fontSize: 34, fontWeight: "500" },
    scoreCaption: { color: colors.onSurfaceTertiary, textAlign: "right", fontSize: 11, marginTop: 2 },
    categoryBadge: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, borderWidth: 1 },
    categoryBadgeText: { fontSize: 11, fontWeight: "600", letterSpacing: 0.4 },
    resultActions: { flexDirection: "row", gap: 10, marginTop: 18 },
    resultActionButton: { flex: 1, minHeight: 46, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceTertiary },
    resultActionText: { color: colors.onSurface, fontSize: 13, fontWeight: "500" },
    savedResultActionButton: { borderColor: colors.brand, backgroundColor: colors.brandTertiary },
    savedResultActionText: { color: colors.brand },
    divider: { height: 1, backgroundColor: colors.divider, marginVertical: 20 },
    sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
    sectionTitle: { color: colors.onSurface, fontSize: 15, fontWeight: "600" },
    sectionCount: { color: colors.onSurfaceTertiary, fontSize: 12, fontWeight: "500" },
    sectionCopy: { color: colors.onSurfaceTertiary, fontSize: 12, lineHeight: 18, marginBottom: 12 },
    colorRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
    colorSwatch: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    colorInfo: { flex: 1, minWidth: 0 },
    colorName: { color: colors.onSurface, fontSize: 14, fontWeight: "500" },
    colorMeta: { color: colors.onSurfaceTertiary, fontSize: 11, marginTop: 2, textTransform: "capitalize" },
    colorScore: { color: colors.brand, fontSize: 14, fontFamily: "Georgia", fontWeight: "500" },
    rowDivider: { height: 1, backgroundColor: colors.divider },
    emptySection: { color: colors.onSurfaceTertiary, fontSize: 12, fontStyle: "italic", paddingVertical: 6 },
    manualTitle: { color: colors.onSurface, fontSize: 15, fontWeight: "500" },
    manualCopy: { color: colors.onSurfaceTertiary, fontSize: 13, lineHeight: 19, marginTop: 5 },
    toneRow: { flexDirection: "row", gap: 8, marginTop: 15 },
    toneChip: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center", backgroundColor: colors.surfaceTertiary, borderWidth: 1, borderColor: colors.border },
    toneChipSelected: { backgroundColor: colors.brandTertiary, borderColor: colors.brand },
    toneChipText: { color: colors.onSurfaceTertiary, fontSize: 12, fontWeight: "500", textTransform: "capitalize" },
    toneChipTextSelected: { color: colors.brand },
    error: { color: colors.error, fontSize: 13, lineHeight: 19, marginTop: -12, marginBottom: 17, textAlign: "center" },
    toast: { position: "absolute", left: 20, right: 20, bottom: 30, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 },
    toastText: { color: colors.onSurface, fontSize: 13, fontWeight: "500", flex: 1 },
    // Modal for saved looks
    modalRoot: { flex: 1, backgroundColor: colors.surface },
    modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16 },
    modalTitle: { color: colors.onSurface, fontFamily: "Georgia", fontSize: 24, fontWeight: "500" },
    modalSubtitle: { color: colors.onSurfaceTertiary, fontSize: 13, paddingHorizontal: 20, marginBottom: 12 },
    modalEmpty: { alignItems: "center", justifyContent: "center", padding: 40 },
    modalEmptyTitle: { color: colors.onSurface, fontFamily: "Georgia", fontSize: 20, fontWeight: "500", marginTop: 14, textAlign: "center" },
    modalEmptyCopy: { color: colors.onSurfaceTertiary, fontSize: 13, lineHeight: 20, marginTop: 6, textAlign: "center", maxWidth: 260 },
    savedItem: { flexDirection: "row", gap: 12, padding: 12, borderRadius: 16, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
    savedThumb: { width: 68, height: 84, borderRadius: 12, backgroundColor: colors.surfaceTertiary, borderWidth: 1, borderColor: colors.border, overflow: "hidden", alignItems: "center", justifyContent: "center" },
    savedThumbImage: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
    savedInfo: { flex: 1, minWidth: 0, justifyContent: "center" },
    savedLabel: { color: colors.onSurface, fontFamily: "Georgia", fontSize: 17, fontWeight: "500" },
    savedMeta: { color: colors.onSurfaceTertiary, fontSize: 11, marginTop: 3 },
    savedScoreRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
    savedScore: { color: colors.brand, fontSize: 13, fontFamily: "Georgia", fontWeight: "500" },
    savedItemActions: { justifyContent: "space-between", alignItems: "center" },
    iconButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceTertiary, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  }),
);

// Category → color tokens for the badge (border + text; subtle bg via alpha).
function useCategoryTint() {
  const { colors } = useTheme();
  return (category: ScoreCategory) => {
    if (category === "excellent" || category === "very-good") {
      return { color: colors.brand, background: colors.brandTertiary, border: colors.brand };
    }
    if (category === "good" || category === "okay") {
      return { color: colors.onSurface, background: colors.surfaceTertiary, border: colors.border };
    }
    return { color: colors.muted, background: colors.surfaceTertiary, border: colors.border };
  };
}

function formatSavedDate(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " · " + date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function ActionButton({ icon, label, onPress, primary, testID }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; primary?: boolean; testID: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.actionButton, primary && styles.primaryButton, pressed && { opacity: 0.78, transform: [{ scale: 0.98 }] }]}>
      <Ionicons name={icon} size={18} color={primary ? colors.onBrandPrimary : colors.brand} />
      <Text style={[styles.actionText, primary && styles.primaryText]}>{label}</Text>
    </Pressable>
  );
}

function ColorRow({ rule, testID }: { rule: RecommendationRule; testID: string }) {
  const styles = useStyles();
  return (
    <View testID={testID} style={styles.colorRow}>
      <View style={[styles.colorSwatch, { backgroundColor: rule.hex }]} />
      <View style={styles.colorInfo}>
        <Text style={styles.colorName} numberOfLines={1}>{rule.color}</Text>
        <Text style={styles.colorMeta} numberOfLines={1}>{rule.clothingCategory} · {rule.hex.toUpperCase()}</Text>
      </View>
      <Text style={styles.colorScore}>{rule.score}%</Text>
    </View>
  );
}

function ColorSection({
  title,
  copy,
  rules,
  emptyText,
  testID,
}: {
  title: string;
  copy: string;
  rules: RecommendationRule[];
  emptyText: string;
  testID: string;
}) {
  const styles = useStyles();
  return (
    <View testID={testID} style={{ marginTop: 22 }}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>{rules.length} {rules.length === 1 ? "color" : "colors"}</Text>
      </View>
      <Text style={styles.sectionCopy}>{copy}</Text>
      {rules.length === 0 ? (
        <Text style={styles.emptySection}>{emptyText}</Text>
      ) : (
        rules.map((rule, index) => (
          <View key={`${rule.color}-${rule.hex}`}>
            {index > 0 && <View style={styles.rowDivider} />}
            <ColorRow rule={rule} testID={`${testID}-row-${rule.color.toLowerCase().replace(/\s+/g, "-")}`} />
          </View>
        ))
      )}
    </View>
  );
}

export default function Index() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const shareCardRef = useRef<View>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const categoryTint = useCategoryTint();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [profile, setProfile] = useState<FaceProfile | null>(null);
  const [manualTone, setManualTone] = useState<Undertone | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [savedLooks, setSavedLooks] = useState<SavedLook[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [currentLookId, setCurrentLookId] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const listenerId = progress.addListener(({ value }) => setProgressValue(Math.round(value)));
    return () => progress.removeListener(listenerId);
  }, [progress]);

  useEffect(() => {
    getSavedLooks().then(setSavedLooks);
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const runAnalysis = (uri: string, base64?: string | null) => {
    setImageUri(uri);
    setImageBase64(base64 ?? null);
    setProfile(null);
    setManualTone(null);
    setError(null);
    setCurrentLookId(null);
    setIsScanning(true);
    setProgressValue(0);
    progress.setValue(0);
    Animated.timing(progress, { toValue: 100, duration: 1500, useNativeDriver: false }).start(({ finished }) => {
      if (!finished) return;
      setProfile(analyzeFace(base64 || uri));
      setIsScanning(false);
    });
  };

  const chooseFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 5], quality: 0.8, base64: true });
      if (!result.canceled) runAnalysis(result.assets[0].uri, result.assets[0].base64);
    } catch {
      setError("Your photo could not be opened. Please try another image.");
    }
  };

  const openCamera = async () => {
    try {
      if (!cameraPermission?.granted) {
        const permission = await requestCameraPermission();
        if (!permission.granted) {
          setError("Camera access is needed to capture a tone reference.");
          return;
        }
      }
      setError(null);
      setCameraOpen(true);
    } catch {
      setError("Camera access is unavailable on this device.");
    }
  };

  const capturePhoto = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ base64: true, quality: 0.8, skipProcessing: true });
      if (photo?.uri) {
        setCameraOpen(false);
        runAnalysis(photo.uri, photo.base64);
      }
    } catch {
      setError("The photo could not be captured. Please try again.");
    }
  };

  const reset = () => {
    progress.stopAnimation();
    setCameraOpen(false);
    setImageUri(null);
    setImageBase64(null);
    setProfile(null);
    setManualTone(null);
    setIsScanning(false);
    setError(null);
    setCurrentLookId(null);
  };

  const displayedProfile: FaceProfile | null = manualTone ? profileForTone(manualTone) : profile;
  const recommendations = useMemo(() => (displayedProfile ? colorRecommendationEngine(displayedProfile) : null), [displayedProfile]);
  const headlineCategory: ScoreCategory | null = displayedProfile ? getScoreCategory(displayedProfile.matchConfidence) : null;
  const imageSource = imageBase64 ? { uri: `data:image/jpeg;base64,${imageBase64}` } : imageUri ? { uri: imageUri } : undefined;

  const isCurrentSaved = currentLookId !== null;

  const handleSave = async () => {
    if (!displayedProfile || isCurrentSaved) return;
    const entry = await addSavedLook({
      imageUri: manualTone ? null : imageUri,
      imageBase64: manualTone ? null : imageBase64,
      profile: displayedProfile,
      manualTone: manualTone ?? null,
    });
    setSavedLooks((prev) => [entry, ...prev].slice(0, 25));
    setCurrentLookId(entry.id);
    showToast("Look saved");
  };

  const handleShare = async () => {
    if (!displayedProfile || !recommendations || isSharing) return;
    setIsSharing(true);
    try {
      if (Platform.OS === "web") {
        showToast("Sharing works on your phone build");
        return;
      }
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        showToast("Sharing is not available on this device");
        return;
      }
      const uri = await captureRef(shareCardRef, { format: "png", quality: 1, result: "tmpfile" });
      await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Share your Fit Check" });
    } catch {
      showToast("Could not share right now");
    } finally {
      setIsSharing(false);
    }
  };

  const handleRemoveSaved = async (id: string) => {
    const next = await removeSavedLook(id);
    setSavedLooks(next);
    if (currentLookId === id) setCurrentLookId(null);
  };

  const handleLoadSaved = (look: SavedLook) => {
    setShowSaved(false);
    progress.stopAnimation();
    setIsScanning(false);
    setError(null);
    setImageUri(look.imageUri);
    setImageBase64(look.imageBase64);
    setManualTone(look.manualTone);
    setProfile(look.manualTone ? null : look.profile);
    setCurrentLookId(look.id);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={[colors.surface, colors.surfaceSecondary, colors.surface]} style={styles.fill} />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>CHROMATIC / 01</Text>
            <Text testID="app-title" style={styles.title}>Fit Check</Text>
            <Text style={styles.subtitle}>A quiet, offline color read made for your everyday palette.</Text>
          </View>
          <Pressable
            testID="open-saved-button"
            accessibilityRole="button"
            accessibilityLabel={`Saved looks, ${savedLooks.length}`}
            onPress={() => setShowSaved(true)}
            style={({ pressed }) => [styles.savedPill, pressed && { opacity: 0.75 }]}
          >
            <Ionicons name="bookmark-outline" size={14} color={colors.brand} />
            <Text style={styles.savedPillText}>{savedLooks.length}</Text>
          </Pressable>
        </View>

        <View style={styles.preview}>
          {cameraOpen ? (
            <CameraView ref={cameraRef} style={styles.camera} facing="front">
              <View style={styles.previewShade}>
                <View style={styles.cameraFooter}>
                  <Pressable testID="camera-close-button" accessibilityRole="button" accessibilityLabel="Close camera" onPress={() => setCameraOpen(false)} style={styles.roundButton}><Ionicons name="close" size={22} color={colors.onSurface} /></Pressable>
                  <Pressable testID="camera-shutter-button" accessibilityRole="button" accessibilityLabel="Capture portrait" onPress={capturePhoto} style={({ pressed }) => [styles.shutter, pressed && { transform: [{ scale: 0.92 }] }]} />
                  <View style={styles.roundButton}><Ionicons name="scan-outline" size={20} color={colors.brand} /></View>
                </View>
              </View>
            </CameraView>
          ) : imageSource ? (
            <>
              <ExpoImage source={imageSource} contentFit="cover" style={styles.previewImage} />
              <View style={styles.previewShade}>
                <View style={styles.previewTop}>
                  <View style={styles.tag}><Text style={styles.tagText}>{isScanning ? "READING IMAGE" : "LOCAL REFERENCE"}</Text></View>
                  <Pressable testID="reset-button" accessibilityRole="button" accessibilityLabel="Start over" onPress={reset} style={styles.roundButton}><Ionicons name="refresh" size={19} color={colors.onSurface} /></Pressable>
                </View>
                {displayedProfile && !isScanning && (
                  <View style={styles.previewBottom}>
                    <View testID="preview-match-chip" style={styles.matchChip}>
                      <View style={styles.matchChipDot} />
                      <Text style={styles.matchChipText}>{displayedProfile.matchConfidence}% match</Text>
                    </View>
                  </View>
                )}
              </View>
            </>
          ) : (
            <View style={styles.emptyPreview}>
              <View style={styles.emptyIcon}><Ionicons name="color-wand-outline" size={28} color={colors.brand} /></View>
              <Text style={styles.emptyTitle}>Your palette starts here.</Text>
              <Text style={styles.emptyCopy}>Use a clear portrait in natural light for the most useful local read.</Text>
            </View>
          )}
        </View>

        {!cameraOpen && <View style={styles.actionRow}>
          <ActionButton icon="images-outline" label="Gallery" onPress={chooseFromGallery} testID="gallery-button" />
          <ActionButton icon="camera-outline" label="Camera" onPress={openCamera} primary testID="camera-button" />
        </View>}

        {error && <Text testID="error-message" accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}

        {isScanning && <View testID="loading-state" accessibilityLabel={`Reading image ${progressValue}%`} style={styles.loadingCard}>
          <View style={styles.loadingHeader}><Text style={styles.sectionLabel}>Reading your harmony</Text><Text style={styles.progressText}>{progressValue}%</Text></View>
          <View style={styles.track}><Animated.View style={[styles.progress, { width: progress.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }) }]} /></View>
        </View>}

        {displayedProfile && recommendations && headlineCategory && !isScanning && (
          <View
            ref={shareCardRef}
            collapsable={false}
            testID="analysis-result"
            accessibilityLabel={`${displayedProfile.label}, ${displayedProfile.matchConfidence}% match`}
            style={styles.resultCard}
          >
            <View style={styles.resultTop}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.label}>Your read</Text>
                <Text style={styles.resultTitle}>{displayedProfile.label}</Text>
                <Text style={styles.resultDescription}>{displayedProfile.descriptor}</Text>
              </View>
              <View style={styles.scoreBlock}>
                <Text testID="match-score" style={styles.score}>{displayedProfile.matchConfidence}%</Text>
                <Text style={styles.scoreCaption}>match</Text>
                <View
                  testID="category-badge"
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: categoryTint(headlineCategory).background, borderColor: categoryTint(headlineCategory).border },
                  ]}
                >
                  <Text style={[styles.categoryBadgeText, { color: categoryTint(headlineCategory).color }]}>
                    {SCORE_CATEGORY_LABEL[headlineCategory]}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.resultActions}>
              <Pressable
                testID="save-look-button"
                accessibilityRole="button"
                accessibilityLabel={isCurrentSaved ? "Look saved" : "Save this look"}
                onPress={handleSave}
                disabled={isCurrentSaved}
                style={({ pressed }) => [
                  styles.resultActionButton,
                  isCurrentSaved && styles.savedResultActionButton,
                  pressed && !isCurrentSaved && { opacity: 0.8 },
                ]}
              >
                <Ionicons
                  name={isCurrentSaved ? "bookmark" : "bookmark-outline"}
                  size={16}
                  color={isCurrentSaved ? colors.brand : colors.onSurface}
                />
                <Text style={[styles.resultActionText, isCurrentSaved && styles.savedResultActionText]}>
                  {isCurrentSaved ? "Saved" : "Save look"}
                </Text>
              </Pressable>
              <Pressable
                testID="share-look-button"
                accessibilityRole="button"
                accessibilityLabel="Share this look"
                onPress={handleShare}
                disabled={isSharing}
                style={({ pressed }) => [styles.resultActionButton, pressed && { opacity: 0.8 }, isSharing && { opacity: 0.6 }]}
              >
                <Ionicons name="share-outline" size={16} color={colors.onSurface} />
                <Text style={styles.resultActionText}>{isSharing ? "Preparing…" : "Share"}</Text>
              </Pressable>
            </View>

            <View style={styles.divider} />

            <ColorSection
              testID="section-best"
              title="Best colors"
              copy="Highest harmony with your read — wear these with confidence."
              rules={recommendations.best}
              emptyText="No best matches in the current ruleset yet."
            />
            <ColorSection
              testID="section-good"
              title="Good colors"
              copy="Solid, everyday shades that work with your tone."
              rules={recommendations.good}
              emptyText="No good matches in the current ruleset yet."
            />
            <ColorSection
              testID="section-less"
              title="Less recommended"
              copy="Shades that may fight your undertone — style with care."
              rules={recommendations.less}
              emptyText="No less-recommended shades in the current ruleset yet."
            />
          </View>
        )}

        {!isScanning && <View testID="manual-tone-card" style={styles.resultCard}>
          <Text style={styles.manualTitle}>Tune the read</Text>
          <Text style={styles.manualCopy}>Not quite right? Choose the tone that feels most like you.</Text>
          <View style={styles.toneRow}>{(["warm", "neutral", "cool"] as Undertone[]).map((key) => <Pressable key={key} testID={`tone-${key}-button`} accessibilityRole="button" accessibilityLabel={`Select ${key} tone`} onPress={() => { setManualTone(key); setCurrentLookId(null); }} style={[styles.toneChip, manualTone === key && styles.toneChipSelected]}><Text style={[styles.toneChipText, manualTone === key && styles.toneChipTextSelected]}>{key}</Text></Pressable>)}</View>
        </View>}
      </ScrollView>

      {toast && (
        <View testID="toast" style={[styles.toast, { bottom: insets.bottom + 24 }]}>
          <Ionicons name="checkmark-circle" size={18} color={colors.brand} />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      <Modal visible={showSaved} animationType="slide" onRequestClose={() => setShowSaved(false)}>
        <View style={styles.modalRoot}>
          <LinearGradient colors={[colors.surface, colors.surfaceSecondary, colors.surface]} style={styles.fill} />
          <View style={{ paddingTop: insets.top + 18 }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Saved looks</Text>
              <Pressable
                testID="close-saved-button"
                accessibilityRole="button"
                accessibilityLabel="Close saved looks"
                onPress={() => setShowSaved(false)}
                style={styles.iconButton}
              >
                <Ionicons name="close" size={18} color={colors.onSurface} />
              </Pressable>
            </View>
            <Text style={styles.modalSubtitle}>Tap a look to revisit its palette. Up to 25 stored on this device.</Text>
          </View>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}
            showsVerticalScrollIndicator={false}
          >
            {savedLooks.length === 0 ? (
              <View style={styles.modalEmpty}>
                <View style={styles.emptyIcon}><Ionicons name="bookmark-outline" size={26} color={colors.brand} /></View>
                <Text style={styles.modalEmptyTitle}>No saved looks yet</Text>
                <Text style={styles.modalEmptyCopy}>Read a portrait, then tap Save look on the result card to keep it here.</Text>
              </View>
            ) : (
              savedLooks.map((look) => {
                const category = getScoreCategory(look.profile.matchConfidence);
                const tint = categoryTint(category);
                const thumbSource = look.imageBase64
                  ? { uri: `data:image/jpeg;base64,${look.imageBase64}` }
                  : look.imageUri
                    ? { uri: look.imageUri }
                    : undefined;
                return (
                  <View
                    key={look.id}
                    testID={`saved-look-${look.id}`}
                    style={styles.savedItem}
                  >
                    <Pressable
                      testID={`saved-look-open-${look.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${look.profile.label}`}
                      onPress={() => handleLoadSaved(look)}
                      style={{ flexDirection: "row", flex: 1, gap: 12 }}
                    >
                      <View style={styles.savedThumb}>
                        {thumbSource ? (
                          <ExpoImage source={thumbSource} contentFit="cover" style={styles.savedThumbImage} />
                        ) : (
                          <Ionicons name="color-palette-outline" size={22} color={colors.brand} />
                        )}
                      </View>
                      <View style={styles.savedInfo}>
                        <Text style={styles.savedLabel} numberOfLines={1}>{look.profile.label}</Text>
                        <Text style={styles.savedMeta}>{formatSavedDate(look.createdAt)}</Text>
                        <View style={styles.savedScoreRow}>
                          <Text style={styles.savedScore}>{look.profile.matchConfidence}%</Text>
                          <View style={[styles.categoryBadge, { marginTop: 0, backgroundColor: tint.background, borderColor: tint.border }]}>
                            <Text style={[styles.categoryBadgeText, { color: tint.color }]}>{SCORE_CATEGORY_LABEL[category]}</Text>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                    <View style={styles.savedItemActions}>
                      <Pressable
                        testID={`saved-look-delete-${look.id}`}
                        accessibilityRole="button"
                        accessibilityLabel={`Delete ${look.profile.label}`}
                        onPress={() => handleRemoveSaved(look.id)}
                        style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.error} />
                      </Pressable>
                      <Ionicons name="chevron-forward" size={16} color={colors.onSurfaceTertiary} />
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
