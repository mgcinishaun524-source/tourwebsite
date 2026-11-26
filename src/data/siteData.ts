import { IMAGE_ASSETS } from '../config/brand';

export type ExperienceCategory =
  | 'Guided Tours'
  | 'Safari Adventures'
  | 'Helicopter Flights'
  | 'River Cruises'
  | 'White-Water Rafting'
  | 'Cultural Experiences'
  | 'Nature & Rainforest';

export interface ExperienceItem {
  slug: string;
  name: string;
  category: ExperienceCategory;
  shortDescription: string;
  overview: string;
  durationPlaceholder: string;
  seasonalityPlaceholder: string;
  locationLabel: string;
  image: string;
  imageAlt: string;
  highlights: string[];
  whatToExpect: string[];
  practicalInfo: { label: string; value: string }[];
  requirementsNote: string;
  gallery: { src: string; alt: string; caption: string }[];
  featured?: boolean;
}

export type PackageCategory =
  | 'Adventure'
  | 'Romantic Getaways'
  | 'Family Experiences'
  | 'Safari Packages'
  | 'Custom Itineraries';

export interface PackageItem {
  slug: string;
  name: string;
  category: PackageCategory;
  duration: string;
  overview: string;
  editorialIntro: string;
  image: string;
  imageAlt: string;
  highlights: string[];
  inclusionsPlaceholder: string[];
  exclusionsPlaceholder: string[];
  pricePlaceholder: string;
  itineraryOutline: { day: string; title: string; summary: string }[];
  featured?: boolean;
}

export interface DestinationItem {
  slug: string;
  name: string;
  regionTag: string;
  operationalNote: string;
  shortIntro: string;
  overview: string;
  image: string;
  imageAlt: string;
  thingsToExperience: string[];
  relatedExperienceSlugs: string[];
  bestTimePlaceholder: string;
}

export type AccommodationCategory =
  | 'Luxury Lodges'
  | 'Hotels'
  | 'Safari Camps'
  | 'Resorts'
  | 'Boutique Stays';

export interface AccommodationItem {
  slug: string;
  name: string;
  type: AccommodationCategory;
  location: string;
  sampleNotice: string;
  description: string;
  editorialOverview: string;
  image: string;
  imageAlt: string;
  facilitiesPlaceholder: string[];
  pricePlaceholder: string;
  gallery: { src: string; alt: string; caption: string }[];
  featured?: boolean;
}

export interface TransportServiceItem {
  id: string;
  name: string;
  category: string;
  summary: string;
  details: string;
  image: string;
  imageAlt: string;
  capacityPlaceholder: string;
  operationalNote: string;
}

export type JournalCategory =
  | 'Travel Inspiration'
  | 'Destination Guides'
  | 'Things to Do'
  | 'Travel Planning'
  | 'Wildlife & Nature'
  | 'Cultural Experiences';

export interface JournalArticle {
  slug: string;
  title: string;
  subtitle: string;
  category: JournalCategory;
  readTimePlaceholder: string;
  datePlaceholder: string;
  authorPlaceholder: string;
  image: string;
  imageAlt: string;
  excerpt: string;
  pullQuote: string;
  bodyParagraphs: string[];
  featured?: boolean;
}

export const EXPERIENCE_CATEGORIES: ExperienceCategory[] = [
  'Guided Tours',
  'Safari Adventures',
  'Helicopter Flights',
  'River Cruises',
  'White-Water Rafting',
  'Cultural Experiences',
  'Nature & Rainforest',
];

