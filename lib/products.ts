import type { Product, ProductFamily } from "./types";

export type { Product, ProductFamily } from "./types";

/**
 * Hardware catalogue — per stakeholder feedback the line-up is exactly three
 * SKUs: BRYCK, BRYCK Mini and BRYCK FXR. BRYCK + Mini specs are transcribed
 * verbatim from the portal analysis; FXR specs are PLACEHOLDER values composed
 * in the family's language, pending the official FXR datasheet.
 */

const STORAGE_SPECS = {
  title: "Data storage specs",
  rows: [
    {
      label: "Protocols / filesystems",
      value:
        "NFS, SMB, S3, BryckCP, Ext4, FAT, NTFS, UFS, FTP, HTTP, RSYNC",
    },
    {
      label: "Management / monitoring",
      value: "SMART, SNMP, Syslog, Web and REST API management",
    },
    { label: "RAID", value: "RAID 0, RAID 1, RAID 5, RAID 6" },
    {
      label: "Data protection",
      value:
        "Self-healing data protection, hardware data encryption, protection from HW/software failures, fast data-transfer utility",
    },
  ],
};

export const PRODUCTS: Product[] = [
  {
    slug: "bryck",
    category: "BRYCK",
    family: "Edge Storage",
    model: "BRYCK",
    name: "BRYCK",
    tagline: "1 petabyte in the form factor of a brick, 14 lbs",
    image: "/assets/products/bryck-hero.webp",
    gallery: ["/assets/products/bryck-hero.webp", "/assets/products/bryck-alt.webp"],
    hero: { value: "14 lbs", label: "For a petabyte" },
    availability: {
      state: "available",
      headline: "4 ready now",
      detail: "4 free of 18 tracked units.",
    },
    imageAspect: "square",
    monthlyCost: 0,
    priceNote: "from",
    capacities: [128, 256, 512, 1024],
    chips: ["Up to 1 PB", "14 lbs", "Rugged & portable", "PCIe Gen 4.0"],
    keySpecs: [
      { icon: "database", label: "Capacity", value: "128–1024 TB" },
      { icon: "weight", label: "Weight", value: "14 lbs" },
      { icon: "zap", label: "Power", value: "520 W max" },
      { icon: "ruler", label: "Size", value: "9.5 × 4 × 4" },
    ],
    specs: [
      {
        title: "Specification",
        rows: [
          { label: "Model", value: "BRYCK" },
          { label: "Select capacity", value: "128 TB / 256 TB / 512 TB / 1024 TB" },
          {
            label: "Connectivity",
            value:
              "All models support PCIe Gen 4.0 and are PCIe Gen 3.0 backward compatible",
          },
          { label: "Dimension", value: "9.5 × 4.0 × 4.0" },
          { label: "Weight", value: "14 lbs" },
          { label: "Power input", value: "520 W (max)" },
        ],
      },
      STORAGE_SPECS,
      {
        title: "Environmental specs",
        rows: [
          {
            label: "Operating",
            value:
              "Temperature 0°C to 60°C, Humidity 10–90% RH, Altitude 0–10,000 ft",
          },
          { label: "Non-operating (storage)", value: "Temperature −40°C to 70°C" },
        ],
      },
    ],
    capabilities:
      "Rugged, portable, storage-only BRYCK. A low-SWaP, high-performance, petabyte-scale mobile data solution that weighs only 14 lbs and captures an impressive 1 petabyte of data in the compact form factor of a construction brick. Its small form factor allows versatile deployment at standard and mobile edges, as well as cloud and data centres, ideal for handling and processing large volumes of data.",
  },
  {
    slug: "bryck-mini",
    category: "BRYCK Mini",
    family: "Edge Storage",
    model: "BM-LPSL1",
    name: "BRYCK Mini",
    tagline: "Compact rugged storage for harsh environments",
    image: "/assets/products/mini.webp",
    gallery: ["/assets/products/mini.webp", "/assets/products/mini-alt.webp"],
    hero: { value: "10 lbs", label: "Field weight" },
    availability: {
      state: "available",
      headline: "Ships in 5 days",
      detail: "Built to order from stock.",
    },
    imageAspect: "tall",
    monthlyCost: 0,
    capacities: [256],
    chips: ["256 TB", "10 lbs", "2× 100 GbE", "MIL-grade shock"],
    keySpecs: [
      { icon: "database", label: "Capacity", value: "256 TB" },
      { icon: "cpu", label: "Processor", value: "16 ARM cores" },
      { icon: "weight", label: "Weight", value: "10 lbs" },
      { icon: "network", label: "Network", value: "2× 100 GbE" },
    ],
    specs: [
      {
        title: "Specification",
        rows: [
          { label: "Model", value: "BM-LPSL1" },
          { label: "Capacity", value: "256 TB" },
          { label: "Processor", value: "16 ARM v8.2 + A78 Hercules cores" },
          { label: "Memory", value: "48 GB" },
          {
            label: "Connectivity",
            value:
              "2× 100 GbE, 1× 1 GbE (up to eight 25GbE/10GbE ports via cable splitters)",
          },
          { label: "Dimension", value: "3.0 × 7.0 × 13.5" },
          { label: "Weight", value: "10 lbs" },
          { label: "Power input", value: "264V AC, 50–400 Hz, internal PSU" },
        ],
      },
      STORAGE_SPECS,
      {
        title: "Environmental & compliance",
        rows: [
          {
            label: "Operating",
            value: "0°C to 60°C, Humidity 10–90% RH, Altitude 0–10,000 ft",
          },
          {
            label: "Shock / vibration",
            value: "Shock 3-axis, 35g, 25ms, Vibration 4.76 Grms, 10Hz–2000Hz",
          },
          { label: "Non-operating (storage)", value: "−40°C to 85°C" },
          {
            label: "Compliance",
            value: "FCC Class A, CE (Safety & Emissions), UL/cUL, RoHS3, BIS",
          },
        ],
      },
    ],
    capabilities:
      "BRYCK Mini, non-swappable blocks. A compact, rugged storage system engineered for reliable performance in disadvantaged and harsh environments. Designed with low power consumption in mind, it employs an advanced power-management algorithm that activates only the necessary storage devices during operation, optimising efficiency and extending operational life.",
  },
  {
    // Specs sourced from tsecond.ai (Edge HPC → BRYCK-FXR) and the BRYCK
    // platform datasheet. Configurable items are marked "configurable at build".
    slug: "bryck-fxr",
    category: "BRYCK FXR",
    family: "Edge HPC",
    model: "BRYCK-FXR",
    name: "BRYCK FXR",
    tagline: "Ruggedized high-performance edge AI flyaway kit",
    image: "/assets/products/fxr.webp",
    gallery: [
      "/assets/products/fxr.webp",
      "/assets/products/fxr-alt.webp",
      "/assets/products/fxr-kit.webp",
    ],
    hero: { value: "512 TB", label: "Max capacity" },
    availability: {
      state: "limited",
      headline: "2 kits this quarter",
      detail: "Flyaway kits are allocated per quarter.",
    },
    imageAspect: "wide",
    stageTone: "dark",
    monthlyCost: 120,
    priceNote: "from",
    capacities: [128, 256, 512],
    chips: ["Up to 512 TB", "NVIDIA BlueField DPU", "MIL-STD-810", "Edge AI"],
    keySpecs: [
      { icon: "database", label: "Storage", value: "Up to 512 TB" },
      { icon: "cpu", label: "DPU", value: "NVIDIA BlueField" },
      { icon: "zap", label: "Power", value: "240–800 W" },
      { icon: "ruler", label: "Rugged", value: "MIL-STD-810" },
    ],
    specs: [
      {
        title: "Specification",
        rows: [
          { label: "Model", value: "BRYCK-FXR" },
          { label: "Platform", value: "Rugged edge AI flyaway kit" },
          { label: "Select capacity", value: "128 TB / 256 TB / 512 TB" },
          { label: "DPU", value: "NVIDIA BlueField" },
          {
            label: "AI compute",
            value:
              "Advanced AI accelerators, compute-to-storage ratio and TOPS configurable at build time",
          },
          { label: "Power consumption", value: "240–800 W" },
          {
            label: "Form factor",
            value: "Small form factor, transportable, plug & play",
          },
        ],
      },
      STORAGE_SPECS,
      {
        title: "Ruggedization & security",
        rows: [
          {
            label: "Environmental",
            value:
              "Meets or exceeds MIL-STD-810, extreme temperatures, vibration and shock",
          },
          { label: "Ingress", value: "Water-resistant, shockproof enclosure" },
          {
            label: "Tamper protection",
            value: "Tamper-proof enclosure with epoxy potting to prevent intrusion",
          },
          {
            label: "Encryption",
            value: "Multi-level encryption, 256-bit hardware encryption",
          },
        ],
      },
    ],
    capabilities:
      "BRYCK-FXR is a rugged edge AI kit built for the disconnected world. It pairs an NVIDIA BlueField DPU and advanced AI accelerators with up to 512 TB of storage in a small, water-resistant, shockproof and fully transportable form factor, so you can run inference at the tactical edge, then fly the data home. Meets or exceeds MIL-STD-810, with tamper-proof enclosures and multi-level encryption.",
    detailsUrl: "https://tsecond.ai/products/edge-hpc?tab=bryck-fxr",
  },
];

/** Families in display order, mirroring tsecond.ai's product IA. */
export const FAMILIES: { name: ProductFamily; blurb: string }[] = [
  {
    name: "Edge Storage",
    blurb: "Petabyte-scale capture and transport in the smallest form factor",
  },
  {
    name: "Edge HPC",
    blurb: "Rugged AI compute for the disconnected world",
  },
];

export function productsByFamily(family: ProductFamily): Product[] {
  return PRODUCTS.filter((p) => p.family === family);
}

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

/**
 * Backdrop class for a product photo.
 *
 * Was `bg-product-stage` / `bg-product-stage-dark`, neither of which was ever
 * declared in CSS — so every render sat on whatever the card behind it was,
 * and the two shots that shipped with a baked-in white matte read as white
 * rectangles floating on the dark console. Both are real classes now (see
 * `tokens.css`), and every render in the catalogue carries a real alpha
 * channel, so the plinth is the only background there is.
 */
export function productStage(p: Pick<Product, "stageTone">): string {
  return p.stageTone === "dark" ? "product-stage-dark" : "product-stage";
}
