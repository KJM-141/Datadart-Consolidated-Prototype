/**
 * Cascading Country → State → City reference data.
 * Full country list; state/city detail bundled for showcase countries to keep
 * the prototype bundle small (the real portal loads these from /api/center/*).
 */

export interface GeoCountry {
  name: string;
  code: string;
  dial: string;
  states?: Record<string, string[]>;
}

const DETAILED: GeoCountry[] = [
  {
    name: "India",
    code: "IN",
    dial: "+91",
    states: {
      Karnataka: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi"],
      Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik"],
      Delhi: ["New Delhi", "Delhi"],
      "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
      Telangana: ["Hyderabad", "Warangal"],
      Gujarat: ["Ahmedabad", "Surat", "Vadodara"],
      "West Bengal": ["Kolkata", "Howrah", "Durgapur"],
      Haryana: ["Gurugram", "Faridabad", "Panipat"],
    },
  },
  {
    name: "United States",
    code: "US",
    dial: "+1",
    states: {
      California: ["San Francisco", "Los Angeles", "San Jose", "Sacramento"],
      Virginia: ["Ashburn", "Richmond", "Arlington", "Norfolk"],
      Texas: ["Austin", "Dallas", "Houston", "San Antonio"],
      "New York": ["New York City", "Buffalo", "Albany"],
      Washington: ["Seattle", "Spokane", "Tacoma"],
      Oregon: ["Portland", "Hillsboro", "Eugene"],
      Illinois: ["Chicago", "Springfield", "Naperville"],
    },
  },
  {
    name: "United Kingdom",
    code: "GB",
    dial: "+44",
    states: {
      England: ["London", "Manchester", "Birmingham", "Leeds"],
      Scotland: ["Edinburgh", "Glasgow", "Aberdeen"],
      Wales: ["Cardiff", "Swansea", "Newport"],
      "Northern Ireland": ["Belfast", "Derry"],
    },
  },
  {
    name: "Australia",
    code: "AU",
    dial: "+61",
    states: {
      "New South Wales": ["Sydney", "Newcastle", "Wollongong"],
      Victoria: ["Melbourne", "Geelong", "Ballarat"],
      Queensland: ["Brisbane", "Gold Coast", "Cairns"],
      "Western Australia": ["Perth", "Fremantle"],
      "South Australia": ["Adelaide", "Mount Gambier"],
    },
  },
  {
    name: "United Arab Emirates",
    code: "AE",
    dial: "+971",
    states: {
      Dubai: ["Dubai"],
      "Abu Dhabi": ["Abu Dhabi", "Al Ain"],
      Sharjah: ["Sharjah"],
    },
  },
  {
    name: "Singapore",
    code: "SG",
    dial: "+65",
    states: {
      "Central Region": ["Singapore"],
      "East Region": ["Tampines", "Changi"],
      "West Region": ["Jurong East", "Tuas"],
    },
  },
  {
    name: "Germany",
    code: "DE",
    dial: "+49",
    states: {
      Hesse: ["Frankfurt", "Wiesbaden", "Darmstadt"],
      Bavaria: ["Munich", "Nuremberg", "Augsburg"],
      Berlin: ["Berlin"],
      "North Rhine-Westphalia": ["Cologne", "Düsseldorf", "Dortmund"],
    },
  },
  {
    name: "Japan",
    code: "JP",
    dial: "+81",
    states: {
      Tokyo: ["Tokyo", "Hachioji"],
      Osaka: ["Osaka", "Sakai"],
      Kanagawa: ["Yokohama", "Kawasaki"],
      Aichi: ["Nagoya", "Toyota"],
    },
  },
  {
    name: "Canada",
    code: "CA",
    dial: "+1",
    states: {
      Ontario: ["Toronto", "Ottawa", "Mississauga"],
      Quebec: ["Montreal", "Quebec City"],
      "British Columbia": ["Vancouver", "Victoria"],
      Alberta: ["Calgary", "Edmonton"],
    },
  },
  {
    name: "France",
    code: "FR",
    dial: "+33",
    states: {
      "Île-de-France": ["Paris", "Versailles"],
      "Auvergne-Rhône-Alpes": ["Lyon", "Grenoble"],
      "Provence-Alpes-Côte d'Azur": ["Marseille", "Nice"],
    },
  },
];

