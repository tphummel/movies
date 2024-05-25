export const onRequest = async () => {
  const movieUrls = []
  const rewriter = new HTMLRewriter()

  rewriter.on('a.movie', {
    element: (element) => {
      const link = element.getAttribute('href')
      movieUrls.push(link)
      element.remove()
    },
  })

  const response = await fetch('/movies/')
  await rewriter.transform(response).arrayBuffer();

  if(movieUrls.length){
    const randomIndex = Math.floor(Math.random() * movieUrls.length);
    return Response.redirect(movieUrls[randomIndex], 302);
  }

  return new Response('No links found on the page with class \'movie\'.', {status: 404});
}