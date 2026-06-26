export const homepageFaqs = () => [
  {
    q: 'What is OffferHop?',
    a: 'OffferHop is India\'s food and drink deals discovery platform. It aggregates BOGO offers, happy hours, combo deals and dining discounts from top restaurants across Bangalore, Delhi, Mumbai, Pune, Hyderabad and Gurgaon — all in one place, completely free.',
  },
  {
    q: 'Which cities does OffferHop cover?',
    a: 'OffferHop currently covers Bangalore, Delhi, Mumbai, Gurgaon, Pune and Hyderabad. More Indian cities are being added regularly.',
  },
  {
    q: 'What types of restaurant deals can I find on OffferHop?',
    a: 'You can find BOGO (buy one get one free) deals, happy hour offers, combo meals, percentage discounts, pre-book restaurant offers and bank or credit card dining offers across food and drink categories.',
  },
  {
    q: 'Is OffferHop free to use?',
    a: 'Yes, OffferHop is completely free. Browse, filter and discover deals without any subscription or signup required.',
  },
  {
    q: 'How does OffferHop find restaurant deals?',
    a: 'OffferHop curates and validates restaurant deals using AI-assisted data extraction, covering deals from restaurant websites, food aggregators and dining platforms across Indian cities.',
  },
]

export const cityFaqs = (cityName, areas = []) => {
  const areaList = areas.slice(0, 4).map(a => a.name).join(', ')
  return [
    {
      q: `Where can I find the best food and drink deals in ${cityName}?`,
      a: `OffferHop lists the best BOGO, happy hour and combo deals in ${cityName}${areaList ? `, covering popular areas like ${areaList}` : ''}. Browse by area and food category to find deals near you.`,
    },
    {
      q: `Are there happy hour deals in ${cityName}?`,
      a: `Yes, ${cityName} has several restaurants and bars with happy hour deals — especially on beer, cocktails and spirits. Use OffferHop to filter by Happy Hours in your preferred area of ${cityName}.`,
    },
    {
      q: `Which areas in ${cityName} have the most restaurant offers?`,
      a: `${areaList ? `${areaList} are among the most popular areas in ${cityName} for restaurant deals.` : `${cityName} has multiple areas with active restaurant deals.`} OffferHop covers all major dining neighbourhoods in ${cityName}.`,
    },
    {
      q: `Can I find BOGO (Buy One Get One) food offers in ${cityName}?`,
      a: `Yes. ${cityName} has numerous restaurants running BOGO deals on biryani, pizza, burgers, cocktails and more. OffferHop's BOGO filter helps you find them quickly by area.`,
    },
  ]
}

export const areaFaqs = (areaName, cityName) => [
  {
    q: `What food deals are available in ${areaName}, ${cityName}?`,
    a: `${areaName} in ${cityName} has a variety of restaurant deals including BOGO offers, combo meals, happy hours and percentage discounts. OffferHop lists all active deals by food and drink category.`,
  },
  {
    q: `Are there BOGO offers in ${areaName}?`,
    a: `Yes, several restaurants in ${areaName}, ${cityName} run BOGO (buy one get one) deals — especially on biryani, pizza, burgers and drinks. Filter by BOGO on OffferHop to see all active offers.`,
  },
  {
    q: `Where to find happy hours in ${areaName}, ${cityName}?`,
    a: `${areaName} has bars and restaurants offering happy hours on beer, cocktails and spirits, typically in the evening. Use OffferHop's Happy Hours filter to find current deals in ${areaName}.`,
  },
  {
    q: `What is the best way to save money dining out in ${areaName}?`,
    a: `The best way to save while dining in ${areaName}, ${cityName} is to check OffferHop before visiting. You'll find BOGO deals, combo offers, pre-book discounts and bank card offers at popular restaurants.`,
  },
]

export const categoryFaqs = (catName, areaName, cityName, offerCount = 0) => {
  const isdrink = ['beer', 'cocktails', 'mocktails', 'craft beer', 'spirits'].includes(catName.toLowerCase())
  const countText = offerCount > 0 ? `There are currently ${offerCount} active deals.` : ''

  return [
    {
      q: `Where can I find the best ${catName} deals in ${areaName}, ${cityName}?`,
      a: `OffferHop lists the best ${catName} offers in ${areaName}, ${cityName}. ${countText} Filter by BOGO, % Off or Happy Hours to find the right deal.`,
    },
    {
      q: isdrink
        ? `Which bars in ${areaName} offer happy hour ${catName} deals?`
        : `Which restaurants in ${areaName} have BOGO ${catName} offers?`,
      a: isdrink
        ? `Several bars and restaurants in ${areaName}, ${cityName} offer happy hour deals on ${catName}. OffferHop lists them with timings and savings so you can plan your visit.`
        : `Multiple restaurants in ${areaName}, ${cityName} run BOGO ${catName} deals. OffferHop curates and validates these offers so you always see real, active deals.`,
    },
    {
      q: `Are there bank card ${catName} offers in ${areaName}?`,
      a: `Yes, some restaurants in ${areaName} offer additional discounts on ${catName} when paying with specific bank cards (HDFC, SBI, ICICI, Axis). Use the Bank Offer filter on OffferHop to find them.`,
    },
    {
      q: `Can I pre-book ${catName} deals in ${areaName}, ${cityName}?`,
      a: `Some ${catName} restaurants in ${areaName} offer special pre-book discounts through platforms like Dineout and EazyDiner. OffferHop's Pre-book filter highlights these offers.`,
    },
  ]
}