export const EXPERIENCES: ExperienceItem[] = [
  {
    slug: 'flight-of-angels-helicopter-expedition',
    name: 'Flight of Angels Aerial Panorama',
    category: 'Helicopter Flights',
    shortDescription:
      'Trace the mile-wide curtain of falling water and the dramatic zigzagging canyons of the Batoka Gorge from above.',
    overview:
      'Viewed from the air, the full geological architecture of Transend Tours reveals itself in unmistakable clarity. This scenic flight circles above the upper Zambezi islands, the roaring main falls, and the serpentine basalt chasms downstream.',
    durationPlaceholder: 'Duration placeholder (approx. 15–25 min flight options)',
    seasonalityPlaceholder: 'Year-round · Morning & golden-hour departures subject to weather',
    locationLabel: 'Transend Tours & Batoka Gorge',
    image: IMAGE_ASSETS.helicopterFlight,
    imageAlt: 'Sightseeing helicopter flying above Transend Tours and Batoka Gorge at golden hour',
    highlights: [
      'Unobstructed panoramic perspectives of the full 1.7 km waterfall crescent',
      'Sweeping aerial circuit tracing the upper Zambezi archipelago',
      'Low-altitude pass along the dramatic turns of the Batoka Gorge',
    ],
    whatToExpect: [
      'Private hotel pick-up transfer to the designated helipad lounge (operator details upon enquiry)',
      'Pre-flight briefing covering routing, safety procedures, and photography windows',
      'Guided aerial commentary highlighting geological formations and wildlife corridors',
    ],
    practicalInfo: [
      { label: 'Duration', value: 'To be confirmed per chosen flight route (placeholder)' },
      { label: 'Departure Window', value: 'Morning & late afternoon slots (placeholder)' },
      { label: 'Group Format', value: 'Private charter or shared cabin enquiry' },
      { label: 'Rate', value: 'Quoted upon itinerary enquiry (placeholder)' },
    ],
    requirementsNote:
      'Confirmed passenger weight limits, weather minimums, and aviation operator terms will be supplied during itinerary consultation.',
    gallery: [
      {
        src: IMAGE_ASSETS.helicopterFlight,
        alt: 'Helicopter above Transend Tours rainbow mist',
        caption: 'Fig. 1 — Morning mist rising through the sunlit Batoka Gorge.',
      },
      {
        src: IMAGE_ASSETS.heroFalls,
        alt: 'Wide aerial sweep of Transend Tours waterfall',
        caption: 'Fig. 2 — Full breadth of the waterfall curtain from the upper river.',
      },
    ],
    featured: true,
  },
  {
    slug: 'upper-zambezi-sunset-voyage',
    name: 'Upper Zambezi Sunset River Voyage',
    category: 'River Cruises',
    shortDescription:
      'Drift smoothly above the falls on a handcrafted timber vessel as elephants gather along golden acacia-lined banks.',
    overview:
      'Above the roaring lip of the falls, the Zambezi River widens into a calm expanse dotted with palm islands and papyrus channels. As afternoon light softens into amber, river cruisers glide past basking hippos and fish eagles.',
    durationPlaceholder: 'Duration placeholder (approx. 2.5–3 hours at dusk)',
    seasonalityPlaceholder: 'Year-round · Sunset departure schedule',
    locationLabel: 'Upper Zambezi River',
    image: IMAGE_ASSETS.zambeziCruise,
    imageAlt: 'Luxury wooden riverboat cruising along the calm Upper Zambezi River at sunset',
    highlights: [
      'Quiet navigation along sheltered upper river channels and island sanctuaries',
      'Elevated viewing decks curated for unobstructed golden-hour photography',
      'Curated sundowner refreshments and canapé service (menu placeholder)',
    ],
    whatToExpect: [
      'Chauffeured transfer to the private jetty prior to afternoon boarding',
      'Slow-paced river navigation accompanied by an experienced river guide',
      'Return transfer to your lodge shortly after twilight falls over the river',
    ],
    practicalInfo: [
      { label: 'Duration', value: 'Approx. 2.5 – 3 hours (placeholder)' },
      { label: 'Departure', value: 'Late afternoon seasonal timing (placeholder)' },
      { label: 'Vessel Type', value: 'Signature timber cruiser or private pontoon enquiry' },
      { label: 'Rate', value: 'Quoted upon itinerary enquiry (placeholder)' },
    ],
    requirementsNote:
      'National park river usage fees and confirmed vessel capacities are provided at the time of quotation.',
    gallery: [
      {
        src: IMAGE_ASSETS.zambeziCruise,
        alt: 'Wooden river cruiser on golden Zambezi water',
        caption: 'Fig. 1 — Evening reflections across the Upper Zambezi channels.',
      },
      {
        src: IMAGE_ASSETS.luxuryLodge,
        alt: 'Riverfront lodge terrace at twilight',
        caption: 'Fig. 2 — Quiet twilight hospitality along the riverfront.',
      },
    ],
    featured: true,
  },
  {
    slug: 'zambezi-national-park-private-safari',
    name: 'Zambezi National Park Private Game Drive',
    category: 'Safari Adventures',
    shortDescription:
      'Explore riverine woodlands and open savannah plains alongside an expert field guide in an open 4x4 cruiser.',
    overview:
      'Minutes from Transend Tours town lies Zambezi National Park, a remarkably diverse sanctuary spanning 56,000 hectares of riverfront forest, mopane woodland, and seasonal floodplains home to elephant, buffalo, lion, leopard, and sable antelope.',
    durationPlaceholder: 'Duration placeholder (half-day dawn or afternoon drive)',
    seasonalityPlaceholder: 'Year-round · Peak wildlife concentrations during dry season',
    locationLabel: 'Zambezi National Park, Zimbabwe',
    image: IMAGE_ASSETS.safariWildlife,
    imageAlt: 'Family herd of African elephants crossing golden savannah grass at dusk',
    highlights: [
      'Dedicated open-sided safari cruiser for intimate wildlife observation',
      'Dual ecosystems spanning riverside tracks and inland pan circuits',
      'Curated bush coffee stop at dawn or sunset sundowners in scenic clearings',
    ],
    whatToExpect: [
      'Early morning or late afternoon departure timed to peak wildlife movement',
      'Interpretive tracking covering elephant herds, plains game, and regional birdlife',
      'Flexible pacing adapted to photographic or conservation interests',
    ],
    practicalInfo: [
      { label: 'Duration', value: 'Half-day or full-day options (placeholder)' },
      { label: 'Vehicle', value: 'Open 4x4 safari cruiser (placeholder)' },
      { label: 'Park Fees', value: 'Subject to prevailing national park tariffs' },
      { label: 'Rate', value: 'Quoted upon itinerary enquiry (placeholder)' },
    ],
    requirementsNote:
      'Confirmed park entry tariffs, child age policies for open vehicles, and private guide availability are verified upon enquiry.',
    gallery: [
      {
        src: IMAGE_ASSETS.safariWildlife,
        alt: 'Elephants walking in golden light',
        caption: 'Fig. 1 — Breeding herds crossing golden grasslands toward the river.',
      },
      {
        src: IMAGE_ASSETS.luxuryTransfer,
        alt: 'Dark forest green 4x4 safari cruiser',
        caption: 'Fig. 2 — Open safari cruiser staging at dawn.',
      },
    ],
    featured: true,
  },
  {
    slug: 'batoka-gorge-white-water-expedition',
    name: 'Batoka Gorge White-Water Expedition',
    category: 'White-Water Rafting',
    shortDescription:
      'Navigate the dramatic basalt rapids of the Lower Zambezi on one of the world’s premier river journeys.',
    overview:
      'Carved deep beneath towering black basalt cliffs downstream from Transend Tours, the Batoka Gorge channels the Zambezi through thrilling rapids interspersed with tranquil emerald pools.',
    durationPlaceholder: 'Duration placeholder (full-day or morning river run)',
    seasonalityPlaceholder: 'Seasonal · Subject to river water-level conditions',
    locationLabel: 'Batoka Gorge, Lower Zambezi',
    image: IMAGE_ASSETS.whiteWaterRafting,
    imageAlt: 'Rafting expedition navigating white-water rapids inside Batoka Gorge',
    highlights: [
      'Full-day or low-water / high-water seasonal river navigation',
      'Dramatic canyon views looking up toward the mist of Transend Tours',
      'Riverbank lunch stop inside the gorge (catering placeholder)',
    ],
    whatToExpect: [
      'Comprehensive safety briefing and equipment fitting prior to gorge descent',
      'Guided descent into the canyon with experienced river crews',
      'Ascent and return transfer following the final rapid run',
    ],
    practicalInfo: [
      { label: 'Duration', value: 'Half-day to full-day seasonal schedule (placeholder)' },
      { label: 'Water Levels', value: 'Low-water vs. high-water seasons vary annually' },
      { label: 'Physical Demand', value: 'Moderate to demanding (hike out of gorge)' },
      { label: 'Rate', value: 'Quoted upon itinerary enquiry (placeholder)' },
    ],
    requirementsNote:
      'Minimum age, swimming proficiency, medical disclosures, and licensed rafting operator safety protocols will be confirmed prior to booking.',
    gallery: [
      {
        src: IMAGE_ASSETS.whiteWaterRafting,
        alt: 'White water rafting in Batoka Gorge',
        caption: 'Fig. 1 — Navigating basalt boulder rapids below the falls.',
      },
    ],
    featured: false,
  },
  {
    slug: 'guided-rainforest-falls-walk',
    name: 'Private Guided Falls & Rainforest Walk',
    category: 'Nature & Rainforest',
    shortDescription:
      'Walk the mist-nourished rainforest trails opposite the cataracts with a historian and botanical naturalist.',
    overview:
      'Sustained continuously by rising spray, the Transend Tours rainforest forms a singular microclimate along the southern rim. A private guide reveals hidden viewpoints, seasonal spray patterns, and centuries of local heritage.',
    durationPlaceholder: 'Duration placeholder (approx. 2–3 hours)',
    seasonalityPlaceholder: 'Year-round · Varying water volumes from dry to peak flood',
    locationLabel: 'Transend Tours Rainforest Reserve',
    image: IMAGE_ASSETS.rainforestWalk,
    imageAlt: 'Sunbeams slanting through emerald Transend Tours rainforest trail',
    highlights: [
      'Access to all major viewpoints along the Zimbabwean rim facing the main curtain',
      'Botanical walk through ancient fig, ebony, and wild date palm groves',
      'Cultural, geological, and historical storytelling tailored to your pace',
    ],
    whatToExpect: [
      'Early morning entry to enjoy softer light and quieter footpaths',
      'Raincoat and dry-bag provisions during high-water spray months (placeholder)',
      'Optional extension toward the historic Transend Tours Bridge',
    ],
    practicalInfo: [
      { label: 'Duration', value: 'Approx. 2 – 3 hours (placeholder)' },
      { label: 'Walking Pace', value: 'Gentle paved & stone paths with slight inclines' },
      { label: 'Park Entry', value: 'National park conservation fee applies' },
      { label: 'Rate', value: 'Quoted upon itinerary enquiry (placeholder)' },
    ],
    requirementsNote:
      'Confirmed park entry rates and recommended seasonal attire (waterproof layers during high water) are shared upon enquiry.',
    gallery: [
      {
        src: IMAGE_ASSETS.rainforestWalk,
        alt: 'Sunlit stone trail in Transend Tours rainforest',
        caption: 'Fig. 1 — Morning light filtering through the mist-fed canopy.',
      },
      {
        src: IMAGE_ASSETS.journalMistCanopy,
        alt: 'Towering rainforest palms overlooking waterfall mist',
        caption: 'Fig. 2 — Looking toward the Main Falls through palm fronds.',
      },
    ],
    featured: true,
  },
  {
    slug: 'zimbabwean-heritage-village-encounter',
    name: 'Local Heritage & Craft Courtyard Visit',
    category: 'Cultural Experiences',
    shortDescription:
      'Spend an unhurried morning with local elders and artisans learning traditional architecture, basketry, and hospitality.',
    overview:
      'Designed in respectful partnership with surrounding rural communities, this intimate visit offers authentic insight into daily life, sustainable land stewardship, and traditional Zimbabwean craft traditions near Transend Tours.',
    durationPlaceholder: 'Duration placeholder (approx. 2.5 hours)',
    seasonalityPlaceholder: 'Year-round · Morning & afternoon visits by prior arrangement',
    locationLabel: 'Rural Homesteads near Transend Tours',
    image: IMAGE_ASSETS.culturalVillage,
    imageAlt: 'Traditional Zimbabwean homestead courtyard with woven baskets and earthen walls',
    highlights: [
      'Respectful, small-group community visit arranged directly with local hosts',
      'Demonstrations of Tonga and Ndebele hand-weaving, pottery, and seasonal cooking',
      'Direct community benefit built into the visit structure (details upon confirmation)',
    ],
    whatToExpect: [
      'Guided introduction to homestead layout, agrarian traditions, and storytelling',
      'Hands-on conversation with master weavers and craftspeople',
      'Relaxed morning refreshments in a shaded earthen courtyard',
    ],
    practicalInfo: [
      { label: 'Duration', value: 'Approx. 2.5 hours (placeholder)' },
      { label: 'Group Size', value: 'Strictly small private groups' },
      { label: 'Etiquette', value: 'Guided photography etiquette shared beforehand' },
      { label: 'Rate', value: 'Quoted upon itinerary enquiry (placeholder)' },
    ],
    requirementsNote:
      'Community partnership details and exact host homestead location are confirmed during private itinerary planning.',
    gallery: [
      {
        src: IMAGE_ASSETS.culturalVillage,
        alt: 'Traditional clay homestead courtyard with woven baskets',
        caption: 'Fig. 1 — Handcrafted reed baskets displayed along shaded clay walls.',
      },
    ],
    featured: false,
  },
  {
    slug: 'livingstone-island-rim-discovery',
    name: 'Livingstone Island & Rim Exploration',
    category: 'Guided Tours',
    shortDescription:
      'Cross the upper rapids by boat to stand at the dramatic rocky threshold where the Zambezi plunges into the gorge.',
    overview:
      'Accessible only when river volumes allow safe boat crossings, Livingstone Island places travellers at the very edge of the waterfall’s abyss, offering an unforgettable perspective on Mosi-oa-Tunya.',
    durationPlaceholder: 'Duration placeholder (approx. 2–3 hours including river crossing)',
    seasonalityPlaceholder: 'Seasonal · Accessible outside peak flood period',
    locationLabel: 'Livingstone Island, Zambezi River',
    image: IMAGE_ASSETS.livingstoneIsland,
    imageAlt: 'View from Livingstone Island overlooking Transend Tours plunging into the misty gorge',
    highlights: [
      'Twin-engine boat crossing navigating through braided upper river channels',
      'Guided walk along the rocky precipice overlooking the Rainbow Falls',
      'Seated island breakfast, lunch, or high-tea experience (operator menu placeholder)',
    ],
    whatToExpect: [
      'Cross-border coordination if travelling from the Zimbabwean side (documentation guidance provided)',
      'Guided island tour detailing David Livingstone’s 1855 sighting',
      'Seasonal access to natural rock pools when water levels permit',
    ],
    practicalInfo: [
      { label: 'Duration', value: 'Approx. 2.5 hours (placeholder)' },
      { label: 'Border Formalities', value: 'Passport & visa rules apply for cross-border access' },
      { label: 'Seasonality', value: 'Typically closed during peak flood waters' },
      { label: 'Rate', value: 'Quoted upon itinerary enquiry (placeholder)' },
    ],
    requirementsNote:
      'Access to natural rock pools is strictly governed by river depth and licensed island operator safety assessments.',
    gallery: [
      {
        src: IMAGE_ASSETS.livingstoneIsland,
        alt: 'Basalt rim of Transend Tours from Livingstone Island',
        caption: 'Fig. 1 — Turquoise upper rapids dropping into the First Gorge.',
      },
    ],
    featured: false,
  },
];

