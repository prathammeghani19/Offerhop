const SITE = 'https://offerhop.in'
const BRAND = 'OffferHop'

export const org = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE}/#organization`,
  name: BRAND,
  url: SITE,
  logo: { '@type': 'ImageObject', url: `${SITE}/logo.png` },
  description: 'India\'s food and drink deals discovery platform — BOGO, happy hours, combo offers and dining discounts at top restaurants across Bangalore, Delhi, Mumbai, Pune, Hyderabad and Gurgaon.',
  foundingLocation: { '@type': 'Place', name: 'Bangalore, India' },
  areaServed: [
    'Bangalore', 'Delhi', 'Mumbai', 'Pune', 'Hyderabad', 'Gurgaon'
  ].map(name => ({ '@type': 'City', name })),
  knowsAbout: [
    'Restaurant deals', 'BOGO offers', 'Happy hours', 'Dining discounts',
    'Food offers India', 'Combo meals', 'Bank card dining offers',
  ],
  sameAs: [],
})

export const website = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE}/#website`,
  name: BRAND,
  url: SITE,
  publisher: { '@id': `${SITE}/#organization` },
  description: 'Discover food and drink deals at restaurants in Indian cities.',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE}/search?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
})

export const breadcrumb = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: item.url,
  })),
})

export const faqPage = (faqs) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(f => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
})

export const speakable = (url) => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  url,
  speakable: {
    '@type': 'SpeakableSpecification',
    cssSelector: ['.page-hero', '.offers-title-block', '.speakable'],
  },
})

export const offerList = (offers, url) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  url,
  numberOfItems: offers.length,
  itemListElement: offers.slice(0, 10).map((o, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'FoodEstablishment',
      name: o.restaurant_name,
      description: o.deal_description,
      ...(o.rating && { aggregateRating: { '@type': 'AggregateRating', ratingValue: o.rating, bestRating: 5 } }),
      ...(o.source_url && { url: o.source_url }),
    },
  })),
})