const OTHER_COUNTRIES: [string, string, string][] = [
  ["Afghanistan", "AF", "+93"], ["Albania", "AL", "+355"], ["Algeria", "DZ", "+213"],
  ["Argentina", "AR", "+54"], ["Austria", "AT", "+43"], ["Bahrain", "BH", "+973"],
  ["Bangladesh", "BD", "+880"], ["Belgium", "BE", "+32"], ["Brazil", "BR", "+55"],
  ["Bulgaria", "BG", "+359"], ["Chile", "CL", "+56"], ["China", "CN", "+86"],
  ["Colombia", "CO", "+57"], ["Croatia", "HR", "+385"], ["Czechia", "CZ", "+420"],
  ["Denmark", "DK", "+45"], ["Egypt", "EG", "+20"], ["Estonia", "EE", "+372"],
  ["Ethiopia", "ET", "+251"], ["Finland", "FI", "+358"], ["Ghana", "GH", "+233"],
  ["Greece", "GR", "+30"], ["Hong Kong", "HK", "+852"], ["Hungary", "HU", "+36"],
  ["Iceland", "IS", "+354"], ["Indonesia", "ID", "+62"], ["Ireland", "IE", "+353"],
  ["Israel", "IL", "+972"], ["Italy", "IT", "+39"], ["Jordan", "JO", "+962"],
  ["Kenya", "KE", "+254"], ["Kuwait", "KW", "+965"], ["Latvia", "LV", "+371"],
  ["Lithuania", "LT", "+370"], ["Luxembourg", "LU", "+352"], ["Malaysia", "MY", "+60"],
  ["Mexico", "MX", "+52"], ["Morocco", "MA", "+212"], ["Nepal", "NP", "+977"],
  ["Netherlands", "NL", "+31"], ["New Zealand", "NZ", "+64"], ["Nigeria", "NG", "+234"],
  ["Norway", "NO", "+47"], ["Oman", "OM", "+968"], ["Pakistan", "PK", "+92"],
  ["Peru", "PE", "+51"], ["Philippines", "PH", "+63"], ["Poland", "PL", "+48"],
  ["Portugal", "PT", "+351"], ["Qatar", "QA", "+974"], ["Romania", "RO", "+40"],
  ["Saudi Arabia", "SA", "+966"], ["Serbia", "RS", "+381"], ["Slovakia", "SK", "+421"],
  ["Slovenia", "SI", "+386"], ["South Africa", "ZA", "+27"], ["South Korea", "KR", "+82"],
  ["Spain", "ES", "+34"], ["Sri Lanka", "LK", "+94"], ["Sweden", "SE", "+46"],
  ["Switzerland", "CH", "+41"], ["Taiwan", "TW", "+886"], ["Tanzania", "TZ", "+255"],
  ["Thailand", "TH", "+66"], ["Turkey", "TR", "+90"], ["Ukraine", "UA", "+380"],
  ["Uruguay", "UY", "+598"], ["Vietnam", "VN", "+84"],
];

export const COUNTRIES: GeoCountry[] = [
  ...DETAILED,
  ...OTHER_COUNTRIES.map(([name, code, dial]) => ({ name, code, dial })),
].sort((a, b) => a.name.localeCompare(b.name));

export function getCountry(name: string): GeoCountry | undefined {
  return COUNTRIES.find((c) => c.name === name);
}

export function statesOf(countryName: string): string[] {
  const c = getCountry(countryName);
  if (!c) return [];
  if (c.states) return Object.keys(c.states);
  // Countries without bundled detail still cascade with a generic region
  return ["Capital Region", "Central", "Northern", "Southern"];
}

export function citiesOf(countryName: string, stateName: string): string[] {
  const c = getCountry(countryName);
  if (!c) return [];
  if (c.states?.[stateName]) return c.states[stateName];
  if (c.states) return [];
  return ["Metro City", "Port City", "Tech Park District"];
}

export const CLOUD_PROVIDERS = ["AWS", "Azure", "GCP", "IBM Cloud", "OCI"] as const;

