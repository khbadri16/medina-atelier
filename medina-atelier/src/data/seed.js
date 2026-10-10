// Demo catalogue for Medina Atelier, a fictional store.
// Product images are drawn as SVG at runtime (see ui/art.js): `art.type`
// picks the illustration and `art.palette` its colours.

export const CATEGORIES = [
  { id: 'ceramics', name: 'Ceramics', blurb: 'Hand-thrown and hand-painted', art: { type: 'vase', palette: 'terracotta' } },
  { id: 'textiles', name: 'Textiles', blurb: 'Woven on wooden looms', art: { type: 'rug', palette: 'wool' } },
  { id: 'copper', name: 'Copper & brass', blurb: 'Engraved by hand', art: { type: 'tray', palette: 'copper' } },
  { id: 'wood', name: 'Olive wood', blurb: 'Carved from fallen branches', art: { type: 'board', palette: 'wood' } },
  { id: 'leather', name: 'Leather', blurb: 'Vegetable-tanned', art: { type: 'bag', palette: 'leather' } },
  { id: 'bath', name: 'Home & bath', blurb: 'Olive oil and beeswax', art: { type: 'soap', palette: 'soap' } },
];

const P = (o) => ({ active: true, compareAt: null, variants: null, badge: null, featured: false, ...o });

