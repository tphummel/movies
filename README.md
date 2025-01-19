# Movies

[my movie website](https://movies.tomhummel.com)

## Add Movie Workflow

```
# add/edit entries in movies.json

export TMDB_API_KEY=asdasdasdasd
VCR_MODE=record ./node_modules/.bin/zx content/t/tmdb-to-movie.md <tmdb id>
VCR_MODE=cache ./node_modules/.bin/zx content/t/tmdb-to-movie.md <tmdb id>
```

[fetch-vcr](https://www.npmjs.com/package/fetch-vcr) usage notes

> playback: (default) only uses the local fixture files
> cache: tries to use the recorded response and if not found then it is fetched and then saved (useful when adding new tests)
> record: forces HTTP requests and responses are saved to the filesystem (useful for regenerating all the fixtures)

## Web Dev Workflow

```
hugo serve -w
```