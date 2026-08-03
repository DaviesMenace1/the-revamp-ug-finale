/**
 * Complete product category taxonomy for The Revamp UG
 * Supports filtering, navigation, and management of all product types
 */

export interface CategoryItem {
  id: string
  label: string
  value: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string
  icon?: string
  subcategories: CategoryItem[]
}

export const PRODUCT_CATEGORIES: Category[] = [
  {
    id: 'living-room',
    name: 'Living Room',
    slug: 'living-room',
    description: 'Sofas, chairs, tables, and decorative pieces for your living space',
    subcategories: [
      { id: 'sofas', label: 'Sofas', value: 'sofas' },
      { id: 'sectional-sofas', label: 'Sectional Sofas', value: 'sectional-sofas' },
      { id: 'modular-sofas', label: 'Modular Sofas', value: 'modular-sofas' },
      { id: 'loveseats', label: 'Loveseats', value: 'loveseats' },
      { id: 'lounge-chairs', label: 'Lounge Chairs', value: 'lounge-chairs' },
      { id: 'accent-chairs', label: 'Accent Chairs', value: 'accent-chairs' },
      { id: 'recliners', label: 'Recliners', value: 'recliners' },
      { id: 'coffee-tables', label: 'Coffee Tables', value: 'coffee-tables' },
      { id: 'side-tables', label: 'Side Tables', value: 'side-tables' },
      { id: 'console-tables', label: 'Console Tables', value: 'console-tables' },
      { id: 'tv-units', label: 'TV Units', value: 'tv-units' },
      { id: 'media-consoles', label: 'Media Consoles', value: 'media-consoles' },
      { id: 'bookshelves', label: 'Bookshelves', value: 'bookshelves' },
      { id: 'display-cabinets', label: 'Display Cabinets', value: 'display-cabinets' },
      { id: 'ottomans', label: 'Ottomans', value: 'ottomans' },
      { id: 'benches', label: 'Benches', value: 'benches' },
      { id: 'rugs', label: 'Rugs', value: 'rugs' },
      { id: 'mirrors', label: 'Mirrors', value: 'mirrors' },
      { id: 'decorative-objects', label: 'Decorative Objects', value: 'decorative-objects' },
      { id: 'wall-art', label: 'Wall Art', value: 'wall-art' },
      { id: 'throws-cushions', label: 'Throws & Cushions', value: 'throws-cushions' },
    ],
  },
  {
    id: 'dining',
    name: 'Dining',
    slug: 'dining',
    description: 'Dining tables, chairs, and accessories for entertaining',
    subcategories: [
      { id: 'dining-tables', label: 'Dining Tables', value: 'dining-tables' },
      { id: 'dining-chairs', label: 'Dining Chairs', value: 'dining-chairs' },
      { id: 'bar-stools', label: 'Bar Stools', value: 'bar-stools' },
      { id: 'sideboards', label: 'Sideboards', value: 'sideboards' },
      { id: 'buffets', label: 'Buffets', value: 'buffets' },
      { id: 'china-cabinets', label: 'China Cabinets', value: 'china-cabinets' },
      { id: 'wine-cabinets', label: 'Wine Cabinets', value: 'wine-cabinets' },
      { id: 'dining-benches', label: 'Dining Benches', value: 'dining-benches' },
      { id: 'serving-trolleys', label: 'Serving Trolleys', value: 'serving-trolleys' },
    ],
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    slug: 'bedroom',
    description: 'Beds, storage, and furniture for a restful bedroom',
    subcategories: [
      { id: 'beds', label: 'Beds', value: 'beds' },
      { id: 'bed-frames', label: 'Bed Frames', value: 'bed-frames' },
      { id: 'headboards', label: 'Headboards', value: 'headboards' },
      { id: 'nightstands', label: 'Nightstands', value: 'nightstands' },
      { id: 'dressers', label: 'Dressers', value: 'dressers' },
      { id: 'wardrobes', label: 'Wardrobes', value: 'wardrobes' },
      { id: 'walk-in-closet-systems', label: 'Walk-in Closet Systems', value: 'walk-in-closet-systems' },
      { id: 'vanity-tables', label: 'Vanity Tables', value: 'vanity-tables' },
      { id: 'bedroom-benches', label: 'Bedroom Benches', value: 'bedroom-benches' },
      { id: 'bedroom-chairs', label: 'Bedroom Chairs', value: 'bedroom-chairs' },
      { id: 'mattresses', label: 'Mattresses', value: 'mattresses' },
      { id: 'bedding', label: 'Bedding', value: 'bedding' },
      { id: 'decorative-cushions', label: 'Decorative Cushions', value: 'decorative-cushions' },
    ],
  },
  {
    id: 'office',
    name: 'Office',
    slug: 'office',
    description: 'Professional furniture for home and commercial offices',
    subcategories: [
      { id: 'executive-desks', label: 'Executive Desks', value: 'executive-desks' },
      { id: 'writing-desks', label: 'Writing Desks', value: 'writing-desks' },
      { id: 'office-chairs', label: 'Office Chairs', value: 'office-chairs' },
      { id: 'office-bookshelves', label: 'Bookshelves', value: 'office-bookshelves' },
      { id: 'filing-cabinets', label: 'Filing Cabinets', value: 'filing-cabinets' },
      { id: 'credenzas', label: 'Credenzas', value: 'credenzas' },
      { id: 'meeting-tables', label: 'Meeting Tables', value: 'meeting-tables' },
      { id: 'reception-furniture', label: 'Reception Furniture', value: 'reception-furniture' },
      { id: 'desk-accessories', label: 'Desk Accessories', value: 'desk-accessories' },
    ],
  },
  {
    id: 'outdoor',
    name: 'Outdoor',
    slug: 'outdoor',
    description: 'Patio and garden furniture for outdoor living',
    subcategories: [
      { id: 'outdoor-sofas', label: 'Outdoor Sofas', value: 'outdoor-sofas' },
      { id: 'outdoor-lounge-chairs', label: 'Outdoor Lounge Chairs', value: 'outdoor-lounge-chairs' },
      { id: 'outdoor-dining-sets', label: 'Outdoor Dining Sets', value: 'outdoor-dining-sets' },
      { id: 'outdoor-tables', label: 'Outdoor Tables', value: 'outdoor-tables' },
      { id: 'sun-loungers', label: 'Sun Loungers', value: 'sun-loungers' },
      { id: 'daybeds', label: 'Daybeds', value: 'daybeds' },
      { id: 'hanging-chairs', label: 'Hanging Chairs', value: 'hanging-chairs' },
      { id: 'outdoor-benches', label: 'Outdoor Benches', value: 'outdoor-benches' },
      { id: 'patio-umbrellas', label: 'Patio Umbrellas', value: 'patio-umbrellas' },
      { id: 'fire-pits', label: 'Fire Pits', value: 'fire-pits' },
      { id: 'outdoor-rugs', label: 'Outdoor Rugs', value: 'outdoor-rugs' },
      { id: 'planters', label: 'Planters', value: 'planters' },
    ],
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    slug: 'kitchen',
    description: 'Kitchen cabinetry and islands for modern kitchens',
    subcategories: [
      { id: 'kitchen-cabinets', label: 'Kitchen Cabinets', value: 'kitchen-cabinets' },
      { id: 'kitchen-islands', label: 'Kitchen Islands', value: 'kitchen-islands' },
      { id: 'pantry-systems', label: 'Pantry Systems', value: 'pantry-systems' },
      { id: 'counter-stools', label: 'Counter Stools', value: 'counter-stools' },
      { id: 'kitchen-storage', label: 'Kitchen Storage', value: 'kitchen-storage' },
      { id: 'sinks', label: 'Sinks', value: 'sinks' },
      { id: 'faucets', label: 'Faucets', value: 'faucets' },
      { id: 'countertops', label: 'Countertops', value: 'countertops' },
    ],
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    slug: 'bathroom',
    description: 'Vanities, fixtures, and storage for bathrooms',
    subcategories: [
      { id: 'bathroom-vanities', label: 'Bathroom Vanities', value: 'bathroom-vanities' },
      { id: 'bathroom-mirrors', label: 'Mirrors', value: 'bathroom-mirrors' },
      { id: 'basins', label: 'Basins', value: 'basins' },
      { id: 'bathroom-faucets', label: 'Faucets', value: 'bathroom-faucets' },
      { id: 'bathtubs', label: 'Bathtubs', value: 'bathtubs' },
      { id: 'shower-systems', label: 'Shower Systems', value: 'shower-systems' },
      { id: 'toilets', label: 'Toilets', value: 'toilets' },
      { id: 'bathroom-storage', label: 'Bathroom Storage', value: 'bathroom-storage' },
      { id: 'towel-accessories', label: 'Towel Accessories', value: 'towel-accessories' },
    ],
  },
  {
    id: 'lighting',
    name: 'Lighting',
    slug: 'lighting',
    description: 'Chandeliers, pendants, and decorative lighting solutions',
    subcategories: [
      { id: 'chandeliers', label: 'Chandeliers', value: 'chandeliers' },
      { id: 'pendant-lights', label: 'Pendant Lights', value: 'pendant-lights' },
      { id: 'ceiling-lights', label: 'Ceiling Lights', value: 'ceiling-lights' },
      { id: 'wall-sconces', label: 'Wall Sconces', value: 'wall-sconces' },
      { id: 'table-lamps', label: 'Table Lamps', value: 'table-lamps' },
      { id: 'floor-lamps', label: 'Floor Lamps', value: 'floor-lamps' },
      { id: 'outdoor-lighting', label: 'Outdoor Lighting', value: 'outdoor-lighting' },
      { id: 'smart-lighting', label: 'Smart Lighting', value: 'smart-lighting' },
    ],
  },
  {
    id: 'decor',
    name: 'Decor',
    slug: 'decor',
    description: 'Decorative accessories and finishing touches',
    subcategories: [
      { id: 'vases', label: 'Vases', value: 'vases' },
      { id: 'sculptures', label: 'Sculptures', value: 'sculptures' },
      { id: 'decorative-bowls', label: 'Decorative Bowls', value: 'decorative-bowls' },
      { id: 'candles', label: 'Candles', value: 'candles' },
      { id: 'candle-holders', label: 'Candle Holders', value: 'candle-holders' },
      { id: 'wall-clocks', label: 'Wall Clocks', value: 'wall-clocks' },
      { id: 'decor-mirrors', label: 'Mirrors', value: 'decor-mirrors' },
      { id: 'picture-frames', label: 'Picture Frames', value: 'picture-frames' },
      { id: 'artificial-plants', label: 'Artificial Plants', value: 'artificial-plants' },
      { id: 'indoor-plants', label: 'Indoor Plants', value: 'indoor-plants' },
      { id: 'decorative-trays', label: 'Decorative Trays', value: 'decorative-trays' },
    ],
  },
  {
    id: 'rugs-carpets',
    name: 'Rugs & Carpets',
    slug: 'rugs-carpets',
    description: 'Area rugs, runners, and custom carpet solutions',
    subcategories: [
      { id: 'area-rugs', label: 'Area Rugs', value: 'area-rugs' },
      { id: 'hallway-runners', label: 'Hallway Runners', value: 'hallway-runners' },
      { id: 'carpets-outdoor-rugs', label: 'Outdoor Rugs', value: 'carpets-outdoor-rugs' },
      { id: 'custom-rugs', label: 'Custom Rugs', value: 'custom-rugs' },
      { id: 'wall-to-wall-carpets', label: 'Wall-to-Wall Carpets', value: 'wall-to-wall-carpets' },
    ],
  },
  {
    id: 'window-treatments',
    name: 'Curtains & Window Treatments',
    slug: 'window-treatments',
    description: 'Curtains, blinds, and motorized window solutions',
    subcategories: [
      { id: 'curtains', label: 'Curtains', value: 'curtains' },
      { id: 'sheers', label: 'Sheers', value: 'sheers' },
      { id: 'roman-blinds', label: 'Roman Blinds', value: 'roman-blinds' },
      { id: 'roller-blinds', label: 'Roller Blinds', value: 'roller-blinds' },
      { id: 'venetian-blinds', label: 'Venetian Blinds', value: 'venetian-blinds' },
      { id: 'curtain-rods', label: 'Curtain Rods', value: 'curtain-rods' },
      { id: 'motorized-curtains', label: 'Motorized Curtains', value: 'motorized-curtains' },
    ],
  },
  {
    id: 'art-wall-decor',
    name: 'Art & Wall Decor',
    slug: 'art-wall-decor',
    description: 'Paintings, canvas art, and wall installations',
    subcategories: [
      { id: 'paintings', label: 'Paintings', value: 'paintings' },
      { id: 'canvas-art', label: 'Canvas Art', value: 'canvas-art' },
      { id: 'sculptural-wall-art', label: 'Sculptural Wall Art', value: 'sculptural-wall-art' },
      { id: 'metal-wall-art', label: 'Metal Wall Art', value: 'metal-wall-art' },
      { id: 'wallpapers', label: 'Wallpapers', value: 'wallpapers' },
      { id: 'wall-panels', label: 'Wall Panels', value: 'wall-panels' },
    ],
  },
  {
    id: 'storage',
    name: 'Storage',
    slug: 'storage',
    description: 'Storage solutions and organizational systems',
    subcategories: [
      { id: 'storage-wardrobes', label: 'Wardrobes', value: 'storage-wardrobes' },
      { id: 'storage-cabinets', label: 'Cabinets', value: 'storage-cabinets' },
      { id: 'shelving', label: 'Shelving', value: 'shelving' },
      { id: 'storage-boxes', label: 'Storage Boxes', value: 'storage-boxes' },
      { id: 'shoe-cabinets', label: 'Shoe Cabinets', value: 'shoe-cabinets' },
      { id: 'entryway-storage', label: 'Entryway Storage', value: 'entryway-storage' },
    ],
  },
  {
    id: 'childrens',
    name: "Children's Collection",
    slug: 'childrens',
    description: 'Furniture and decor for children\'s rooms',
    subcategories: [
      { id: 'kids-beds', label: 'Kids Beds', value: 'kids-beds' },
      { id: 'cribs', label: 'Cribs', value: 'cribs' },
      { id: 'kids-study-desks', label: 'Study Desks', value: 'kids-study-desks' },
      { id: 'kids-chairs', label: 'Kids Chairs', value: 'kids-chairs' },
      { id: 'kids-wardrobes', label: 'Wardrobes', value: 'kids-wardrobes' },
      { id: 'kids-storage-units', label: 'Storage Units', value: 'kids-storage-units' },
      { id: 'kids-decor', label: 'Decor', value: 'kids-decor' },
    ],
  },
  {
    id: 'hospitality',
    name: 'Hospitality Collection',
    slug: 'hospitality',
    description: 'Furniture for hotels, restaurants, and commercial spaces',
    subcategories: [
      { id: 'hotel-beds', label: 'Hotel Beds', value: 'hotel-beds' },
      { id: 'hotel-seating', label: 'Hotel Seating', value: 'hotel-seating' },
      { id: 'lobby-furniture', label: 'Lobby Furniture', value: 'lobby-furniture' },
      { id: 'restaurant-furniture', label: 'Restaurant Furniture', value: 'restaurant-furniture' },
      { id: 'cafe-furniture', label: 'Café Furniture', value: 'cafe-furniture' },
      { id: 'banquet-furniture', label: 'Banquet Furniture', value: 'banquet-furniture' },
    ],
  },
  {
    id: 'commercial',
    name: 'Commercial Collection',
    slug: 'commercial',
    description: 'Commercial-grade furniture for offices and retail',
    subcategories: [
      { id: 'commercial-office-furniture', label: 'Office Furniture', value: 'commercial-office-furniture' },
      { id: 'retail-fixtures', label: 'Retail Fixtures', value: 'retail-fixtures' },
      { id: 'commercial-reception-desks', label: 'Reception Desks', value: 'commercial-reception-desks' },
      { id: 'waiting-area-seating', label: 'Waiting Area Seating', value: 'waiting-area-seating' },
      { id: 'conference-furniture', label: 'Conference Furniture', value: 'conference-furniture' },
      { id: 'educational-furniture', label: 'Educational Furniture', value: 'educational-furniture' },
    ],
  },
  {
    id: 'smart-home',
    name: 'Smart Home',
    slug: 'smart-home',
    description: 'Smart home technology and automation',
    subcategories: [
      { id: 'smart-home-lighting', label: 'Smart Lighting', value: 'smart-home-lighting' },
      { id: 'smart-locks', label: 'Smart Locks', value: 'smart-locks' },
      { id: 'smart-curtains', label: 'Smart Curtains', value: 'smart-curtains' },
      { id: 'smart-thermostats', label: 'Smart Thermostats', value: 'smart-thermostats' },
      { id: 'security-cameras', label: 'Security Cameras', value: 'security-cameras' },
      { id: 'home-automation-systems', label: 'Home Automation Systems', value: 'home-automation-systems' },
    ],
  },
  {
    id: 'home-accessories',
    name: 'Home Accessories',
    slug: 'home-accessories',
    description: 'Textiles, tableware, and finishing accessories',
    subcategories: [
      { id: 'accessories-cushions', label: 'Cushions', value: 'accessories-cushions' },
      { id: 'throws', label: 'Throws', value: 'throws' },
      { id: 'blankets', label: 'Blankets', value: 'blankets' },
      { id: 'decorative-books', label: 'Decorative Books', value: 'decorative-books' },
      { id: 'trays', label: 'Trays', value: 'trays' },
      { id: 'baskets', label: 'Baskets', value: 'baskets' },
      { id: 'storage-accessories', label: 'Storage Accessories', value: 'storage-accessories' },
      { id: 'tableware', label: 'Tableware', value: 'tableware' },
      { id: 'glassware', label: 'Glassware', value: 'glassware' },
    ],
  },
  {
    id: 'architectural-finishes',
    name: 'Architectural & Interior Finishes',
    slug: 'architectural-finishes',
    description: 'Materials and finishes for architectural and interior applications',
    subcategories: [
      { id: 'marble', label: 'Marble', value: 'marble' },
      { id: 'granite', label: 'Granite', value: 'granite' },
      { id: 'quartz', label: 'Quartz', value: 'quartz' },
      { id: 'porcelain-tiles', label: 'Porcelain Tiles', value: 'porcelain-tiles' },
      { id: 'ceramic-tiles', label: 'Ceramic Tiles', value: 'ceramic-tiles' },
      { id: 'timber-flooring', label: 'Timber Flooring', value: 'timber-flooring' },
      { id: 'vinyl-flooring', label: 'Vinyl Flooring', value: 'vinyl-flooring' },
      { id: 'spc-flooring', label: 'SPC Flooring', value: 'spc-flooring' },
      { id: 'engineered-wood', label: 'Engineered Wood', value: 'engineered-wood' },
      { id: 'finishes-wallpapers', label: 'Wallpapers', value: 'finishes-wallpapers' },
      { id: 'decorative-panels', label: 'Decorative Panels', value: 'decorative-panels' },
      { id: 'acoustic-panels', label: 'Acoustic Panels', value: 'acoustic-panels' },
      { id: 'ceiling-systems', label: 'Ceiling Systems', value: 'ceiling-systems' },
      { id: 'doors', label: 'Doors', value: 'doors' },
      { id: 'windows', label: 'Windows', value: 'windows' },
      { id: 'stair-systems', label: 'Stair Systems', value: 'stair-systems' },
      { id: 'ironmongery', label: 'Ironmongery', value: 'ironmongery' },
    ],
  },
  {
    id: 'hardware',
    name: 'Hardware',
    slug: 'hardware',
    description: 'Door handles, locks, and furniture hardware',
    subcategories: [
      { id: 'door-handles', label: 'Door Handles', value: 'door-handles' },
      { id: 'cabinet-handles', label: 'Cabinet Handles', value: 'cabinet-handles' },
      { id: 'hinges', label: 'Hinges', value: 'hinges' },
      { id: 'locks', label: 'Locks', value: 'locks' },
      { id: 'drawer-systems', label: 'Drawer Systems', value: 'drawer-systems' },
      { id: 'bathroom-hardware', label: 'Bathroom Hardware', value: 'bathroom-hardware' },
    ],
  },
  {
    id: 'appliances',
    name: 'Appliances',
    slug: 'appliances',
    description: 'Kitchen and home appliances',
    subcategories: [
      { id: 'refrigerators', label: 'Refrigerators', value: 'refrigerators' },
      { id: 'ovens', label: 'Ovens', value: 'ovens' },
      { id: 'cooktops', label: 'Cooktops', value: 'cooktops' },
      { id: 'dishwashers', label: 'Dishwashers', value: 'dishwashers' },
      { id: 'range-hoods', label: 'Range Hoods', value: 'range-hoods' },
      { id: 'washing-machines', label: 'Washing Machines', value: 'washing-machines' },
      { id: 'dryers', label: 'Dryers', value: 'dryers' },
      { id: 'wine-coolers', label: 'Wine Coolers', value: 'wine-coolers' },
      { id: 'coffee-machines', label: 'Coffee Machines', value: 'coffee-machines' },
    ],
  },
  {
    id: 'wellness',
    name: 'Wellness & Lifestyle',
    slug: 'wellness',
    description: 'Home gym, wellness, and lifestyle products',
    subcategories: [
      { id: 'home-gym-equipment', label: 'Home Gym Equipment', value: 'home-gym-equipment' },
      { id: 'sauna-systems', label: 'Sauna Systems', value: 'sauna-systems' },
      { id: 'steam-rooms', label: 'Steam Rooms', value: 'steam-rooms' },
      { id: 'spa-furniture', label: 'Spa Furniture', value: 'spa-furniture' },
      { id: 'massage-chairs', label: 'Massage Chairs', value: 'massage-chairs' },
    ],
  },
  {
    id: 'seasonal',
    name: 'Seasonal Collections',
    slug: 'seasonal',
    description: 'Seasonal, limited edition, and new arrival collections',
    subcategories: [
      { id: 'holiday-decor', label: 'Holiday Decor', value: 'holiday-decor' },
      { id: 'outdoor-summer', label: 'Outdoor Summer Collection', value: 'outdoor-summer' },
      { id: 'winter-collection', label: 'Winter Collection', value: 'winter-collection' },
      { id: 'limited-editions', label: 'Limited Editions', value: 'limited-editions' },
      { id: 'new-arrivals', label: 'New Arrivals', value: 'new-arrivals' },
    ],
  },
  {
    id: 'custom-services',
    name: 'Custom & Made-to-Order',
    slug: 'custom-services',
    description: 'Bespoke and custom services across all categories',
    subcategories: [
      { id: 'custom-furniture', label: 'Custom Furniture', value: 'custom-furniture' },
      { id: 'custom-upholstery', label: 'Custom Upholstery', value: 'custom-upholstery' },
      { id: 'custom-cabinetry', label: 'Custom Cabinetry', value: 'custom-cabinetry' },
      { id: 'bespoke-joinery', label: 'Bespoke Joinery', value: 'bespoke-joinery' },
      { id: 'custom-wardrobes', label: 'Custom Wardrobes', value: 'custom-wardrobes' },
      { id: 'custom-kitchens', label: 'Custom Kitchens', value: 'custom-kitchens' },
      { id: 'custom-lighting', label: 'Custom Lighting', value: 'custom-lighting' },
      { id: 'custom-rugs', label: 'Custom Rugs', value: 'custom-rugs' },
      { id: 'custom-curtains', label: 'Custom Curtains', value: 'custom-curtains' },
      { id: 'interior-styling-packages', label: 'Interior Styling Packages', value: 'interior-styling-packages' },
    ],
  },
]

// Helper function to get category by ID
export function getCategoryById(id: string): Category | undefined {
  return PRODUCT_CATEGORIES.find((cat) => cat.id === id)
}

// Helper function to get category by slug
export function getCategoryBySlug(slug: string): Category | undefined {
  return PRODUCT_CATEGORIES.find((cat) => cat.slug === slug)
}

// Helper function to get all main category names for filtering
export function getMainCategories(): { id: string; name: string; slug: string }[] {
  return PRODUCT_CATEGORIES.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
  }))
}

// Helper function to get subcategories for a main category
export function getSubcategories(categoryId: string): CategoryItem[] {
  const category = getCategoryById(categoryId)
  return category?.subcategories || []
}