export const PRODUCTS = [
  P({
    id: 'p01', slug: 'kabyle-painted-vase', name: 'Kabyle Painted Vase', category: 'ceramics',
    price: 6800, stock: 7, rating: 4.8, reviews: 64, featured: true, badge: 'Bestseller',
    material: 'Red clay, natural pigments', origin: 'Kabylie', dimensions: 'H 32 cm · Ø 20 cm',
    care: 'Decorative; wipe with a dry cloth.',
    description: 'Shaped by hand and painted with geometric motifs passed down through generations of potters. Each vase is fired in a wood kiln, so no two are exactly alike.',
    art: { type: 'vase', palette: 'terracotta' }, createdAt: '2026-03-02',
  }),
  P({
    id: 'p02', slug: 'terracotta-tajine', name: 'Terracotta Tajine', category: 'ceramics',
    price: 4200, stock: 12, rating: 4.6, reviews: 41,
    material: 'Unglazed terracotta', origin: 'Annaba', dimensions: 'Ø 30 cm',
    care: 'Soak before first use. Use on low heat with a diffuser.',
    description: 'A traditional cooking tajine whose conical lid returns steam to the dish, keeping slow-cooked stews tender.',
    art: { type: 'tajine', palette: 'terracotta' }, createdAt: '2026-01-18',
  }),
  P({
    id: 'p03', slug: 'glazed-serving-bowl', name: 'Glazed Serving Bowl', category: 'ceramics',
    price: 3500, stock: 18, rating: 4.7, reviews: 29, featured: true,
    material: 'Stoneware, lead-free glaze', origin: 'Tlemcen', dimensions: 'Ø 24 cm · H 10 cm',
    care: 'Dishwasher safe.',
    description: 'A deep, generous bowl for couscous or salads, dipped by hand in a glossy glaze.',
    variants: {
      label: 'Glaze',
      options: [
        { key: 'cobalt', name: 'Cobalt', palette: 'cobalt', priceDelta: 0 },
        { key: 'olive', name: 'Olive', palette: 'olive', priceDelta: 0 },
        { key: 'sand', name: 'Sand', palette: 'sand', priceDelta: 0 },
      ],
    },
    art: { type: 'bowl', palette: 'cobalt' }, createdAt: '2026-04-11',
  }),
  P({
    id: 'p04', slug: 'hand-painted-plate-set', name: 'Hand-painted Plate Set (×4)', category: 'ceramics',
    price: 7900, compareAt: 9400, stock: 5, rating: 4.9, reviews: 22, badge: 'Sale',
    material: 'Glazed earthenware', origin: 'Tlemcen', dimensions: 'Ø 26 cm each',
    care: 'Hand wash recommended.',
    description: 'Four dinner plates painted with an eight-point star, a motif found on tiles and doors across the Maghreb.',
    art: { type: 'plate', palette: 'cobalt' }, createdAt: '2026-02-08',
  }),
  P({
    id: 'p05', slug: 'berber-wool-rug', name: 'Berber Wool Rug', category: 'textiles',
    price: 38000, stock: 3, rating: 5, reviews: 17, featured: true, badge: 'Handwoven',
    material: '100% sheep wool', origin: 'Aurès', dimensions: 'See size options',
    care: 'Vacuum gently; professional cleaning only.',
    description: 'A thick, hand-knotted rug in undyed wool with a hand-drawn diamond lattice. Weaving one takes several weeks.',
    variants: {
      label: 'Size',
      options: [
        { key: 's', name: '120 × 180 cm', palette: 'wool', priceDelta: 0 },
        { key: 'm', name: '160 × 230 cm', palette: 'wool', priceDelta: 16000 },
      ],
    },
    art: { type: 'rug', palette: 'wool' }, createdAt: '2026-05-20',
  }),
  P({
    id: 'p06', slug: 'kilim-cushion-cover', name: 'Kilim Cushion Cover', category: 'textiles',
    price: 2900, stock: 25, rating: 4.5, reviews: 38,
    material: 'Wool and cotton', origin: 'Ghardaïa', dimensions: '45 × 45 cm',
    care: 'Dry clean or cold hand wash.',
    description: 'Flat-woven on a vertical loom in the M’zab valley. The insert is not included.',
    variants: {
      label: 'Colour',
      options: [
        { key: 'madder', name: 'Madder red', palette: 'madder', priceDelta: 0 },
        { key: 'indigo', name: 'Indigo', palette: 'indigo', priceDelta: 0 },
      ],
    },
    art: { type: 'cushion', palette: 'madder' }, createdAt: '2026-06-01',
  }),
  P({
    id: 'p07', slug: 'cotton-fouta-towel', name: 'Cotton Fouta Towel', category: 'textiles',
    price: 1800, stock: 40, rating: 4.4, reviews: 72, badge: 'New',
    material: 'Organic cotton', origin: 'Tlemcen', dimensions: '100 × 180 cm',
    care: 'Machine wash at 30 °C.',
    description: 'Light, quick-drying and soft after every wash. Use it at the hammam, on the beach or as a throw.',
    variants: {
      label: 'Colour',
      options: [
        { key: 'saffron', name: 'Saffron', palette: 'saffron', priceDelta: 0 },
        { key: 'indigo', name: 'Indigo', palette: 'indigo', priceDelta: 0 },
        { key: 'sage', name: 'Sage', palette: 'sage', priceDelta: 0 },
      ],
    },
    art: { type: 'fouta', palette: 'saffron' }, createdAt: '2026-08-14',
  }),
  P({
    id: 'p08', slug: 'engraved-copper-tray', name: 'Engraved Copper Tray', category: 'copper',
    price: 12500, stock: 6, rating: 4.9, reviews: 31, featured: true,
    material: 'Hammered copper', origin: 'Constantine', dimensions: 'Ø 45 cm',
    care: 'Polish with lemon and salt to restore the shine.',
    description: 'A round tea tray chased by hand with a central rosette, a centrepiece of Constantine’s long tradition of copperwork.',
    art: { type: 'tray', palette: 'copper' }, createdAt: '2026-03-28',
  }),
  P({
    id: 'p09', slug: 'brass-lantern', name: 'Pierced Brass Lantern', category: 'copper',
    price: 9800, stock: 9, rating: 4.7, reviews: 26,
    material: 'Brass, glass', origin: 'Constantine', dimensions: 'H 38 cm',
    care: 'Use with a tea light or LED candle.',
    description: 'Arched panels throw patterns of light across the room. Hang it or stand it on a table.',
    art: { type: 'lantern', palette: 'brass' }, createdAt: '2026-07-03',
  }),
  P({
    id: 'p10', slug: 'copper-coffee-pot', name: 'Copper Coffee Pot', category: 'copper',
    price: 5600, stock: 0, rating: 4.6, reviews: 19,
    material: 'Copper, tin-lined', origin: 'Constantine', dimensions: '0.6 L',
    care: 'Hand wash; dry immediately.',
    description: 'A long-handled pot for strong, sweet coffee, lined with tin for safe use on the stove.',
    art: { type: 'pot', palette: 'copper' }, createdAt: '2026-02-21',
  }),
  P({
    id: 'p11', slug: 'olive-wood-serving-board', name: 'Olive Wood Serving Board', category: 'wood',
    price: 3200, stock: 22, rating: 4.8, reviews: 54, featured: true,
    material: 'Olive wood', origin: 'Béjaïa', dimensions: '40 × 18 cm',
    care: 'Hand wash; oil occasionally with olive oil.',
    description: 'Cut from a single piece of olive wood, so its grain is unique. Made for bread, cheese and mezze.',
    art: { type: 'board', palette: 'wood' }, createdAt: '2026-04-30',
  }),
  P({
    id: 'p12', slug: 'olive-wood-spoon-set', name: 'Olive Wood Spoon Set', category: 'wood',
    price: 1900, stock: 30, rating: 4.5, reviews: 47,
    material: 'Olive wood', origin: 'Béjaïa', dimensions: 'Set of 3 · 20–30 cm',
    care: 'Hand wash only.',
    description: 'Three carved spoons for stirring, serving and tasting. Hard-wearing and kind to non-stick pans.',
    art: { type: 'spoons', palette: 'wood' }, createdAt: '2026-01-09',
  }),
  P({
    id: 'p13', slug: 'leather-pouf', name: 'Embroidered Leather Pouf', category: 'leather',
    price: 14500, stock: 4, rating: 4.8, reviews: 23,
    material: 'Goat leather, cotton thread', origin: 'Tlemcen', dimensions: 'Ø 50 cm · H 30 cm',
    care: 'Wipe with a damp cloth; condition yearly.',
    description: 'Hand-stitched panels with chain-stitch embroidery. It’s shipped unstuffed; fill it with old textiles.',
    art: { type: 'pouf', palette: 'leather' }, createdAt: '2026-05-05',
  }),
  P({
    id: 'p14', slug: 'leather-satchel', name: 'Leather Satchel', category: 'leather',
    price: 11900, stock: 8, rating: 4.6, reviews: 36, badge: 'New',
    material: 'Vegetable-tanned cowhide', origin: 'Tlemcen', dimensions: '32 × 24 × 9 cm',
    care: 'Develops a patina with use.',
    description: 'A structured satchel with a brass buckle and an adjustable strap, roomy enough for a 13" laptop.',
    art: { type: 'bag', palette: 'leather' }, createdAt: '2026-09-02',
  }),
  P({
    id: 'p15', slug: 'olive-oil-soap-trio', name: 'Olive Oil Soap Trio', category: 'bath',
    price: 1500, stock: 60, rating: 4.7, reviews: 88,
    material: 'Olive oil, laurel, clay', origin: 'Kabylie', dimensions: '3 × 120 g',
    care: 'Keep dry between uses.',
    description: 'Cold-process soaps cured for six weeks: plain olive, laurel, and rhassoul clay.',
    art: { type: 'soap', palette: 'soap' }, createdAt: '2026-06-22',
  }),
  P({
    id: 'p16', slug: 'beeswax-pillar-candle', name: 'Beeswax Pillar Candle', category: 'bath',
    price: 1200, stock: 2, rating: 4.4, reviews: 15,
    material: 'Pure beeswax, cotton wick', origin: 'Annaba', dimensions: 'H 15 cm',
    care: 'Trim the wick to 5 mm before lighting.',
    description: 'Poured by hand from local beeswax. It burns slowly, with a faint scent of honey.',
    art: { type: 'candle', palette: 'wax' }, createdAt: '2026-07-19',
  }),
];

