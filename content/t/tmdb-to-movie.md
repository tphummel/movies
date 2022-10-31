---
title: TMDB to Movie Page
date: 2022-10-30T14:10:00.000-08:00
toc: false
---

# Intro

Given a TMBD movie ID render out a hugo post

- input: TMDB movie id
- input: TMDB API key
- fetch the record from TMDB API
- create the destination filename from release date and slug
- fetch the poster img, save as page bundle resource
- write out the yaml file

# Usage

```
TMDB_API_KEY=abc123 ./node_modules/.bin/zx content/t/tmdb-to-movie.md 290859
```

- The process will exit 0 on success
- The process will exit 1 on failure with failure info written to stdout

# Code

```js
const [movieId] = argv._

console.log(`processing: ${movieId}`)
const url = `https://api.themoviedb.org/3/movie/${movieId}\?api_key\=${process.env.TMDB_API_KEY}\&language\=en-US`
const res = await fetch(url)
const data = await res.json()

// https://gist.github.com/codeguy/6684588
const titleSlug = data.title
  .toString()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/\s+/g, '-')
  .replace(/[^\w-]+/g, '')
  .replace(/--+/g, '-')

const releaseYear = data.release_date.substring(0,4)

const docYaml = `
---
title: "${data.title}"
date: "${(new Date()).toISOString()}"
budget_usd: ${data.budget}
genre_ids: [${data.genres.map(g => g.id).join(',')}]
tsdb_id: ${data.id}
imdb_id: "${data.imdb_id}"
original_title: "${data.original_title}"
original_language: "${data.original_language}"
poster_path: "${data.poster_path}"
production_company_ids: [${data.production_companies.map(g => g.id).join(',')}]
production_countries: [${data.production_countries.map(g => g.iso_3166_1).join(',')}]
release_date: "${data.release_date}"
release_years: [${releaseYear}]
revenue_usd: ${data.revenue}
status: "${data.status}"
runtime_minutes: ${data.runtime}
tagline: >
  ${data.tagline}
overview: >
  ${data.overview}
homepage: "${data.homepage}"
---
`

const outputDir = `content/m/${releaseYear}-${titleSlug}`
await $`mkdir -p ${outputDir}`

const outputFile = `${outputDir}/index.md`
await fs.writeFile(outputFile, docYaml)

const posterUrl = `https://www.themoviedb.org/t/p/w600_and_h900_bestv2${data.poster_path}`
fetch(posterUrl)
	.then(res =>
		res.body.pipe(fs.createWriteStream(`${outputDir}/poster.jpg`))
	)

```
