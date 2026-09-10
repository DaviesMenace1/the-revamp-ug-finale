 # SEO and AI-search research findings  
 
## Google Search Central: optimizing for generative AI features
Source: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide

- Existing SEO fundamentals remain relevant for Google generative search features.
- Google says there is no special schema.org markup required for generative AI search.
- Google says `llms.txt` and other special AI-readable files are not used by Google Search as a special ranking requirement. It can still be useful as a voluntary machine-readable company reference for other tools, but must not replace crawlable HTML.
- Google recommends valuable, people-first content, clear technical structure, local business and ecommerce details, and standard SEO practices.

## Google Search Central: sitemaps overview
Source: https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview

- A sitemap provides information about pages, media, and relationships so search engines can crawl important URLs more efficiently.
- Sitemap entries should represent canonical, indexable public URLs, not private portals, API routes, checkout paths, or duplicate query URLs.
- Dynamic product, service, portfolio, and journal URLs should be generated from the database rather than maintained as a static hand-written list.
- The sitemap should be advertised through robots.txt and submitted in Search Console after deployment.

Implementation implication: improve the site’s actual public HTML, metadata, internal links, and structured data first. Add `llms.txt` as a clean optional reference, but do not present it as a guaranteed Google AI ranking mechanism.

## Google Search Central: Organization structured data
Source: https://developers.google.com/search/docs/appearance/structured-data/organization

- Organization markup on the home page can help Google understand administrative details and disambiguate the organization.
- The implementation should use only facts that are visible and accurate on the site, including the organization name, canonical URL, logo, contact details, and verified social profiles.

## OpenAI crawlers
Source: https://developers.openai.com/api/docs/bots

- `OAI-SearchBot` is used to surface websites in ChatGPT search features. OpenAI states that sites opting out of OAI-SearchBot will not be shown in ChatGPT search answers, although they may still appear as navigational links.
- `GPTBot` controls crawling for possible foundation-model training and is independent from `OAI-SearchBot`.
- The site can allow OAI-SearchBot while choosing separately whether GPTBot should access content.
- OpenAI says changes to robots.txt can take about 24 hours to adjust for its systems.

Implementation implication: explicitly allow OAI-SearchBot in robots.txt for search visibility, keep private areas disallowed, and decide GPTBot policy separately. Do not promise that robots.txt alone guarantees AI answers; public, useful, crawlable pages and accurate entity data remain essential.