/** A few past orders so the admin dashboard has data on first visit. */
export function sampleOrders(now = new Date()) {
  const day = 24 * 60 * 60 * 1000;
  const rows = [
    { daysAgo: 9, name: 'Amina Benali', wilaya: 16, commune: 'Hydra', method: 'home', status: 'delivered', items: [['p01', null, 1], ['p15', null, 2]] },
    { daysAgo: 7, name: 'Yacine Kaci', wilaya: 31, commune: 'Bir El Djir', method: 'desk', status: 'delivered', items: [['p11', null, 1], ['p12', null, 1]] },
    { daysAgo: 6, name: 'Sara Meziane', wilaya: 25, commune: 'El Khroub', method: 'home', status: 'shipped', items: [['p08', null, 1]] },
    { daysAgo: 4, name: 'Karim Haddad', wilaya: 23, commune: 'El Bouni', method: 'home', status: 'confirmed', items: [['p05', 's', 1]] },
    { daysAgo: 3, name: 'Lina Cherif', wilaya: 6, commune: 'Akbou', method: 'desk', status: 'cancelled', items: [['p07', 'indigo', 2]] },
    { daysAgo: 2, name: 'Mehdi Bouzid', wilaya: 19, commune: 'El Eulma', method: 'home', status: 'pending', items: [['p03', 'olive', 2], ['p06', 'madder', 1]] },
    { daysAgo: 1, name: 'Nour Saadi', wilaya: 47, commune: 'Metlili', method: 'desk', status: 'pending', items: [['p14', null, 1]] },
  ];
  return rows.map((r, i) => ({ ...r, number: i + 1, createdAt: new Date(now.getTime() - r.daysAgo * day - i * 3600e3).toISOString() }));
}
