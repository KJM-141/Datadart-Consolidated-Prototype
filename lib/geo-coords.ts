/** Approximate [lat, lon] for every city in the bundled geo dataset, so any
 *  order raised through the wizard lands on the live world map. */
const CITY_COORDS: Record<string, [number, number]> = {
  // India
  Bengaluru: [12.97, 77.59], Mysuru: [12.3, 76.65], Mangaluru: [12.91, 74.86],
  Hubballi: [15.36, 75.12], Mumbai: [19.08, 72.88], Pune: [18.52, 73.86],
  Nagpur: [21.15, 79.09], Nashik: [20.0, 73.79], "New Delhi": [28.61, 77.21],
  Delhi: [28.7, 77.1], Chennai: [13.08, 80.27], Coimbatore: [11.02, 76.96],
  Madurai: [9.93, 78.12], Hyderabad: [17.38, 78.49], Warangal: [17.98, 79.6],
  Ahmedabad: [23.03, 72.58], Surat: [21.17, 72.83], Vadodara: [22.31, 73.19],
  Kolkata: [22.57, 88.36], Howrah: [22.59, 88.31], Durgapur: [23.55, 87.29],
  Gurugram: [28.46, 77.03], Faridabad: [28.41, 77.31], Panipat: [29.39, 76.96],
  // United States
  "San Francisco": [37.77, -122.42], "Los Angeles": [34.05, -118.24],
  "San Jose": [37.34, -121.89], Sacramento: [38.58, -121.49],
  Ashburn: [39.04, -77.49], Richmond: [37.54, -77.44], Arlington: [38.88, -77.1],
  Norfolk: [36.85, -76.29], Austin: [30.27, -97.74], Dallas: [32.78, -96.8],
  Houston: [29.76, -95.37], "San Antonio": [29.42, -98.49],
  "New York City": [40.71, -74.01], Buffalo: [42.89, -78.88], Albany: [42.65, -73.75],
  Seattle: [47.61, -122.33], Spokane: [47.66, -117.43], Tacoma: [47.25, -122.44],
  Portland: [45.52, -122.68], Hillsboro: [45.52, -122.99], Eugene: [44.05, -123.09],
  Chicago: [41.88, -87.63], Springfield: [39.8, -89.64], Naperville: [41.75, -88.15],
  // United Kingdom
  London: [51.51, -0.13], Manchester: [53.48, -2.24], Birmingham: [52.49, -1.89],
  Leeds: [53.8, -1.55], Edinburgh: [55.95, -3.19], Glasgow: [55.86, -4.25],
  Aberdeen: [57.15, -2.09], Cardiff: [51.48, -3.18], Swansea: [51.62, -3.94],
  Newport: [51.58, -2.99], Belfast: [54.6, -5.93], Derry: [55.0, -7.32],
  // Australia
  Sydney: [-33.87, 151.21], Newcastle: [-32.93, 151.78], Wollongong: [-34.43, 150.89],
  Melbourne: [-37.81, 144.96], Geelong: [-38.15, 144.36], Ballarat: [-37.56, 143.85],
  Brisbane: [-27.47, 153.03], "Gold Coast": [-28.02, 153.4], Cairns: [-16.92, 145.77],
  Perth: [-31.95, 115.86], Fremantle: [-32.06, 115.75], Adelaide: [-34.93, 138.6],
  "Mount Gambier": [-37.83, 140.78],
  // United Arab Emirates
  Dubai: [25.2, 55.27], "Abu Dhabi": [24.45, 54.38], "Al Ain": [24.19, 55.76],
  Sharjah: [25.35, 55.42],
  // Singapore
  Singapore: [1.35, 103.82], Tampines: [1.35, 103.94], Changi: [1.35, 103.99],
  "Jurong East": [1.33, 103.74], Tuas: [1.32, 103.65],
  // Germany
  Frankfurt: [50.11, 8.68], Wiesbaden: [50.08, 8.24], Darmstadt: [49.87, 8.65],
  Munich: [48.14, 11.58], Nuremberg: [49.45, 11.08], Augsburg: [48.37, 10.9],
  Berlin: [52.52, 13.4], Cologne: [50.94, 6.96], Düsseldorf: [51.23, 6.77],
  Dortmund: [51.51, 7.47],
  // Japan
  Tokyo: [35.68, 139.69], Hachioji: [35.66, 139.32], Osaka: [34.69, 135.5],
  Sakai: [34.57, 135.48], Yokohama: [35.44, 139.64], Kawasaki: [35.53, 139.7],
  Nagoya: [35.18, 136.91], Toyota: [35.08, 137.16],
  // Canada
  Toronto: [43.65, -79.38], Ottawa: [45.42, -75.7], Mississauga: [43.59, -79.64],
  Montreal: [45.5, -73.57], "Quebec City": [46.81, -71.21],
  Vancouver: [49.28, -123.12], Victoria: [48.43, -123.37], Calgary: [51.05, -114.07],
  Edmonton: [53.55, -113.49],
  // France
  Paris: [48.86, 2.35], Versailles: [48.8, 2.13], Lyon: [45.76, 4.84],
  Grenoble: [45.19, 5.72], Marseille: [43.3, 5.37], Nice: [43.7, 7.27],
};

export function cityCoords(city: string): [number, number] | undefined {
  return CITY_COORDS[city];
}