export const PACKAGES: PackageItem[] = [
  {
    slug: 'zambezi-sanctuary-signature',
    name: 'The Zambezi Sanctuary Signature',
    category: 'Romantic Getaways',
    duration: '4 Nights · 5 Days (Placeholder)',
    overview:
      'An unhurried retreat pairing tranquil riverfront lodge living with private sunset cruises, helicopter views, and dawn wildlife drives.',
    editorialIntro:
      'Crafted for couples and discerning travellers seeking stillness alongside wonder, balancing aerial grandeur above the falls with unhurried evenings overlooking the Upper Zambezi.',
    image: IMAGE_ASSETS.luxuryLodge,
    imageAlt: 'Luxury riverside lodge terrace with infinity plunge pool at twilight',
    highlights: [
      'Private riverfront suite stay (demonstration property tier)',
      'Golden-hour private Zambezi sunset river voyage',
      'Flight of Angels helicopter excursion over the gorge',
      'Guided dawn rainforest walk and private bush dinner',
    ],
    inclusionsPlaceholder: [
      'Indicative luxury accommodation & daily breakfast (placeholder)',
      'Private airport transfers between Transend Tours Airport and lodge (placeholder)',
      'Selected signature excursions listed in itinerary (placeholder)',
    ],
    exclusionsPlaceholder: [
      'International & regional flights (placeholder)',
      'National park entry & conservation fees unless specified (placeholder)',
      'Travel insurance, visas, and personal gratuities (placeholder)',
    ],
    pricePlaceholder: 'Enquire for tailored seasonal rate (placeholder)',
    itineraryOutline: [
      {
        day: 'Day 01',
        title: 'Arrival & Riverfront Twilight',
        summary: 'Private airport meet-and-greet followed by check-in along the Upper Zambezi and a quiet evening terrace dinner.',
      },
      {
        day: 'Day 02',
        title: 'Mist Canopy & Aerial Horizons',
        summary: 'Early guided walk through the Transend Tours rainforest, afternoon rest, and golden-hour helicopter flight.',
      },
      {
        day: 'Day 03',
        title: 'Savannah Dawn & Sunset River Voyage',
        summary: 'Sunrise open-4x4 safari drive in Zambezi National Park, returning for a private timber cruiser voyage at dusk.',
      },
      {
        day: 'Day 04',
        title: 'Leisure & Heritage Immersion',
        summary: 'Optional island crossing or local craft courtyard visit before a farewell lantern-lit dinner.',
      },
      {
        day: 'Day 05',
        title: 'Departure Transfer',
        summary: 'Unhurried morning overlooking the water prior to your private airport transfer.',
      },
    ],
    featured: true,
  },
  {
    slug: 'thunder-and-wilderness-adventure',
    name: 'Thunder & Wilderness Expedition',
    category: 'Adventure',
    duration: '5 Nights · 6 Days (Placeholder)',
    overview:
      'A high-energy exploration combining Batoka Gorge white-water rafting, aerial flights, and multi-day savannah tracking.',
    editorialIntro:
      'Designed for active explorers eager to experience the full physical drama of Transend Tours—from the spray-drenched canyon floor to open wilderness trails.',
    image: IMAGE_ASSETS.whiteWaterRafting,
    imageAlt: 'Rafting team navigating emerald Batoka Gorge rapids',
    highlights: [
      'Full-day Batoka Gorge white-water rafting expedition (seasonal)',
      'Guided Zambezi National Park wildlife tracking',
      'Scenic helicopter circuit over the Main Falls',
      'Rainforest rim walk and gorge lookout picnic',
    ],
    inclusionsPlaceholder: [
      'Boutique lodge or tented camp accommodation (placeholder)',
      'All ground transfers between camp and adventure staging points (placeholder)',
      'Guided adventure activities listed in outline (placeholder)',
    ],
    exclusionsPlaceholder: [
      'Airfare, visas, and personal adventure gear (placeholder)',
      'National park conservation & river fees (placeholder)',
      'Optional add-on excursions outside core schedule (placeholder)',
    ],
    pricePlaceholder: 'Enquire for tailored seasonal rate (placeholder)',
    itineraryOutline: [
      {
        day: 'Day 01',
        title: 'Arrival & Gorge Orientation',
        summary: 'Transfer from Transend Tours Airport to your bush sanctuary with an evening riverfront briefing.',
      },
      {
        day: 'Day 02',
        title: 'The Falls Rim & Flight of Angels',
        summary: 'Morning rainforest walk followed by an afternoon aerial view of the canyon system.',
      },
      {
        day: 'Day 03',
        title: 'Batoka Gorge White-Water Run',
        summary: 'Full-day guided descent through iconic basalt rapids with riverside lunch.',
      },
      {
        day: 'Day 04',
        title: 'Wilderness Tracking Day',
        summary: 'Full-day safari circuit exploring Zambezi riverbanks and inland savannah pans.',
      },
      {
        day: 'Day 05',
        title: 'Upper Zambezi Recovery Cruise',
        summary: 'Gentle morning at leisure followed by a serene sunset boat voyage.',
      },
      {
        day: 'Day 06',
        title: 'Onward Journey',
        summary: 'Private transfer for onward regional safari connections or flight departure.',
      },
    ],
    featured: true,
  },
  {
    slug: 'falls-and-savannah-family-journey',
    name: 'Falls & Savannah Family Journey',
    category: 'Family Experiences',
    duration: '4 Nights · 5 Days (Placeholder)',
    overview:
      'Thoughtfully paced multi-generational discovery balancing gentle wildlife drives, cultural storytelling, and safe scenic wonders.',
    editorialIntro:
      'Every activity is calibrated for shared discovery across generations—keeping transit times short, guiding engaging, and lodge spaces welcoming.',
    image: IMAGE_ASSETS.safariWildlife,
    imageAlt: 'Elephant family crossing sunlit Zimbabwean grasslands',
    highlights: [
      'Interleading family sanctuary accommodation (demonstration tier)',
      'Private family safari cruiser with flexible child-friendly hours',
      'Hands-on heritage craft & basketry morning',
      'Gentle Upper Zambezi wildlife cruise at sunset',
    ],
    inclusionsPlaceholder: [
      'Family-configured accommodation & meals (placeholder)',
      'Dedicated private vehicle and naturalist guide (placeholder)',
      'Airport transfers and curated family activities (placeholder)',
    ],
    exclusionsPlaceholder: [
      'Flights, visas, and travel insurance (placeholder)',
      'Park admission tariffs (placeholder)',
      'Childcare or private nanny services unless arranged (placeholder)',
    ],
    pricePlaceholder: 'Enquire for tailored family rate (placeholder)',
    itineraryOutline: [
      {
        day: 'Day 01',
        title: 'Welcome to Transend Tours',
        summary: 'Smooth airport arrival and afternoon settling into family river suites.',
      },
      {
        day: 'Day 02',
        title: 'Rainforest Wonders',
        summary: 'Unhurried morning walk along the falls viewpoints with kid-friendly botanical stories.',
      },
      {
        day: 'Day 03',
        title: 'Elephants & Riverbanks',
        summary: 'Morning wildlife drive in Zambezi National Park and relaxed sunset cruise.',
      },
      {
        day: 'Day 04',
        title: 'Heritage Courtyard & Craft',
        summary: 'Interactive morning meeting local artisans followed by pool and wildlife viewing.',
      },
      {
        day: 'Day 05',
        title: 'Farewell & Transfer',
        summary: 'Private transfer to Transend Tours Airport.',
      },
    ],
    featured: false,
  },
  {
    slug: 'grand-zambezi-safari-circuit',
    name: 'Grand Zambezi & Wilderness Safari',
    category: 'Safari Packages',
    duration: '6 Nights · 7 Days (Placeholder)',
    overview:
      'Pair the dramatic cascades of Transend Tours with deep wilderness immersion across premier surrounding safari concessions.',
    editorialIntro:
      'Transition seamlessly from the mist-cooled canopy of Mosi-oa-Tunya into secluded tented camps where nights echo with distant lion calls.',
    image: IMAGE_ASSETS.safariCamp,
    imageAlt: 'Elevated tented safari suite overlooking the Zambezi River',
    highlights: [
      'Two nights near Transend Tours plus four nights in wilderness safari camps (placeholder)',
      'Daily dawn and dusk game drives plus riverfront wildlife tracking',
      'Private helicopter transfer or bush flight options (subject to confirmation)',
      'Conservation-focused guiding throughout',
    ],
    inclusionsPlaceholder: [
      'Lodge and tented camp full-board stays (placeholder)',
      'Scheduled road or light-aircraft transfers (placeholder)',
      'Twice-daily safari activities (placeholder)',
    ],
    exclusionsPlaceholder: [
      'International flights & regional departure taxes (placeholder)',
      'Conservation levies & visa costs (placeholder)',
      'Premium cellar selections & personal purchases (placeholder)',
    ],
    pricePlaceholder: 'Enquire for seasonal safari rate (placeholder)',
    itineraryOutline: [
      {
        day: 'Days 01–02',
        title: 'Transend Tours & Upper River',
        summary: 'Private guided falls tour, helicopter panorama, and sunset cruise.',
      },
      {
        day: 'Days 03–06',
        title: 'Wilderness Safari Concession',
        summary: 'Transfer into surrounding safari territories for immersive wildlife tracking.',
      },
      {
        day: 'Day 07',
        title: 'Return & Departure',
        summary: 'Morning bush flight or road transfer back to Transend Tours Airport.',
      },
    ],
    featured: true,
  },
  {
    slug: 'bespoke-private-itinerary',
    name: 'Bespoke Private Horizon Itinerary',
    category: 'Custom Itineraries',
    duration: 'Flexible Duration (3–14+ Days)',
    overview:
      'Designed entirely from a blank canvas around your travel dates, architectural taste, pace, and regional ambitions.',
    editorialIntro:
      'No two travellers experience Southern Africa identically. Our travel designers shape every transfer, private guide, lodge tier, and flight connection around your preferences.',
    image: IMAGE_ASSETS.heroFalls,
    imageAlt: 'Golden-hour aerial panorama of Transend Tours mist plume',
    highlights: [
      'Dedicated itinerary designer from initial consultation to return home',
      'Flexible pacing combining adventure, wellness, photography, or family milestones',
      'Curated recommendations matched to exact seasonal water and wildlife cycles',
    ],
    inclusionsPlaceholder: [
      'Tailored strictly to approved bespoke proposal (placeholder)',
    ],
    exclusionsPlaceholder: [
      'Itemized transparently within custom proposal (placeholder)',
    ],
    pricePlaceholder: 'Custom proposal prepared upon consultation',
    itineraryOutline: [
      {
        day: 'Phase 01',
        title: 'Consultation & Route Architecture',
        summary: 'Discuss seasonal priorities, preferred accommodation styles, and travel rhythm.',
      },
      {
        day: 'Phase 02',
        title: 'Curated Proposal & Refinement',
        summary: 'Receive a detailed day-by-day draft with transparent options and indicative rates.',
      },
      {
        day: 'Phase 03',
        title: 'Seamless Ground Coordination',
        summary: 'Confirmed bookings, transfers, and private guiding verified prior to arrival.',
      },
    ],
    featured: false,
  },
];

