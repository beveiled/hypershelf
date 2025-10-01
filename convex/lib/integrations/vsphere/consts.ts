"use node";

export const DEVICE_MAPPING: Record<
  string,
  {
    icon: string;
    label: string;
    props: Record<
      string,
      (s: string) => { label: string; value: string } | null
    >;
  }
> = {
  VirtualHdAudioCard: {
    icon: "volume-2",
    label: "Audio Card",
    props: {},
  },
  VirtualCdrom: {
    icon: "disc-3",
    label: "CD/DVD Drive",
    props: {
      summary: (s: string) => {
        if (s === "Remote Device" || s === "Remote ATAPI") return null;
        return { label: "Media", value: s };
      },
    },
  },
  VirtualUSBXHCIController: {
    icon: "usb",
    label: "USB 3.0 Controller",
    props: {},
  },
  VirtualUSBController: {
    icon: "usb",
    label: "USB 2.0 Controller",
    props: {},
  },
  VirtualEnsoniq1371: {
    icon: "volume-2",
    label: "Ensoniq Sound Card",
    props: {},
  },
  VirtualMachineVideoCard: {
    icon: "gpu",
    label: "Video Card",
    props: {
      videoRamSizeInKB: (i: string) => ({
        label: "Video Memory",
        value: `${Math.round(Number.parseInt(i) / 1024)} MB`,
      }),
      graphicsMemorySizeInKB: (i: string) => ({
        label: "GPU Memory",
        value: `${Math.round(Number.parseInt(i) / 1024)} MB`,
      }),
    },
  },
  VirtualKeyboard: {
    icon: "keyboard",
    label: "Keyboard",
    props: {},
  },
  VirtualPointingDevice: {
    icon: "mouse",
    label: "Mouse",
    props: {},
  },
  VirtualDisk: {
    icon: "hard-drive",
    label: "SSD",
    props: {
      fileName: (s: string) => {
        const label = s.split("]")[0]?.replace("[", "")?.trim?.() ?? null;
        if (!label) return null;
        return { label: "Datastore", value: label };
      },
      capacityInKB: (i: string) => ({
        label: "Capacity",
        value: `${Math.round(Number.parseInt(i) / 1024 / 1024)} GB`,
      }),
    },
  },
};
