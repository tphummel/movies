const middleware = async ({ request, env, next, data }) => {
  const response = await next()
  response.headers.set('X-TOM', '123')
  return response
}

export const onRequest = [middleware];