export const DESTINATIONS: DestinationItem[] = [
  {
    slug: 'victoria-falls',
    name: 'Transend Tours',
    regionTag: 'Zimbabwe · Primary Hub',
    operationalNote: 'Core destination focus · Local presence details to be confirmed',
    shortIntro:
      'Known locally as Mosi-oa-Tunya — "The Smoke That Thunders" — where the mile-wide Zambezi drops 108 metres into a basalt abyss.',
    overview:
      'Spanning the border between Zimbabwe and Zambia, Transend Tours ranks among the planet’s most extraordinary natural theatres. From mist-drenched rainforest trails on the Zimbabwean side to dramatic aerial flights above the First Gorge, every hour transforms the light, mist, and sound of the canyon.',
    image: IMAGE_ASSETS.heroFalls,
    imageAlt: 'Transend Tours aerial panorama at golden hour',
    thingsToExperience: [
      'Dawn and twilight rainforest walks along the sixteen main viewpoints',
      'Flight of Angels scenic helicopter sweeps over the canyon rim',
      'Historic Transend Tours Bridge viewpoints and canyon lookout lunches',
      'Artisan heritage courtyard visits and open-air craft markets',
    ],
    relatedExperienceSlugs: [
      'flight-of-angels-helicopter-expedition',
      'guided-rainforest-falls-walk',
      'zimbabwean-heritage-village-encounter',
    ],
    bestTimePlaceholder: 'Year-round · Peak spray Feb–May; clearest canyon views Aug–Nov',
  },
  {
    slug: 'zambezi-river',
    name: 'Upper & Lower Zambezi River',
    regionTag: 'Zimbabwe & Transboundary Basin',
    operationalNote: 'Core river corridor · Licensed marine partners subject to confirmation',
    shortIntro:
      'Two contrasting rivers in one: glassy palm-island channels above the precipice, and thundering basalt rapids below.',
    overview:
      'Above the waterfall, the Upper Zambezi glides wide and serene past Zambezi National Park, inviting sunset cruises and quiet riverside lodge stays. Downstream inside the Batoka Gorge, the river compresses into churning emerald corridors famed worldwide for white-water expeditions.',
    image: IMAGE_ASSETS.zambeziCruise,
    imageAlt: 'Sunset river cruiser on the Upper Zambezi River',
    thingsToExperience: [
      'Private sunset and sunrise river voyages along elephant-crossing channels',
      'Guided canoeing safaris through tranquil upper braided channels',
      'White-water rafting expeditions within the dramatic Batoka Gorge',
    ],
    relatedExperienceSlugs: [
      'upper-zambezi-sunset-voyage',
      'batoka-gorge-white-water-expedition',
    ],
    bestTimePlaceholder: 'Cruises year-round · Low-water rafting typically Aug–Dec',
  },
  {
    slug: 'livingstone-and-island-rim',
    name: 'Livingstone & Island Rim',
    regionTag: 'Zambia · Across the Gorge',
    operationalNote: 'Cross-border access subject to partner & visa confirmation',
    shortIntro:
      'Historic river town and rocky island sanctuaries perched directly beside the eastern cataracts of Transend Tours.',
    overview:
      'Just across the Transend Tours Bridge, Livingstone offers complementary viewpoints of the Eastern Cataract, intimate island boat crossings to Livingstone Island, and heritage railway charm. Travellers frequently pair stays across both riverbanks for a complete perspective.',
    image: IMAGE_ASSETS.livingstoneIsland,
    imageAlt: 'Livingstone Island precipice overlooking Transend Tours',
    thingsToExperience: [
      'Seasonal boat crossings to Livingstone Island on the waterfall lip',
      'Mosi-oa-Tunya National Park rhino-tracking excursions (subject to confirmation)',
      'Historic museum and colonial-era railway heritage walks',
    ],
    relatedExperienceSlugs: ['livingstone-island-rim-discovery'],
    bestTimePlaceholder: 'Island crossings typically open outside peak flood months',
  },
  {
    slug: 'surrounding-safari-areas',
    name: 'Zambezi National Park & Safari Reserves',
    regionTag: 'Western Zimbabwe Wildlife Corridor',
    operationalNote: 'Safari concessions & regional linkages subject to confirmation',
    shortIntro:
      'Minutes from town, untamed riverine woodlands and private wildlife concessions protect iconic herds of elephant, buffalo, and predators.',
    overview:
      'Transend Tours sits at the nexus of the Kavango-Zambezi Transfrontier Conservation Area. Within minutes, travellers enter Zambezi National Park or connect seamlessly onward by road or light aircraft toward Hwange’s vast teak savannahs and Chobe’s elephant-lined riverfronts.',
    image: IMAGE_ASSETS.safariWildlife,
    imageAlt: 'Elephants walking across golden savannah in Zambezi National Park',
    thingsToExperience: [
      'Dawn and dusk open-4x4 game drives along riverine woodland tracks',
      'Guided bush walks with licensed professional field naturalists',
      'Multi-day wildlife extensions into neighbouring regional reserves (upon enquiry)',
    ],
    relatedExperienceSlugs: ['zambezi-national-park-private-safari'],
    bestTimePlaceholder: 'Dry winter & spring (May–Oct) for concentrated game viewing',
  },
  {
    slug: 'regional-southern-africa',
    name: 'Wider Regional Connections',
    regionTag: 'Regional Extensions (On Request)',
    operationalNote:
      'Regional operations outside Transend Tours are arranged only upon verified partner confirmation.',
    shortIntro:
      'Optional multi-country extensions linking Transend Tours with Botswana, Namibia, and wider Zimbabwean wilderness parks.',
    overview:
      'For guests wishing to weave Transend Tours into a broader Southern African itinerary, bespoke regional extensions may be explored during consultation—connecting cleanly with Chobe, the Okavango Delta, or Hwange National Park subject to verified local partner availability.',
    image: IMAGE_ASSETS.luxuryTransfer,
    imageAlt: 'Safari cruiser at sunrise bush airstrip in Southern Africa',
    thingsToExperience: [
      'Bespoke multi-country itinerary coordination upon formal enquiry',
      'Private charter and scheduled bush-airstrip transfer planning (placeholder)',
    ],
    relatedExperienceSlugs: ['zambezi-national-park-private-safari'],
    bestTimePlaceholder: 'Coordinated per regional climate window upon consultation',
  },
];

