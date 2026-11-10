import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const dark = {
  surface: "#121214",
  onSurface: "#F4F4F6",
  surfaceSecondary: "#1A1A1E",
  onSurfaceSecondary: "#D0D0D5",
  surfaceTertiary: "#26262B",
  onSurfaceTertiary: "#9E9EA5",
  surfaceInverse: "#FAFAFC",
  onSurfaceInverse: "#121214",
  muted: "#8E8E96",
  brand: "#C5A880",
  onBrand: "#121214",
  brandPrimary: "#C5A880",
  onBrandPrimary: "#121214",
  brandSecondary: "#9E825E",
  onBrandSecondary: "#FAFAFC",
  brandTertiary: "#332B22",
  onBrandTertiary: "#F4F4F6",
  success: "#7FA688",
  onSuccess: "#121214",
  warning: "#D4A373",
  onWarning: "#121214",
  error: "#B85C5C",
  onError: "#121214",
  info: "#819AA6",
  onInfo: "#121214",
  border: "#2A2A30",
  borderStrong: "#44444F",
  divider: "#222228",
};

export type ThemeColors = typeof dark;
export const defaultScheme = "dark" satisfies ColorScheme;
export const themes: { light: ThemeColors; dark?: ThemeColors } = { light: dark, dark };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme("dark");

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system === "light" || system === "dark" ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}