const middleware = async ({ request, env, next, data }) => {
  const response = await context.next()
  response.headers.set('X-TOM', '123')
  return response
}

export const onRequest = [middleware];