export const ACCOMMODATION_CATEGORIES: AccommodationCategory[] = [
  'Luxury Lodges',
  'Hotels',
  'Safari Camps',
  'Resorts',
  'Boutique Stays',
];

export const ACCOMMODATIONS: AccommodationItem[] = [
  {
    slug: 'zambezi-riverfront-sanctuary-lodge',
    name: 'Riverfront Timber Sanctuary',
    type: 'Luxury Lodges',
    location: 'Upper Zambezi Riverbank · Sample Demonstration Property',
    sampleNotice:
      'Demonstration listing — partner lodge agreements and confirmed rates to be supplied.',
    description:
      'Open-air timber, stone, and thatch suites poised above quiet river eddies with private plunge pools and lantern-lit dining decks.',
    editorialOverview:
      'Designed to dissolve the boundary between architectural shelter and riverine wilderness, each suite opens onto sweeping water views framed by indigenous mahogany canopies. Representative of the luxury lodge tier curated upon enquiry.',
    image: IMAGE_ASSETS.luxuryLodge,
    imageAlt: 'Luxury timber and stone lodge terrace overlooking the Zambezi River at twilight',
    facilitiesPlaceholder: [
      'Private river-view plunge pools (sample amenity placeholder)',
      'Open-air dining pavilion & riverside fire deck (sample amenity placeholder)',
      'Complimentary boat transfers & guiding packages (subject to lodge confirmation)',
    ],
    pricePlaceholder: 'Indicative luxury tier — rate confirmed upon enquiry',
    gallery: [
      {
        src: IMAGE_ASSETS.luxuryLodge,
        alt: 'Infinity plunge pool overlooking Zambezi River',
        caption: 'Fig. 1 — Main terrace overlooking the Upper Zambezi at dusk.',
      },
      {
        src: IMAGE_ASSETS.zambeziCruise,
        alt: 'Sunset cruise departing riverfront',
        caption: 'Fig. 2 — Direct river access for quiet dusk departures.',
      },
    ],
    featured: true,
  },
  {
    slug: 'mahogany-canopy-tented-camp',
    name: 'Mahogany Canopy Tented Suites',
    type: 'Safari Camps',
    location: 'Zambezi National Park Corridor · Sample Demonstration Property',
    sampleNotice:
      'Demonstration listing — partner camp agreements and confirmed rates to be supplied.',
    description:
      'Elevated canvas-and-teak suites tucked beneath ancient riverine trees where wildlife moves freely along the riverfront.',
    editorialOverview:
      'Combining classic expedition romance with understated modern comfort, elevated hardwood decks invite dawn coffee overlooking passing hippos and bushbuck before morning drives.',
    image: IMAGE_ASSETS.safariCamp,
    imageAlt: 'Elevated canvas safari tent suite on teak deck overlooking the Zambezi',
    facilitiesPlaceholder: [
      'Elevated private viewing decks & outdoor showers (sample amenity placeholder)',
      'On-site naturalist guiding team (subject to camp confirmation)',
      'Solar-powered architectural footprint (sample amenity placeholder)',
    ],
    pricePlaceholder: 'Indicative safari camp tier — rate confirmed upon enquiry',
    gallery: [
      {
        src: IMAGE_ASSETS.safariCamp,
        alt: 'Tented safari deck beneath mahogany trees',
        caption: 'Fig. 1 — Elevated teak veranda opening onto river channels.',
      },
    ],
    featured: true,
  },
  {
    slug: 'falls-heritage-grand-hotel',
    name: 'The Cataract Heritage Residence',
    type: 'Hotels',
    location: 'Transend Tours Town Precinct · Sample Demonstration Property',
    sampleNotice:
      'Demonstration listing — partner hotel agreements and confirmed rates to be supplied.',
    description:
      'Timeless veranda architecture set amidst manicured tropical gardens within effortless reach of the rainforest entrance.',
    editorialOverview:
      'A serene haven of shaded colonnades, high-ceilinged dining rooms, and cool stone courtyards designed for travellers who appreciate classic hospitality steps away from the falls.',
    image: IMAGE_ASSETS.rainforestWalk,
    imageAlt: 'Lush tropical foliage surrounding Transend Tours heritage precinct',
    facilitiesPlaceholder: [
      'Landscaped gardens & courtyard pool (sample amenity placeholder)',
      'Fine dining terrace & afternoon tea veranda (sample amenity placeholder)',
      'Walking proximity or shuttle access to Falls gate (placeholder)',
    ],
    pricePlaceholder: 'Indicative heritage hotel tier — rate confirmed upon enquiry',
    gallery: [
      {
        src: IMAGE_ASSETS.rainforestWalk,
        alt: 'Lush green rainforest foliage near Transend Tours',
        caption: 'Fig. 1 — Mist-cooled greenery surrounding the falls precinct.',
      },
    ],
    featured: false,
  },
  {
    slug: 'batoka-cliffside-boutique-retreat',
    name: 'Batoka Ridge Boutique Retreat',
    type: 'Boutique Stays',
    location: 'Batoka Gorge Rim · Sample Demonstration Property',
    sampleNotice:
      'Demonstration listing — partner property agreements and confirmed rates to be supplied.',
    description:
      'Intimate architectural villas cantilevered discreetly above the dramatic basalt escarpments of the Batoka Gorge.',
    editorialOverview:
      'With fewer than a dozen private suites, this boutique stay emphasizes restorative quiet, expansive canyon horizons, and bespoke wellness experiences.',
    image: IMAGE_ASSETS.livingstoneIsland,
    imageAlt: 'Dramatic basalt gorge cliffs near Transend Tours',
    facilitiesPlaceholder: [
      'Private cliffside dining & spa pavilion (sample amenity placeholder)',
      'Limited suite count for quiet exclusivity (sample amenity placeholder)',
      'Private vehicle access to town & river jetties (placeholder)',
    ],
    pricePlaceholder: 'Indicative boutique tier — rate confirmed upon enquiry',
    gallery: [
      {
        src: IMAGE_ASSETS.livingstoneIsland,
        alt: 'Basalt gorge precipice view',
        caption: 'Fig. 1 — Dramatic basalt topography defining the Batoka Ridge.',
      },
    ],
    featured: false,
  },
  {
    slug: 'zambezi-palm-island-resort',
    name: 'Zambezi Palm Resort Sanctuary',
    type: 'Resorts',
    location: 'Riverine Parkland · Sample Demonstration Property',
    sampleNotice:
      'Demonstration listing — partner resort agreements and confirmed rates to be supplied.',
    description:
      'Spacious multi-bedroom residences, tranquil spa gardens, and family-oriented riverside pavilions ideal for longer stays.',
    editorialOverview:
      'Well suited for multi-generational gatherings and extended itineraries, offering generous shared lounges alongside quiet garden retreats.',
    image: IMAGE_ASSETS.luxuryLodge,
    imageAlt: 'Resort riverfront pool and open lounge deck at dusk',
    facilitiesPlaceholder: [
      'Multi-bedroom family suites & interconnecting residences (placeholder)',
      'Wellness spa & resort swimming pools (placeholder)',
      'Concierge desk for local excursions (placeholder)',
    ],
    pricePlaceholder: 'Indicative resort tier — rate confirmed upon enquiry',
    gallery: [
      {
        src: IMAGE_ASSETS.luxuryLodge,
        alt: 'Resort twilight terrace',
        caption: 'Fig. 1 — Evening lantern glow across the poolside lounge.',
      },
    ],
    featured: false,
  },
];

