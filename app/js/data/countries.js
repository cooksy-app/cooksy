/* Countries used for profile + availability hints.
   `market` groups countries with broadly similar grocery availability. */
window.Cooksy = window.Cooksy || {};

Cooksy.MARKETS = {
  'south-asia': 'South Asia',
  'europe': 'Europe',
  'north-america': 'North America',
  'latam': 'Latin America & Caribbean',
  'mena': 'Middle East & North Africa',
  'africa': 'Sub-Saharan Africa',
  'east-asia': 'East Asia',
  'se-asia': 'Southeast Asia',
  'oceania': 'Oceania',
};

Cooksy.COUNTRIES = [
  ['AR', 'Argentina', 'latam'], ['AU', 'Australia', 'oceania'], ['AT', 'Austria', 'europe'],
  ['BD', 'Bangladesh', 'south-asia'], ['BE', 'Belgium', 'europe'], ['BR', 'Brazil', 'latam'],
  ['CA', 'Canada', 'north-america'], ['CL', 'Chile', 'latam'], ['CN', 'China', 'east-asia'],
  ['CO', 'Colombia', 'latam'], ['HR', 'Croatia', 'europe'], ['CZ', 'Czechia', 'europe'],
  ['DK', 'Denmark', 'europe'], ['EG', 'Egypt', 'mena'], ['ET', 'Ethiopia', 'africa'],
  ['FI', 'Finland', 'europe'], ['FR', 'France', 'europe'], ['DE', 'Germany', 'europe'],
  ['GH', 'Ghana', 'africa'], ['GR', 'Greece', 'europe'], ['HU', 'Hungary', 'europe'],
  ['IN', 'India', 'south-asia'], ['ID', 'Indonesia', 'se-asia'], ['IR', 'Iran', 'mena'],
  ['IE', 'Ireland', 'europe'], ['IT', 'Italy', 'europe'], ['JP', 'Japan', 'east-asia'],
  ['JO', 'Jordan', 'mena'], ['KE', 'Kenya', 'africa'], ['KR', 'South Korea', 'east-asia'],
  ['LB', 'Lebanon', 'mena'], ['MY', 'Malaysia', 'se-asia'], ['MX', 'Mexico', 'latam'],
  ['MA', 'Morocco', 'mena'], ['NP', 'Nepal', 'south-asia'], ['NL', 'Netherlands', 'europe'],
  ['NZ', 'New Zealand', 'oceania'], ['NG', 'Nigeria', 'africa'], ['NO', 'Norway', 'europe'],
  ['PK', 'Pakistan', 'south-asia'], ['PE', 'Peru', 'latam'], ['PH', 'Philippines', 'se-asia'],
  ['PL', 'Poland', 'europe'], ['PT', 'Portugal', 'europe'], ['QA', 'Qatar', 'mena'],
  ['RO', 'Romania', 'europe'], ['SA', 'Saudi Arabia', 'mena'], ['RS', 'Serbia', 'europe'],
  ['SG', 'Singapore', 'se-asia'], ['SK', 'Slovakia', 'europe'], ['ZA', 'South Africa', 'africa'],
  ['ES', 'Spain', 'europe'], ['LK', 'Sri Lanka', 'south-asia'], ['SE', 'Sweden', 'europe'],
  ['CH', 'Switzerland', 'europe'], ['TH', 'Thailand', 'se-asia'], ['TR', 'Türkiye', 'mena'],
  ['AE', 'United Arab Emirates', 'mena'], ['GB', 'United Kingdom', 'europe'],
  ['US', 'United States', 'north-america'], ['VN', 'Vietnam', 'se-asia'],
].map(([code, name, market]) => ({
  code,
  name,
  market,
  flag: String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)),
}));

Cooksy.countryByCode = (code) => Cooksy.COUNTRIES.find((c) => c.code === code) || null;
