export interface LocalPageResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

interface PageQuery {
  page?: number
  pageSize?: number
}

interface LocalListResponse<T> {
  code: string | number
  data: T[] | LocalPageResult<T>
  message?: string
}

const MAX_PAGE_SIZE = 100

/** Load every page from a local list endpoint without relying on a magic page size. */
export async function fetchAllLocalItems<T, Q extends object>(
  fetchPage: (query: Q & PageQuery) => PromiseLike<LocalListResponse<T>>,
  query: Q,
): Promise<T[]> {
  const allItems: T[] = []
  let page = 1

  while (true) {
    const response = await fetchPage({ ...query, page, pageSize: MAX_PAGE_SIZE })
    if (response.code !== 0 && response.code !== '0')
      throw new Error(response.message || 'Failed to load list')

    if (Array.isArray(response.data))
      return response.data

    const { items, total } = response.data
    allItems.push(...items)
    if (allItems.length >= total || items.length === 0)
      return allItems

    page += 1
  }
}
