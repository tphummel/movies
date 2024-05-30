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
TMDB_API_KEY=abc123 ./node_modules/.bin/zx content/t/tmdb-to-movie.md --id 290859
TMDB_API_KEY=abc123 ./node_modules/.bin/zx content/t/tmdb-to-movie.md --all
```

- The process will exit 0 on success
- The process will exit 1 on failure with failure info written to stdout

# Code

```js
import fetch from 'fetch-vcr'
import * as cheerio from 'cheerio'

// certification list shows a reference of the mpaa style movie ratings that are available
// const certUrl = `https://api.themoviedb.org/3/certification/movie/list\?api_key\=${process.env.TMDB_API_KEY}`
// const certRes = await fetch(certUrl)
// const certData = await certRes.json()

async function loadMovie (movie) {
  console.log(movie)
  const {tmdb_id: movieId, collections, mc_slug, rt_slug} = movie

  console.log(`processing: ${movieId}`)
  const url = `https://api.themoviedb.org/3/movie/${movieId}\?api_key\=${process.env.TMDB_API_KEY}\&language\=en-US`
  const res = await fetch(url)
  const data = await res.json()

  const keywordsUrl = `https://api.themoviedb.org/3/movie/${movieId}/keywords\?api_key\=${process.env.TMDB_API_KEY}\&language\=en-US`
  const keywordsRes = await fetch(keywordsUrl)
  const keywordsData = await keywordsRes.json()

  const creditsUrl = `https://api.themoviedb.org/3/movie/${movieId}/credits\?api_key\=${process.env.TMDB_API_KEY}\&language\=en-US`
  const creditsRes = await fetch(creditsUrl)
  const creditsData = await creditsRes.json()
  
  const releaseUrl = `https://api.themoviedb.org/3/movie/${movieId}/release_dates\?api_key\=${process.env.TMDB_API_KEY}`
  const releaseRes = await fetch(releaseUrl)
  const releaseData = await releaseRes.json()

  const rtUrl = `https://www.rottentomatoes.com/m/${rt_slug}`
  const rtRes = await fetch(rtUrl, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36'
    }
  })
  const rtData = await rtRes.text()
  const rtPage = cheerio.load(rtData)
  const ldJsonTags = rtPage('script[type="application/ld+json"]')
  const ldJson = JSON.parse(ldJsonTags[0].children[0].data)
  const rtScore = parseInt(ldJson.aggregateRating.ratingValue, 10)
  const rtReviewCount = ldJson.aggregateRating.reviewCount

  const mcUrl = `https://www.metacritic.com/movie/${mc_slug}`
  const mcRes = await fetch(mcUrl, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36'
    }
  })
  const mcData = await mcRes.text()
  const mcPage = cheerio.load(mcData)
  const mcLdJsonTags = mcPage('script[type="application/ld+json"]')
  const mcJson = JSON.parse(mcLdJsonTags[0].children[0].data)

  const mcScore = parseInt(mcJson.aggregateRating.ratingValue, 10)
  let mcReviewCount = mcJson.aggregateRating.ratingCount || mcJson.aggregateRating.reviewCount
  mcReviewCount = parseInt(mcReviewCount, 10)

  const chronologicalReleases = releaseData.results
    .find(i => i.iso_3166_1 === 'US')
    .release_dates
    .sort((a, b) => a.release_date < b.release_date ? -1 : 1)

  const filteredReleases = chronologicalReleases.filter(d => d.certification !== '')

  let initialMovieRating
  if (filteredReleases.length === 0) {
    initialMovieRating = 'unknown'
  } else {
    initialMovieRating = filteredReleases
      .find(d => d.certification !== '')
      .certification
  }

  const topCast = creditsData.cast.filter((f) => {
    if (f.order < 10) {
      return f.popularity >= 3
    } else {
      return f.popularity >= 10
    }
  })

  const crewJobs = [
    'Director', 'Producer', 'Executive Producer', 'Writer', 'Editor', 'Director of Photography'
  ]

  const topCrew = creditsData.crew.filter((f) => {
    return crewJobs.includes(f.job)
  })

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
    .replace(/^the\-/, '')

  const releaseYear = data.release_date.substring(0,4)
  const releaseDecade = Math.floor(releaseYear / 10) * 10

  console.log(titleSlug, releaseYear, releaseDecade)

  const docYaml = `---
title: "${data.title}"
title_alpha_sortable: "${data.title.replace(/^The /, "")}"
date: "${(new Date()).toISOString()}"
collections: ${JSON.stringify(collections)}
budget_usd: ${data.budget}
tiers: []
genres: ${JSON.stringify(data.genres.map(g => g.id))}
tsdb_id: ${data.id}
imdb_id: "${data.imdb_id}"
metacritic:
  slug: "${mc_slug}"
  score: ${mcScore}
  review_count: ${mcReviewCount}
rotten_tomatoes:
  slug: "${rt_slug}"
  score: ${rtScore}
  review_count: ${rtReviewCount}
original_title: "${data.original_title}"
ratings: ["${initialMovieRating}"]
original_language: "${data.original_language}"
poster_path: "${data.poster_path}"
production_companies: ${JSON.stringify(data.production_companies.map(g => g.id))}
production_countries: ${JSON.stringify(data.production_countries.map(g => g.iso_3166_1))}
release_date: "${data.release_date}"
release_years: [${releaseYear}]
release_decades: [${releaseDecade}]
revenue_usd: ${data.revenue}
status: "${data.status}"
runtime_minutes: ${data.runtime}
keywords: ${JSON.stringify(keywordsData.keywords.map(k => k.id))}
cast_members: ${JSON.stringify(topCast.map(k => k.id))}
crew_members: ${JSON.stringify(topCrew.map(k => k.id))}
tagline: >
  ${data.tagline}
overview: >
  ${data.overview}
homepage: "${data.homepage}"
---
`
  const outputDir = `content/movies/${releaseYear}-${titleSlug}`
  console.log(`writing ${outputDir}`)
  await fs.outputFile(`${outputDir}/index.md`, docYaml)

  for (const company of data.production_companies) {
    const companyDir = `content/production_companies/${company.id}`
    await fs.outputFile(`${companyDir}/_index.md`, `---
title: "${company.name}"
name: "${company.name}"
id: "${company.id}"
logo_path: "${company.logo_path}"
origin_country: "${company.origin_country}"
---
`)
  }

  for (const country of data.production_countries) {
    const countryDir = `content/production_countries/${country.id}`
    await fs.outputFile(`${countryDir}/_index.md`, `---
title: "${country.name}"
name: "${country.name}"
id: "${country.iso_3166_1}"
---
`)
  }


  await fs.outputFile(`${outputDir}/cast.json`, JSON.stringify(topCast.map((c) => {
    return {
      id: c.id,
      name: c.name,
      popularity: c.popularity,
      cast_id: c.cast_id,
      order: c.order,
      character: c.character,
      credit_id: c.credit_id
    }
  }), null, 2))

  await fs.outputFile(`${outputDir}/crew.json`, JSON.stringify(topCrew.map((c) => {
    return {
      id: c.id,
      name: c.name,
      popularity: c.popularity,
      credit_id: c.credit_id,
      department: c.department,
      job: c.job
    }
  }), null, 2))

  const releaseYearDir = `content/release_years/${releaseYear}`
  await fs.outputFile(`${releaseYearDir}/_index.md`, `---
title: ${releaseYear}
---
`)

  for (const keyword of keywordsData.keywords) {
    const keywordDir = `content/keywords/${keyword.id}`
    await fs.outputFile(`${keywordDir}/_index.md`, `---
title: ${keyword.name}
---
`)
  }

  for (const genre of data.genres) {
    const genreDir = `content/genres/${genre.id}`
    await fs.outputFile(`${genreDir}/_index.md`, `---
title: ${genre.name}
---
`)
  }

  for (const castMember of topCast) {
    const castMemberDir = `content/cast_members/${castMember.id}`
    await fs.outputFile(`${castMemberDir}/_index.md`, `---
title: "${castMember.name.replace(/"/g, '\\"')}"
name: "${castMember.name.replace(/"/g, '\\"')}"
id: "${castMember.id}"
original_name: "${castMember.original_name.replace(/"/g, '\\"')}"
known_for_department: "${castMember.known_for_department}"
gender: "${castMember.gender}"
adult: "${castMember.adult}"
profile_path: "${castMember.profile_path}"
---
`)
  }

  for (const crewMember of topCrew) {
    const crewMemberDir = `content/crew_members/${crewMember.id}`
    await fs.outputFile(`${crewMemberDir}/_index.md`, `---
title: "${crewMember.name}"
name: "${crewMember.name}"
id: "${crewMember.id}"
original_name: "${crewMember.original_name}"
known_for_department: "${crewMember.known_for_department}"
gender: "${crewMember.gender}"
adult: "${crewMember.adult}"
profile_path: "${crewMember.profile_path}"
---
`)
  }
}

  await fs.outputFile(`content/movies/_index.md`, `---
title: Movies
---
`)

const allMovies = await fs.readJson('./movies.json')

if (argv.all) {
  console.log('running all')
  for (const movie of allMovies.movies) {
    await loadMovie(movie)
  }
} else {
  const [movieId] = argv._
  if (movieId) {
    const movie = allMovies.movies.find(m => m.tmdb_id === movieId)
    if (!movie) {
      console.log(`movie with id ${movieId} not found in movies.json file`)
    } else {
      console.log(`loading single movie: ${movie.tmdb_id} ${movie.name}`)
      await loadMovie(movie)
    }
  }
}
```
