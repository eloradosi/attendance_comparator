export type VendorPreset = {
    id: string;
    name: string;
    dateLabels?: string[];
    checkinLabels?: string[];
    checkoutLabels?: string[];
    yTolerance?: number; // for grouping rows by Y coordinate
    xTolerance?: number; // for matching column X positions
};

const presets: Record<string, VendorPreset> = {
    mii: {
        id: "mii",
        name: "MII",
        dateLabels: ["date"],
        checkinLabels: ["start"],
        checkoutLabels: ["end"],
        yTolerance: 6,
        xTolerance: 100,
    },
    indocyber: {
        id: "indocyber",
        name: "Indocyber",
        dateLabels: ["date", "tanggal", "tgl"],
        checkinLabels: ["check in", "masuk", "jam masuk", "start"],
        checkoutLabels: ["check out", "keluar", "jam keluar", "end"],
        yTolerance: 5,
        xTolerance: 40,
    },
};

export default presets;
