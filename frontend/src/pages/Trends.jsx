import { useEffect, useState } from 'react'
import { TrendingUp, Loader2, Youtube, ExternalLink, Eye, ThumbsUp, MessageCircle, Download, Save } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { analysisApi, channelApi } from '../services/api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// DEBUG: Log API URL
console.log('[DEBUG] API_URL:', API_URL)

export default function Trends() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [keywords, setKeywords] = useState('')
  const [platforms, setPlatforms] = useState({
    YouTube: true,
    TikTok: true,
    Instagram: true,
  })
  const [downloadingReport, setDownloadingReport] = useState(false)
  const [lastRequest, setLastRequest] = useState(null)
  const [savingAnalysis, setSavingAnalysis] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveError, setSaveError] = useState('')
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('');

  useEffect(() => {
    if (user?.id) {
      channelApi.getChannels(user.id)
        .then(setChannels)
        .catch(err => console.error("Failed to fetch channels:", err));
    }
  }, [user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setResult(null)
    setSaveMessage('')
    setSaveError('')

    try {
      const selectedPlatforms = Object.keys(platforms).filter(p => platforms[p])
      const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k)

      if (keywordList.length === 0) {
        setError('キーワードを入力してください')
        setLoading(false)
        return
      }

      const response = await fetch(`${API_URL}/api/v1/trends/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          persona_keywords: keywordList,
          platforms: selectedPlatforms,
          max_results_per_platform: 10,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'トレンド分析に失敗しました')
      }

      const data = await response.json()
      setResult(data)

      // Save request for report generation
      setLastRequest({
        persona_keywords: keywordList,
        platforms: selectedPlatforms,
        max_results_per_platform: 10,
        channel_id: selectedChannel || null,
      })
    } catch (err) {
      setError(err.message || 'トレンド分析に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReport = async () => {
    if (!lastRequest) return

    setDownloadingReport(true)
    try {
      const response = await fetch(`${API_URL}/api/v1/reports/trends-markdown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lastRequest),
      })

      if (!response.ok) {
        throw new Error('レポート生成に失敗しました')
      }

      const markdown = await response.text()

      // Download as file
      const blob = new Blob([markdown], { type: 'text/markdown' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `トレンド分析レポート_${new Date().toISOString().split('T')[0]}.md`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err.message || 'レポートダウンロードに失敗しました')
    } finally {
      setDownloadingReport(false)
    }
  }

  const handleSaveAnalysis = async () => {
    if (!result || !lastRequest) return
    if (!user?.id) {
      setSaveError('保存するにはログインが必要です')
      return
    }

    setSaveError('')
    setSaveMessage('')
    setSavingAnalysis(true)

    try {
      const keywordSummary = lastRequest.persona_keywords?.slice(0, 3).join(' / ') || ''
      const platformSummary = lastRequest.platforms?.join(', ') || ''
      const summaryParts = [keywordSummary, platformSummary].filter(Boolean)

      await analysisApi.saveRun(user.id, {
        analysis_type: 'trends',
        keywords: lastRequest.persona_keywords || [],
        platforms: lastRequest.platforms || [],
        summary: summaryParts.join(' | ') || 'トレンド分析',
        channel_id: lastRequest.channel_id || null,
        meta: lastRequest,
        result,
      })

      setSaveMessage('分析結果を保存しました。')
    } catch (err) {
      setSaveError(err.message || '分析結果の保存に失敗しました')
    } finally {
      setSavingAnalysis(false)
    }
  }

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'YouTube':
        return <Youtube className="h-5 w-5" />
      case 'TikTok':
        return <Hash className="h-5 w-5" />
      case 'Instagram':
        return <Instagram className="h-5 w-5" />
      default:
        return <TrendingUp className="h-5 w-5" />
    }
  }

  const getPlatformColor = (platform) => {
    switch (platform) {
      case 'YouTube':
        return 'bg-red-500'
      case 'TikTok':
        return 'bg-black'
      case 'Instagram':
        return 'bg-pink-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <TrendingUp className="h-8 w-8 mr-3 text-green-500" />
          トレンド動画分析
        </h1>
        <p className="mt-2 text-gray-600">
          キーワードを入力して、各プラットフォームのトレンドショート動画を分析します
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">分析条件</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  キーワード（カンマ区切り）*
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="例: 副業, ビジネス, スキルアップ"
                />
                <p className="mt-1 text-xs text-gray-500">
                  ペルソナに関連するキーワードを入力
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  分析プラットフォーム *
                </label>
                <div className="space-y-2">
                  {Object.keys(platforms).map((platform) => (
                    <label key={platform} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={platforms[platform]}
                        onChange={(e) =>
                          setPlatforms({ ...platforms, [platform]: e.target.checked })
                        }
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-gray-700">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  チャンネル（任意）
                </label>
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">チャンネルを選択...</option>
                  {channels.map(channel => (
                    <option key={channel.id} value={channel.id}>{channel.channel_name}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  分析を特定のチャンネルに紐付ける場合に選択します。
                </p>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    分析中...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-5 w-5 mr-2" />
                    トレンド分析
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {result && (
            <>
              {/* Download Report Button */}
              <div className="flex flex-wrap justify-end gap-3 mb-4">
                <button
                  onClick={handleSaveAnalysis}
                  disabled={savingAnalysis}
                  className="flex items-center px-4 py-2 bg-emerald-700 text-white rounded-md hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:bg-gray-400"
                >
                  {savingAnalysis ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      この分析を保存
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownloadReport}
                  disabled={downloadingReport}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400"
                >
                  {downloadingReport ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      レポートをダウンロード
                    </>
                  )}
                </button>
              </div>

              {(saveMessage || saveError) && (
                <div
                  className={`rounded-md px-4 py-2 text-sm ${
                    saveError
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {saveError || saveMessage}
                </div>
              )}

              {/* Overall Insights */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  総合分析
                </h2>
                <ul className="space-y-2">
                  {result.overall_insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-green-500 text-white text-xs font-bold mr-3">
                        {idx + 1}
                      </span>
                      <span className="text-gray-800">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Platform Trends */}
              {result.platforms.map((platformData) => (
                <div key={platformData.platform} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className={`${getPlatformColor(platformData.platform)} p-2 rounded-lg text-white mr-3`}>
                        {getPlatformIcon(platformData.platform)}
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          {platformData.platform}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {platformData.videos.length}本 • 合計{formatNumber(platformData.total_views)}再生
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Platform Insights */}
                  <div className="mb-6 bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      このプラットフォームの傾向
                    </h3>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {platformData.insights.map((insight, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Videos */}
                  <div className="space-y-4">
                    {platformData.videos.map((video, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900 flex-1">
                            {video.title}
                          </h3>
                          {video.url && (
                            <a
                              href={video.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                            >
                              YouTube で見る
                            </a>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mb-3">{video.channel_name}</p>

                        <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                          <div className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            {formatNumber(video.view_count)}
                          </div>
                          {video.like_count && (
                            <div className="flex items-center">
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              {formatNumber(video.like_count)}
                            </div>
                          )}
                          {video.comment_count && (
                            <div className="flex items-center">
                              <MessageCircle className="h-4 w-4 mr-1" />
                              {formatNumber(video.comment_count)}
                            </div>
                          )}
                        </div>

                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-3">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">トレンド理由: </span>
                            {video.why_trending}
                          </p>
                        </div>

                        {video.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {video.tags.slice(0, 5).map((tag, tagIdx) => (
                              <span
                                key={tagIdx}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {!result && !loading && (
            <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                左のフォームにキーワードを入力して、トレンド分析を開始してください
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