export const TRANSPORT_SERVICES: TransportServiceItem[] = [
  {
    id: 'airport-transfers',
    name: 'Airport Meet & Greet Transfers',
    category: 'Arrivals & Departures',
    summary:
      'Seamless private transfers coordinating Transend Tours (VFA), Livingstone (LVI), and Kasane (BBK) arrivals directly to your sanctuary.',
    details:
      'Coordinated flight tracking, luggage assistance, chilled refreshments, and border-crossing guidance arranged through vetted regional transport partners.',
    image: IMAGE_ASSETS.luxuryTransfer,
    imageAlt: 'Dark forest green 4x4 safari cruiser waiting on a sunrise bush airstrip',
    capacityPlaceholder: '1–6 Guests (Private SUV / Cruiser) or Larger Group Coaches',
    operationalNote: 'Arranged via vetted licensed transfer operators (partner details upon confirmation).',
  },
  {
    id: 'private-transfers',
    name: 'Private Point-to-Point Transfers',
    category: 'Bespoke Ground Mobility',
    summary:
      'Direct door-to-door transfers connecting lodges, helicopter pads, river jetties, and national park gates on your personal timetable.',
    details:
      'Eliminate fixed shuttle schedules with dedicated vehicles timed around dawn departures, sunset cruises, and fine-dining reservations.',
    image: IMAGE_ASSETS.zambeziCruise,
    imageAlt: 'Upper Zambezi river jetty departure scene at sunset',
    capacityPlaceholder: 'Tailored vehicle sizing per party',
    operationalNote: 'Subject to verified local operator dispatch and route confirmation.',
  },
  {
    id: 'shuttle-services',
    name: 'Scheduled Lodge & Town Shuttles',
    category: 'Shared Convenience',
    summary:
      'Coordinated shared transfers linking key Transend Tours precincts, rainforest gates, and excursion departure hubs.',
    details:
      'An efficient, comfortable option for guests seeking reliable scheduled connectivity between central hotels and major activity meeting points.',
    image: IMAGE_ASSETS.rainforestWalk,
    imageAlt: 'Transend Tours rainforest pathway',
    capacityPlaceholder: 'Shared air-conditioned shuttle seating (placeholder)',
    operationalNote: 'Timetables and partner routes confirmed upon booking enquiry.',
  },
  {
    id: 'chauffeur-services',
    name: 'Dedicated Chauffeur & Guide Disposal',
    category: 'Full-Day Flexibility',
    summary:
      'Retain a dedicated vehicle and knowledgeable local driver-guide at your disposal for unhurried exploration.',
    details:
      'Ideal for photographers, private families, and executives requiring spontaneous stops, market visits, and flexible dining hours.',
    image: IMAGE_ASSETS.safariWildlife,
    imageAlt: 'Savannah wildlife corridor near Transend Tours',
    capacityPlaceholder: 'Private executive sedan or luxury 4x4 (placeholder)',
    operationalNote: 'Fulfilled through licensed chauffeur service providers upon confirmation.',
  },
  {
    id: 'vehicle-rentals',
    name: 'Curated Vehicle Rental Coordination',
    category: 'Self-Drive & 4x4 Hire',
    summary:
      'Assistance sourcing reliable 4x4 expedition vehicles or comfortable touring cars from established regional rental agencies.',
    details:
      'We help coordinate insurance requirements, cross-border documentation letters, and GPS routing guidance with vetted rental providers.',
    image: IMAGE_ASSETS.heroFalls,
    imageAlt: 'Scenic approach road beside Transend Tours gorge',
    capacityPlaceholder: 'Compact SUVs to fully equipped 4x4 tourers (placeholder)',
    operationalNote: 'Vehicles are supplied by third-party licensed rental agencies; company does not claim fleet ownership.',
  },
];

