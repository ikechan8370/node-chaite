// github.js - GitHub API data fetching with caching

const CACHE_EXPIRY = 60 * 60 * 1000 // 1 hour in milliseconds
const CACHE_KEY_PREFIX = 'github_data_'

/**
 * Save data to localStorage cache with timestamp
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 */
function saveToCache(key, data) {
  const cacheItem = {
    data,
    timestamp: Date.now(),
  }
  localStorage.setItem(key, JSON.stringify(cacheItem))
}

/**
 * Get data from cache if not expired
 * @param {string} key - Cache key
 * @returns {any|null} Cached data or null if expired/missing
 */
function getFromCache(key) {
  const cachedItem = localStorage.getItem(key)
  if (!cachedItem)
    return null

  try {
    const { data, timestamp } = JSON.parse(cachedItem)
    const now = Date.now()

    // Check if cache is expired
    if (now - timestamp > CACHE_EXPIRY)
      return null

    return data
  }
  // eslint-disable-next-line unused-imports/no-unused-vars
  catch (err) {
    return null
  }
}

/**
 * Format cache timestamp into human-readable form
 * @param {string} key - Cache key
 * @returns {string} Human readable cache status
 */
function getCacheStatus(key) {
  const cachedItem = localStorage.getItem(key)
  if (!cachedItem)
    return '实时数据'

  try {
    const { timestamp } = JSON.parse(cachedItem)
    const age = Date.now() - timestamp
    const minutesAgo = Math.floor(age / 60000)

    if (minutesAgo < 1)
      return '刚刚更新'
    if (minutesAgo < 60)
      return `${minutesAgo} 分钟前更新`
    return `${Math.floor(minutesAgo / 60)} 小时前更新`
  }
  catch {
    return '实时数据'
  }
}

/**
 * Fetch repository data from GitHub API
 * @param {object} repo - Repository information
 * @param {boolean} forceRefresh - Force refresh from API
 * @returns {Promise<object>} Repository data
 */
async function fetchRepositoryData(repo, forceRefresh = false) {
  const cacheKey = `${CACHE_KEY_PREFIX}repo_${repo.owner}_${repo.name}`

  if (!forceRefresh) {
    const cached = getFromCache(cacheKey)
    if (cached) {
      return cached
    }
  }

  const response = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.name}`)
  if (!response.ok)
    throw new Error(`Failed to fetch ${repo.name} repository data`)

  const data = await response.json()
  saveToCache(cacheKey, data)
  return data
}

/**
 * Fetch commits for a repository
 * @param {object} repo - Repository information
 * @param {boolean} forceRefresh - Force refresh from API
 * @returns {Promise<Array>} Commits data
 */
async function fetchRepositoryCommits(repo, forceRefresh = false) {
  const cacheKey = `${CACHE_KEY_PREFIX}commits_${repo.owner}_${repo.name}_${repo.branch}`

  if (!forceRefresh) {
    const cached = getFromCache(cacheKey)
    if (cached) {
      return cached
    }
  }
  let url = `https://api.github.com/repos/${repo.owner}/${repo.name}/commits?per_page=5`
  if (repo.branch) {
    url += `&sha=${repo.branch}`
  }
  const response = await fetch(url)
  if (!response.ok)
    throw new Error(`Failed to fetch ${repo.name} commits`)

  const data = await response.json()
  saveToCache(cacheKey, data)
  return data
}

/**
 * Fetch releases for a repository
 * @param {object} repo - Repository information
 * @param {boolean} forceRefresh - Force refresh from API
 * @returns {Promise<Array>} Releases data
 */
async function fetchRepositoryReleases(repo, forceRefresh = false) {
  const cacheKey = `${CACHE_KEY_PREFIX}releases_${repo.owner}_${repo.name}`

  if (!forceRefresh) {
    const cached = getFromCache(cacheKey)
    if (cached) {
      return cached
    }
  }

  const response = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.name}/releases?per_page=3`)
  if (!response.ok)
    throw new Error(`Failed to fetch ${repo.name} releases`)

  const data = await response.json()
  saveToCache(cacheKey, data)
  return data
}

/**
 * Get cache status for a repository
 * @param {object} repo - Repository information
 * @returns {string} Cache status message
 */
function getRepositoryCacheStatus(repo) {
  const cacheKey = `${CACHE_KEY_PREFIX}repo_${repo.owner}_${repo.name}`
  return getCacheStatus(cacheKey)
}

/**
 * Fetch all GitHub data for a repository
 * @param {object} repo - Repository information
 * @param {boolean} forceRefresh - Force refresh
 * @returns {Promise<{ repository: object, commits: Array, releases: Array}>} All repository data
 */
async function fetchAllRepositoryData(repo, forceRefresh = false) {
  try {
    const [repoData, commits, releases] = await Promise.all([
      fetchRepositoryData(repo, forceRefresh),
      fetchRepositoryCommits(repo, forceRefresh),
      fetchRepositoryReleases(repo, forceRefresh),
    ])

    return {
      repository: repoData,
      commits,
      releases,
    }
  }
  catch (error) {
    console.error(`Error fetching data for ${repo.name}:`, error)
    throw error
  }
}

export {
  CACHE_KEY_PREFIX,
  fetchAllRepositoryData,
  fetchRepositoryCommits,
  fetchRepositoryData,
  fetchRepositoryReleases,
  getRepositoryCacheStatus,
}
