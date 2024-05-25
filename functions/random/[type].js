const types = {
  movie: {listPage: '/movies'},
  cast: {listPage: '/cast_members'},
  crew: {listPage: '/crew_members'},
  year: {listPage: '/release_years'},
}

export const onRequest = async ({request, params}) => {
  const {type} = params
  if(!types[type]){
    return new Response(`Invalid random type ${type}`, {status: 404})
  }

  const listPage = types[type].listPage
  const url = new URL(request.url)
  const baseURL = url.origin

  const movieUrls = []
  const rewriter = new HTMLRewriter()

  rewriter.on('a.random-target', {
    element: (element) => {
      const link = element.getAttribute('href')
      movieUrls.push(link)
      element.remove()
    },
  })

  const response = await fetch(`${baseURL}${listPage}`);
  await rewriter.transform(response).arrayBuffer()

  if(movieUrls.length){
    const randomIndex = Math.floor(Math.random() * movieUrls.length)
    console.log(`Redirecting to ${randomIndex} -> ${movieUrls[randomIndex]}`)
    return Response.redirect(`${baseURL}${movieUrls[randomIndex]}`, 302)
  }

  return new Response(`No links found on the list page ${listPage}`, {status: 404})
}