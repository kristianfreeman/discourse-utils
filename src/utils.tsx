const discourseRequest = async (url: string, method: string, headersToMerge: Record<string, any>, body?: any) => {
  const headers = {
    'Content-type': 'application/json',
    ...headersToMerge
  }

  console.log(`Making ${method} request to ${url}`)

  return fetch(url, {
    method,
    headers,
    ...(method !== "GET" ? { body } : {})
  }).catch((err: any) => console.log(err.toString()))
}

export {
  discourseRequest
}
