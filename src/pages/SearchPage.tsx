import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Platform } from 'react-native'
import ContentRow from '../components/ContentRow'
import { contentAPI, Content, StreamingUrl } from '../services/api'

export default function SearchPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [allContent, setAllContent] = useState<Content[]>([])
  const [streamUrls, setStreamUrls] = useState<{ [contentId: string]: StreamingUrl[] }>({})
  const [loading, setLoading] = useState(true)

  const query = useMemo(() => new URLSearchParams(location.search).get('q')?.trim() || '', [location.search])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await contentAPI.getContent({ limit: 200 })
        const content = res.content || []
        setAllContent(content)
        const urlPromises = content.slice(0, 50).map(async (item) => {
          try {
            const s = await contentAPI.getStreamingUrls(item.contentId)
            return { id: item.contentId, urls: s.streaming }
          } catch {
            return { id: item.contentId, urls: [] as StreamingUrl[] }
          }
        })
        const results = await Promise.all(urlPromises)
        const map: { [id: string]: StreamingUrl[] } = {}
        results.forEach(r => map[r.id] = r.urls)
        setStreamUrls(map)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    if (!query) return allContent
    const q = query.toLowerCase()
    return allContent.filter(c =>
      (c.title || '').toLowerCase().includes(q) ||
      (c.genre || '').toLowerCase().includes(q) ||
      (c.language || '').toLowerCase().includes(q)
    )
  }, [query, allContent])

  if (Platform.OS !== 'web') return null

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: 'white' }}>
      <div style={{ paddingTop: 64, paddingInline: 16 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16 }}>Search Results{query ? ` for "${query}"` : ''}</h1>
        {loading ? (
          <div style={{ padding: 24 }}>Loading...</div>
        ) : (
          <ContentRow
            title={filtered.length ? `${filtered.length} results` : 'No results'}
            items={filtered}
            streamUrls={streamUrls}
            featured={false}
          />
        )}
      </div>
    </div>
  )
}




