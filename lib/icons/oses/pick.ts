import AlpineIcon from "./AlpineIcon";
import AppleIcon from "./AppleIcon";
import ArchIcon from "./ArchIcon";
import AstraIcon from "./AstraIcon";
import CentOSIcon from "./CentOSIcon";
import DebianIcon from "./DebianIcon";
import KaliIcon from "./KaliIcon";
import LinuxIcon from "./LinuxIcon";
import MintIcon from "./MintIcon";
import RedHatIcon from "./RedHatIcon";
import UbuntuIcon from "./UbuntuIcon";
import {
  WindowsServer0612Icon,
  WindowsServer1218Icon,
  WindowsServer1825Icon,
} from "./WindowsServerIcon";
import { CircleQuestionMark } from "lucide-react";

export function pickIcon(guestOs: string) {
  const normalized = guestOs.toLowerCase();

  if (normalized.includes("alpine")) return AlpineIcon;
  if (normalized.includes("arch")) return ArchIcon;
  if (normalized.includes("astra")) return AstraIcon;
  if (normalized.includes("debian")) return DebianIcon;
  if (normalized.includes("kali")) return KaliIcon;
  if (normalized.includes("mint")) return MintIcon;
  if (normalized.includes("red hat") || normalized.includes("rhel"))
    return RedHatIcon;
  if (normalized.includes("ubuntu")) return UbuntuIcon;
  if (normalized.includes("centos")) return CentOSIcon;

  if (normalized.includes("windows server")) {
    if (
      normalized.includes("2008") ||
      normalized.includes("2012") ||
      normalized.includes("2006")
    ) {
      return WindowsServer0612Icon;
    }
    if (normalized.includes("2012") || normalized.includes("2016")) {
      return WindowsServer1218Icon;
    }
    if (
      normalized.includes("2019") ||
      normalized.includes("2022") ||
      normalized.includes("2025")
    ) {
      return WindowsServer1825Icon;
    }
  }

  if (normalized.includes("windows")) {
    if (normalized.includes("7")) {
      return WindowsServer0612Icon;
    }
    if (normalized.includes("10")) {
      return WindowsServer1218Icon;
    }
    if (normalized.includes("11")) {
      return WindowsServer1825Icon;
    }
  }

  if (
    normalized.includes("mac") ||
    normalized.includes("os x") ||
    normalized.includes("ios")
  )
    return AppleIcon;
  if (normalized.includes("linux")) return LinuxIcon;

  return CircleQuestionMark;
}
