import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.crownlands.app",
  appName: "Crownlands",
  webDir: "out",
  backgroundColor: "#09090b",
  android: {
    backgroundColor: "#09090b",
  },
  ios: {
    contentInset: "never",
    backgroundColor: "#09090b",
  },
};

export default config;