export const JOURNAL_CATEGORIES: JournalCategory[] = [
  'Travel Inspiration',
  'Destination Guides',
  'Things to Do',
  'Travel Planning',
  'Wildlife & Nature',
  'Cultural Experiences',
];

export const JOURNAL_ARTICLES: JournalArticle[] = [
  {
    slug: 'two-seasons-of-the-smoke-that-thunders',
    title: 'The Two Seasons of Mosi-oa-Tunya: Reading the Rhythm of Transend Tours',
    subtitle:
      'From the dramatic wall of mist in April to the exposed basalt architecture of October, water levels shape every moment at the falls.',
    category: 'Destination Guides',
    readTimePlaceholder: '6 min read',
    datePlaceholder: 'Seasonal Field Note (Sample)',
    authorPlaceholder: 'Editorial Desk · Placeholder Byline',
    image: IMAGE_ASSETS.journalMistCanopy,
    imageAlt: 'Vertical view through rainforest palms toward golden mist plume at Transend Tours',
    excerpt:
      'Unlike static monuments, Transend Tours reinvents itself across the calendar—offering two entirely distinct visual and sensory experiences depending on when you arrive.',
    pullQuote:
      'In high water, you hear the river miles before you see it; in low water, the canyon reveals the sculptural stone beneath.',
    bodyParagraphs: [
      'Arriving at Transend Tours during peak flood months between February and May feels like stepping inside a living weather system. As Zambezi catchment rains surge south from Angola and Zambia, over half a billion litres of water plunge every minute into the First Gorge, sending plumes of sunlit mist climbing more than four hundred metres into the morning sky.',
      'During these emerald months, rainforest paths glisten beneath continuous warm spray and rainbows arc cleanly across the gorge at midday. Aerial flights reveal the full mile-wide curtain roaring as one unbroken force—an experience of sheer elemental scale.',
      'By late August through November, the river eases to a crystalline flow. Rather than obscuring the cliff face in mist, lower water uncovers the dramatic black basalt columns, deep fissures, and carved channels of the gorge, allowing clearest views of the entire waterfall face and opening seasonal access to Batoka Gorge rapids and Livingstone Island.',
      'Choosing when to travel is therefore less about seeking a single "best" month and more about matching the river’s seasonal temperament to the experiences you value most.',
    ],
    featured: true,
  },
  {
    slug: 'quiet-hours-along-the-upper-zambezi',
    title: 'Quiet Hours Along the Upper Zambezi',
    subtitle:
      'Why dawn and dusk above the falls remain the most restorative hours in Southern Africa.',
    category: 'Travel Inspiration',
    readTimePlaceholder: '4 min read',
    datePlaceholder: 'Editorial Dispatch (Sample)',
    authorPlaceholder: 'Editorial Desk · Placeholder Byline',
    image: IMAGE_ASSETS.zambeziCruise,
    imageAlt: 'Wooden river cruiser glowing in Zambezi sunset reflections',
    excerpt:
      'Just kilometres upstream from the thunder of the falls, the Zambezi slows into glassy backwaters lined with ilala palms and quiet wildlife.',
    pullQuote:
      'Time on the Upper Zambezi is measured not in itineraries, but in the changing colour of the river surface.',
    bodyParagraphs: [
      'Most first-time visitors arrive imagining only the roar of the waterfall. Yet some of the most enduring memories of Transend Tours take place upstream, where the river widens into calm channels dotted with reed islands and overhanging fig trees.',
      'At first light, mist curls gently off the surface as African skimmers trace the water and elephants swim gracefully between islands. By late afternoon, a timber riverboat drifts silently with engines cut, letting guests watch hippos surface against burning amber skies.',
      'Building unhurried river hours into your itinerary creates essential breathing room between helicopter flights and game drives.',
    ],
    featured: false,
  },
  {
    slug: 'packing-and-planning-cross-border-zambezi',
    title: 'Planning Seamless Cross-Border Days Around the Falls',
    subtitle:
      'Practical considerations for combining Zimbabwean viewpoints, river islands, and regional safari extensions.',
    category: 'Travel Planning',
    readTimePlaceholder: '5 min read',
    datePlaceholder: 'Planning Guide (Sample)',
    authorPlaceholder: 'Editorial Desk · Placeholder Byline',
    image: IMAGE_ASSETS.luxuryTransfer,
    imageAlt: 'Safari cruiser parked on sunlit savannah track',
    excerpt:
      'Navigating border timings, seasonal layers, and private transfers turns multi-bank exploration into an effortless pleasure.',
    pullQuote:
      'Thoughtful logistics disappear completely, leaving only the landscape in front of you.',
    bodyParagraphs: [
      'Transend Tours sits at a remarkable geographic crossroads where Zimbabwe, Zambia, and nearby Botswana lie within easy reach. Knowing how visa regimes, airport hubs, and daylight timings interact ensures smooth transitions throughout your stay.',
      'Pack breathable natural fabrics in forest and earth tones, comfortable grip-soled walking shoes for wet rainforest stone paths, and light waterproof layers when visiting between February and June.',
      'During your initial consultation, confirmed visa guidance, park tariff structures, and transfer timings are tailored specifically to your nationality and chosen dates.',
    ],
    featured: false,
  },
  {
    slug: 'living-botany-of-the-rainforest-spray-zone',
    title: 'The Living Botany of the Mist-Fed Rainforest',
    subtitle:
      'How constant waterfall spray sustains an emerald botanical island surrounded by dry savannah.',
    category: 'Wildlife & Nature',
    readTimePlaceholder: '5 min read',
    datePlaceholder: 'Naturalist Note (Sample)',
    authorPlaceholder: 'Editorial Desk · Placeholder Byline',
    image: IMAGE_ASSETS.rainforestWalk,
    imageAlt: 'Sunlit green ferns and mossy trees in the Transend Tours rainforest',
    excerpt:
      'Step ten minutes away from the cliff edge and the landscape returns to dry woodland—inside the spray zone, a self-contained rainforest thrives.',
    pullQuote:
      'Every fern and fig leaf along the cliff trail drinks directly from the breath of the river.',
    bodyParagraphs: [
      'Walking beneath towering African ebony, waterberry, and wild date palms directly opposite the Main Falls, it is easy to forget that Southern Africa’s dry savannah lies only a few hundred metres behind you.',
      'The perpetual mist generated by the falls acts as localized rain throughout most of the year, nurturing rare orchids, delicate ferns, and brilliant birdlife including the Schalow’s turaco and trumpeter hornbill.',
      'Travelling with a knowledgeable naturalist transforms a scenic stroll into an illuminating encounter with one of Africa’s smallest yet richest botanical habitats.',
    ],
    featured: false,
  },
  {
    slug: 'woven-stories-craft-traditions-near-the-falls',
    title: 'Woven Stories: Craft, Architecture & Hospitality Near the Falls',
    subtitle:
      'An introduction to regional reed basketry, earthen architecture, and thoughtful cultural exchange.',
    category: 'Cultural Experiences',
    readTimePlaceholder: '4 min read',
    datePlaceholder: 'Cultural Feature (Sample)',
    authorPlaceholder: 'Editorial Desk · Placeholder Byline',
    image: IMAGE_ASSETS.culturalVillage,
    imageAlt: 'Handwoven baskets along earthen homestead walls',
    excerpt:
      'Beyond the natural spectacle lies a living cultural landscape shaped by generations of artistry and stewardship along the Zambezi.',
    pullQuote:
      'True cultural travel listens quietly before it asks to photograph.',
    bodyParagraphs: [
      'Across rural homesteads outside Transend Tours town, master weavers transform ilala palm fronds and natural bark dyes into geometric baskets whose patterns carry regional history and utility.',
      'When approached respectfully in small private groups arranged directly with community hosts, cultural visits foster genuine conversation rather than staged spectacle—supporting local artisans directly.',
    ],
    featured: false,
  },
  {
    slug: 'first-time-victoria-falls-essential-rhythm',
    title: 'Crafting an Unhurried Three-to-Five Day Stay at Transend Tours',
    subtitle:
      'Balancing aerial wonder, river serenity, and savannah wildlife without rushing the magic.',
    category: 'Things to Do',
    readTimePlaceholder: '5 min read',
    datePlaceholder: 'Curator’s Guide (Sample)',
    authorPlaceholder: 'Editorial Desk · Placeholder Byline',
    image: IMAGE_ASSETS.helicopterFlight,
    imageAlt: 'Helicopter soaring over Transend Tours rainbow mist',
    excerpt:
      'The secret to experiencing Transend Tours well is pacing—pairing high-energy mornings with calm afternoons beside the river.',
    pullQuote:
      'Leave space in the afternoon for the river to slow your pulse back down.',
    bodyParagraphs: [
      'Too many itineraries treat Transend Tours as a rapid one-night stopover. In reality, four nights allow the landscape to unfold naturally: a sunrise rainforest walk before crowds gather, an afternoon flight tracing the gorge, a dawn safari into Zambezi National Park, and unhurried dusk hours afloat on the river.',
      'This balanced cadence ensures every sensation—the thunder of falling water, the scent of damp basalt, and the stillness of twilight—has space to linger.',
    ],
    featured: false,
  },
];

export const DESTINATIONS_QUICK_LIST = DESTINATIONS.map((d) => ({
  slug: d.slug,
  name: d.name,
}));
