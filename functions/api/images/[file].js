export async function onRequest(context) {
  // Contents of context object
  const {
    request, // same as existing Worker API
    env, // same as existing Worker API
    params, // if filename includes [id] or [[path]]
    waitUntil, // same as ctx.waitUntil in existing Worker API
    next, // used for middleware or to fetch assets
    data, // arbitrary space for passing data between middlewares
  } = context;

  let obj = await env.R2.get(params.file)
  if (obj === null) {
    const posterUrl = `https://www.themoviedb.org/t/p/w600_and_h900_bestv2/${params.file}`
    const res = await fetch(posterUrl)
    env.R2.put(params.file, res.body)
    obj = await env.R2.get(params.file)
  }

  const headers = new Headers()
  obj.writeHttpMetadata(headers)
  headers.set('etag', obj.httpEtag)

  return new Response(obj.body, {
    headers,
  })
}