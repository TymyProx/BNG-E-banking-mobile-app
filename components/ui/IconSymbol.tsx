// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import type { SymbolWeight, SymbolViewProps } from "expo-symbols"
import type { ComponentProps } from "react"
import React from "react"
import type { OpaqueColorValue, StyleProp, TextStyle } from "react-native"

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>
type IconSymbolName = keyof typeof MAPPING

/**
 * Banking app SF Symbols to Material Icons mappings
 */
const MAPPING = {
  // Navigation
  "house.fill": "home",
  "creditcard.fill": "credit-card",
  "chart.bar.fill": "bar-chart",
  "person.fill": "person",
  "ellipsis.circle.fill": "more-horiz",

  // Banking specific
  "banknote.fill": "payments",
  "arrow.up.arrow.down": "swap-vert",
  qrcode: "qr-code",
  "phone.fill": "phone",
  "envelope.fill": "email",
  "lock.fill": "lock",
  "eye.fill": "visibility",
  "eye.slash.fill": "visibility-off",
  "bell.fill": "notifications",
  gear: "settings",
  "plus.circle.fill": "add-circle",
  "minus.circle.fill": "remove-circle",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  "arrow.right": "arrow-forward",
  "arrow.left": "arrow-back",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chevron.up": "keyboard-arrow-up",
  "chevron.down": "keyboard-arrow-down",
  magnifyingglass: "search",

  // Financial
  "dollarsign.circle.fill": "monetization-on",
  percent: "percent",
  "chart.line.uptrend.xyaxis": "trending-up",
  "chart.line.downtrend.xyaxis": "trending-down",
  "chart.pie.fill": "pie-chart",
  "building.columns.fill": "account-balance",
  creditcard: "credit-card",
  "wallet.pass.fill": "account-balance-wallet",

  // Actions
  "paperplane.fill": "send",
  "square.and.arrow.down.fill": "download",
  "square.and.arrow.up.fill": "upload",
  "doc.text.fill": "description",
  "camera.fill": "camera-alt",
  "location.fill": "location-on",
  "phone.badge.plus": "contact-phone",
  "message.fill": "message",
  headphones: "headset",
  "info.circle": "info",
  pencil: "edit",
  trash: "delete",
  plus: "add",
  "person.2": "group",
  xmark: "close",
  "lock.shield.fill": "https",
  time: "access-time",
  "document-outline": "description",
  call: "call",
  mail: "email",
  chatbubbles: "chat",
  "shield.checkered": "verified-user",
  target: "track-changes",
  "arrow.down": "arrow-downward",
  "bolt.fill": "bolt",
  "drop.fill": "invert_colors",
  "tv.fill": "tv",
  wifi: "wifi",
  bus: "directions_bus",
  "lock.open": "lock_open",
  "document-text-outline": "description",

  bell: "notifications",
  "checkmark.shield": "verified-user",
  eye: "visibility",
  "eye.slash": "visibility-off",
  "arrow.up.right": "north-east",
  paperclip: "attach-file",
  mic: "mic",
  "list.bullet": "list",
  star: "star-border",
  "star.fill": "star",
  ellipsis: "more-horiz",
  clock: "schedule",
  "clock.fill": "schedule",
  "wave.3.right": "waves",
  "exclamationmark.triangle": "warning",
  faceid: "face",
  "moon.fill": "dark-mode",
  "arrow.right.square": "exit-to-app",
  "arrow.triangle.2.circlepath": "sync",
  "briefcase.fill": "work",
  "xmark.circle": "cancel",
  "checkmark.circle": "check-circle",
  "info.circle.fill": "info",

  ///// Virement

"arrow.left.arrow.right": "compare-arrows",
"arrow.right.arrow.left": "compare-arrows",
"bank.transfer": "compare-arrows",


/////Menu

"line.3.horizontal": "menu",
"square.grid.2x2": "apps",

} as unknown as IconMapping

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName
  size?: number
  color: string | OpaqueColorValue
  style?: StyleProp<TextStyle>
  weight?: SymbolWeight
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />
}
