# Analytics operations

## Current deployment
The public `/mind/stats/` page provides real Vercount totals, a build-time content inventory, private provider entry points, instrumentation documentation, local campaign builder, and device exclusion. **Umami is bound and verified: the provider received one real test visit and `analytics_test` on 2026-10-02. Clarity remains unbound.** It is not a private dashboard protected by its noindex tag. No secret or private visitor data may be published here.

## Bind the free services
1. In Umami Cloud, create a Hobby website named 海波东 · mind for `ma1203580780.github.io`. Leave sharing disabled. Copy Website ID, tracking script URL and private dashboard URL.
2. In Microsoft Clarity, create a project for `https://ma1203580780.github.io/mind/`. Copy Project ID and private dashboard URL. Review masking and retain explicit cookie consent.
3. Fill `src/config/analytics.json`: `umamiWebsiteId`, `umamiScriptUrl`, `umamiDashboardUrl`, `clarityProjectId`, `clarityDashboardUrl`. These project IDs are public tracking identifiers, not API secrets. Retain provider `vercount` for independent legacy totals.
4. Build and publish. Verify script loading and actual pageview/event receipt in both provider dashboards. A loaded script / queued event is **not** proof of server receipt. Check no unexpected consent cookies before consent and no requests after opt-out.
5. In an owner browser, enable “排除这台设备”. Validate from a separate consenting browser. Remove test traffic through report filters.

Umami Cloud free Hobby does not include API access as of 2026-10-02. The custom page therefore deliberately does not pretend to synchronise private timeseries. Use provider dashboards for date selection, filters and export. A future self-hosted Umami plus authenticated backend can support a fully custom private dashboard; do not embed credentials in GitHub Pages, GitHub public artifacts, or URL parameters. No shared/public dashboard should be enabled without the owner's explicit decision.

## Recommended views to create after login
- Overview: pageviews, visitors, sessions, bounce rate, duration; 7 / 30 day comparisons.
- Acquisition: referrer, country, device, browser, UTM source and campaign. Filter path prefix `/mind/` to isolate other same-domain Pages projects.
- Content: URL starts `/mind/posts/`, split by article and mode, only published original posts are available.
- Reading: `read_depth`, `read_active`, article dimension. Depth is viewport reach, not comprehension. Foreground visible-body time pauses after 60 seconds without interaction.
- Native media: `_play` once/page, progress milestones from `HTMLMediaElement.played`. `_complete` means reaching the end and can include seeking. Do not present event-count ratios as unique-person conversion rates.
- News: `news_source_open`, split by issue/story/source/category; filter/view/expand; original-source clicks are not views at that source.
- Clarity: consenting sessions only; heatmaps and recordings filtered by URL/device and named custom events. Bilibili iframe internals unavailable.
- Quality: native `media_error`; Umami performance requires a supporting tracker/service version. Search sends result count only; copy/share/subscribe events represent button clicks, not verified success.

## Privacy implementation
DNT / local opt-out / owner exclusion prevent all scripts and custom events. Clarity loads only after explicit replay consent, with ad storage denied and input areas masked. Search route and unknown URL query keys disable replay. Umami `beforeSend` removes arbitrary queries/hashes, retaining only constrained UTM identifiers. No full-text searches, form values or stable user identity are passed to custom events. Vercount remains an independent third-party request with its own counters/cookies and data policy.

## Validation
`node --test scripts/analytics.test.mjs` checks privacy gates and event payload schema. `npm run test:news` and `npm run build` retain existing release checks. On the live site test report filters, link generation/copy, consent/exclusion toggles, script states and actual provider ingestion after account binding.

## Private board
A private board named 海波东 · 内容与读者总览 contains ten modules: metrics, visitor trend, top paths, events chart, referrers, devices, UTM sources, world map, weekly traffic and realtime metrics. Its login-required URL is in `umamiBoardUrl`; the website analytics URL stays in `umamiDashboardUrl`. No public sharing was enabled. Test traffic is real QA traffic, not organic audience growth.
