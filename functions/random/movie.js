export const onRequest = async ({request}) => {
  const listPage = '/movies/'
  const url = new URL(request.url)
  const baseURL = url.origin

  const movieUrls = []
  const rewriter = new HTMLRewriter()

  rewriter.on('a.movie', {
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

  return new Response('No links found on the page with class \'movie\'.', {status: 404})
}