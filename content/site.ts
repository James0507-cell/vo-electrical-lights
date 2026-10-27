/**
 * Company, service and product copy.
 *
 * Verified sources: the brief supplied with the project + the company's public
 * Facebook page (captions captured 2026-10-26). Anything not verified is either
 * omitted or marked as "confirm with owner" in the README.
 * Edit this file to update copy — components read from it.
 */

export const site = {
  legalName: "Villanueva-Ong Electrical Lights Trading",
  name: "V.O Electrical Lights Trading",
  shortName: "V.O.",
  telephoneDisplay: "0992 659 5090",
  telephoneHref: "+639926595090",
  email: "villanuevaongtrading@gmail.com",
  facebook: "https://www.facebook.com/profile.php?id=100070349910288",
  facebookLabel: "V.O Electrical Lights Trading",
  tagline: "We wire the sun.",
  country: "Philippines",
  serviceNote: "Installing in Luzon and Mindanao. Equipment delivered nationwide.",
  descriptor: "Solar installation · Electrical supply · Street lighting",
  established: null,
} as const;

export const nav = [
  { href: "/#work", label: "Work" },
  { href: "/#services", label: "Services" },
  { href: "/#products", label: "Products" },
  { href: "/#process", label: "Process" },
  { href: "/#about", label: "About" },
  { href: "/#contact", label: "Contact" },
] as const;

export type Service = {
  id: string;
  index: string;
  title: string;
  short: string;
  description: string;
  points: string[];
  photoId: string;
  navLabel: string;
};

export const services: Service[] = [
  {
    id: "residential",
    index: "01",
    title: "Residential Solar",
    short: "Rooftop systems for homes",
    navLabel: "Homes",
    description:
      "Panels on your roof, sized to the way your household actually uses power. We survey the site, design the system, and install it — with the inverter and wiring work included.",
    points: ["Roof and load assessment", "System design and proposal", "Installation, testing, handover"],
    photoId: "876890734665916",
  },
  {
    id: "commercial",
    index: "02",
    title: "Commercial & Industrial",
    short: "Businesses, factories, refineries",
    navLabel: "Commercial",
    description:
      "Larger arrays for businesses that want predictable energy costs — from single-building rooftops to multi-roof rollouts. Ask about zero-upfront installation options for commercial and industrial projects.",
    points: ["Multi-building arrays", "Industrial solar set-ups", "Zero-upfront options on request"],
    photoId: "876920137996309",
  },
  {
    id: "farms",
    index: "03",
    title: "Farms & Agriculture",
    short: "Power where the grid is thin",
    navLabel: "Farms",
    description:
      "Solar for farm operations — pumps, processing, lighting and site power. Designed around the way the farm runs, not the other way around.",
    points: ["Off-grid and hybrid systems", "Pump and motor loads", "Site-specific mounting"],
    photoId: "872004798487843",
  },
  {
    id: "irrigation",
    index: "04",
    title: "Solar-Powered Irrigation",
    short: "Water, pumped by sunlight",
    navLabel: "Irrigation",
    description:
      "Solar pumping for irrigation, with installation, pump testing and commissioning. Stable, predictable water flow without a fuel bill.",
    points: ["Solar pump installation", "Testing and commissioning", "Field-ready handover"],
    photoId: "871972201824436",
  },
  {
    id: "street-lighting",
    index: "05",
    title: "Solar Street Lighting",
    short: "Roads that stay lit",
    navLabel: "Street lights",
    description:
      "Solar street lights, poles and road studs — supplied from our own stock and installed for private clients and government programmes.",
    points: ["ECO V.O solar street lights", "6 m and 8 m poles", "Government project documentation"],
    photoId: "1073132751708379",
  },
  {
    id: "ground-mounted",
    index: "06",
    title: "Ground-Mounted Arrays",
    short: "When the roof isn't enough",
    navLabel: "Ground mount",
    description:
      "Open-ground arrays on steel racking, for sites with the space to build a proper solar field. Elevated mounts, wiring, and commissioning.",
    points: ["Elevated steel racking", "Array wiring and protection", "Site installation"],
    photoId: "874640571557599",
  },
];

export const beyondSolar = {
  title: "Beyond solar",
  intro:
    "We are an electrical trading company first — the warehouse, the stock and the crews are the same ones behind every solar job.",
  groups: [
    {
      title: "Electrical supplies",
      items: ["LED lights", "Flood lights", "Wires and cables", "Switches", "Breakers", "Bulk orders"],
    },
    {
      title: "Electrical works",
      items: ["CCTV systems", "Fire detection and alarm (FDAS)", "Transformers", "Generator sets", "LED walls", "Street light poles"],
    },
  ],
} as const;

