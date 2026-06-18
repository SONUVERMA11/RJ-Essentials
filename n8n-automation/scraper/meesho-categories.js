/**
 * Meesho Category Definitions
 * Maps RJ Essentials store categories to their Meesho equivalents
 * with proper URLs for scraping trending/top-selling products.
 */

const MEESHO_CATEGORIES = [
  {
    name: 'Sarees',
    slug: 'sarees',
    meeshoUrl: 'https://www.meesho.com/sarees/pl/80',
    meeshoSearchQuery: 'trending sarees',
    rjCategory: 'Sarees',
    keywords: ['saree', 'silk saree', 'cotton saree', 'georgette saree', 'chiffon saree'],
  },
  {
    name: 'Kurtis & Kurta Sets',
    slug: 'kurtis-kurta-sets',
    meeshoUrl: 'https://www.meesho.com/kurtis/pl/qvt',
    meeshoSearchQuery: 'trending kurtis',
    rjCategory: 'Kurtis & Kurta Sets',
    keywords: ['kurti', 'kurta set', 'anarkali', 'rayon kurti', 'cotton kurti'],
  },
  {
    name: 'Jewellery',
    slug: 'jewellery',
    meeshoUrl: 'https://www.meesho.com/jewellery/pl/m52',
    meeshoSearchQuery: 'trending jewellery women',
    rjCategory: 'Jewellery',
    keywords: ['necklace', 'earrings', 'bracelet', 'bangles', 'mangalsutra'],
  },
  {
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    meeshoUrl: 'https://www.meesho.com/home-kitchen/pl/e2j',
    meeshoSearchQuery: 'trending home kitchen items',
    rjCategory: 'Home & Kitchen',
    keywords: ['bedsheet', 'curtains', 'kitchen storage', 'home decor', 'organizer'],
  },
  {
    name: 'Beauty & Health',
    slug: 'beauty-health',
    meeshoUrl: 'https://www.meesho.com/beauty-health/pl/z4d',
    meeshoSearchQuery: 'trending beauty products',
    rjCategory: 'Beauty & Health',
    keywords: ['skincare', 'hair care', 'makeup', 'lipstick', 'face cream'],
  },
  {
    name: 'Men Clothing',
    slug: 'men-clothing',
    meeshoUrl: 'https://www.meesho.com/men-tshirts/pl/388',
    meeshoSearchQuery: 'trending men t-shirts',
    rjCategory: 'Men Clothing',
    keywords: ['t-shirt', 'shirt', 'jeans', 'track pants', 'kurta men'],
  },
  {
    name: 'Bags & Footwear',
    slug: 'bags-footwear',
    meeshoUrl: 'https://www.meesho.com/bags/pl/a6w',
    meeshoSearchQuery: 'trending bags women',
    rjCategory: 'Bags & Footwear',
    keywords: ['handbag', 'sling bag', 'backpack', 'sandals', 'heels'],
  },
  {
    name: 'Electronics',
    slug: 'electronics',
    meeshoUrl: 'https://www.meesho.com/electronics/pl/kxv',
    meeshoSearchQuery: 'trending electronic gadgets',
    rjCategory: 'Electronics',
    keywords: ['earbuds', 'charger', 'mobile cover', 'speaker', 'smartwatch'],
  },
  {
    name: 'Kids & Toys',
    slug: 'kids-toys',
    meeshoUrl: 'https://www.meesho.com/kids/pl/oph',
    meeshoSearchQuery: 'trending kids toys clothing',
    rjCategory: 'Kids & Toys',
    keywords: ['kids dress', 'toys', 'baby clothing', 'educational toys'],
  },
  {
    name: 'Watches',
    slug: 'watches',
    meeshoUrl: 'https://www.meesho.com/watches/pl/rpr',
    meeshoSearchQuery: 'trending watches men women',
    rjCategory: 'Watches',
    keywords: ['analog watch', 'digital watch', 'smartwatch', 'couple watch'],
  },
];

module.exports = { MEESHO_CATEGORIES };
