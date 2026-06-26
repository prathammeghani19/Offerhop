import { Helmet } from 'react-helmet-async'
import { org, website, breadcrumb, faqPage, speakable, offerList } from './schemas'
import { homepageFaqs, cityFaqs, areaFaqs, categoryFaqs } from './faqs'

const SITE = 'https://offerhop.in'

/**
 * Centralised SEO head component.
 *
 * page: 'home' | 'city' | 'area' | 'category' | 'search' | 'saved'
 * context: { city, area, category, offers, areas }
 */
export default function SeoHead({ page, title, description, canonical, context = {} }) {
  const { city, area, category, offers = [], areas = [] } = context

  const cityName  = city?.name   || ''
  const areaName  = area?.name   || ''
  const catName   = category?.name || ''
  const offerCount = offers.length

  const schemas = []

  if (page === 'home') {
    schemas.push(org())
    schemas.push(website())
    schemas.push(faqPage(homepageFaqs()))
  }

  if (page === 'city' && cityName) {
    schemas.push(org())
    schemas.push(breadcrumb([
      { name: 'Home', url: SITE },
      { name: cityName, url: `${SITE}/${city.slug}` },
    ]))
    schemas.push(faqPage(cityFaqs(cityName, areas)))
  }

  if (page === 'area' && areaName) {
    schemas.push(org())
    schemas.push(breadcrumb([
      { name: 'Home',    url: SITE },
      { name: cityName,  url: `${SITE}/${city?.slug}` },
      { name: areaName,  url: `${SITE}/${city?.slug}/${area?.slug}` },
    ]))
    schemas.push(faqPage(areaFaqs(areaName, cityName)))
  }

  if (page === 'category' && catName) {
    schemas.push(org())
    schemas.push(breadcrumb([
      { name: 'Home',    url: SITE },
      { name: cityName,  url: `${SITE}/${city?.slug}` },
      { name: areaName,  url: `${SITE}/${city?.slug}/${area?.slug}` },
      { name: catName,   url: canonical },
    ]))
    schemas.push(faqPage(categoryFaqs(catName, areaName, cityName, offerCount)))
    schemas.push(speakable(canonical))
    if (offerCount > 0) schemas.push(offerList(offers, canonical))
  }

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={`${SITE}/logo.png`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <link rel="canonical" href={canonical} />
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(s)}</script>
      ))}
    </Helmet>
  )
}