export type Product = {
  id: string;
  name: string;
  category: string;
  blurb: string;
  photoId: string;
  tag?: string;
};

export const products: Product[] = [
  {
    id: "eco-vo-300w",
    name: "ECO V.O 300 W Solar Street Light",
    category: "Street lighting",
    blurb: "Our own line of solar street lights, supplied in batches for government and private rollouts.",
    photoId: "874428934912096",
    tag: "In stock",
  },
  {
    id: "vo-solar-light",
    name: "V.O Solar Light",
    category: "Street lighting",
    blurb: "All-in-one solar light heads with integrated panel and battery — for roads, yards and compounds.",
    photoId: "308335834854745",
  },
  {
    id: "vo-led-face",
    name: "V.O LED Light Head",
    category: "LED lighting",
    blurb: "High-output LED light heads, built for outdoor mounting and easy maintenance.",
    photoId: "308352391519756",
  },
  {
    id: "solar-road-stud",
    name: "Solar Road Stud",
    category: "Road safety",
    blurb: "Solar-charged road studs in aluminium housings — road marking that works at night.",
    photoId: "251899563831706",
  },
  {
    id: "street-light-poles",
    name: "Street Light Poles",
    category: "Street lighting",
    blurb: "Hot-dip galvanised, powder-coated poles in silver grey. 6 m and 8 m, delivered nationwide.",
    photoId: "582435230778136",
  },
  {
    id: "bulk-stock",
    name: "Bulk Orders",
    category: "Supply",
    blurb: "Wires and cables, switches, breakers, flood lights and LED products — boxed, palletised and ready for dispatch.",
    photoId: "884970350524621",
  },
  {
    id: "led-wall",
    name: "LED Wall",
    category: "Events & display",
    blurb: "LED wall supply and installation for events and venues, with on-site commissioning.",
    photoId: "669091785445813",
  },
  {
    id: "generator",
    name: "Generator Sets",
    category: "Power",
    blurb: "Generator sets supplied for backup and site power — ask for available capacities.",
    photoId: "348013334220328",
  },
];

export const processSteps = [
  {
    index: "01",
    title: "Survey",
    body: "We look at the site: roof or ground, shading, the electrical load, and where the equipment can live. Installation work starts with an assessment, not a guess.",
    note: "Site assessment",
  },
  {
    index: "02",
    title: "Design",
    body: "System sizing, panel layout, inverter placement and protection. You get a proposal that explains what will be installed and why.",
    note: "Layout & proposal",
  },
  {
    index: "03",
    title: "Supply",
    body: "Panels, inverters, mounting, cables, breakers, lights. We are an electrical trading company — the materials come through our own stock and supplier network.",
    note: "Materials & logistics",
  },
  {
    index: "04",
    title: "Install",
    body: "Our own crew builds it: mounts, panels, wiring, protection, and the small details that decide whether a system lasts.",
    note: "Construction",
  },
  {
    index: "05",
    title: "Test & hand over",
    body: "Testing and commissioning before handover, with a walkthrough of the system. For LGU and institutional clients we also brief the end-users who maintain it.",
    note: "Commissioning",
  },
];

export const credentials = [
  {
    label: "DOE “Certified PV Solar Installer”",
    detail: "The credential our company states on its project posts.",
  },
  {
    label: "Private & government projects",
    detail: "Complete documents and PHILGEPS-ready for public bidding.",
  },
  {
    label: "Supply · Delivery · Installation",
    detail: "One team from the stockroom to the rooftop.",
  },
  {
    label: "Nationwide equipment delivery",
    detail: "Street light poles and solar lighting delivered across the country.",
  },
];

export const faqs = [
  {
    q: "Where do you install?",
    a: "We have delivered solar installations in Luzon and Mindanao, and our supplied equipment — street light poles, solar lights and electrical materials — is delivered nationwide. Tell us where your site is and we will confirm coverage.",
  },
  {
    q: "Do you handle government projects?",
    a: "Yes. We accept private and government projects with complete documents and are PHILGEPS-ready for public bidding.",
  },
  {
    q: "Can I order supplies without installation?",
    a: "Yes. Solar panels, inverters, solar street lights, poles, LED lighting, wires, cables, switches and breakers can be supplied on their own. Bulk orders are welcome.",
  },
  {
    q: "How do I get a quotation?",
    a: "Call or message us with your site location, the type of property, and what you want to power. We will tell you what we need for a proper quote — usually a site assessment comes first.",
  },
  {
    q: "What about warranty and after-sales?",
    a: "Equipment and workmanship terms depend on the system and are stated in your quotation. Ask us for the exact terms for your project before you commit.",
  },
] as const;
