import { useState } from 'react'
import { Zap, Loader2, ExternalLink, Eye, ThumbsUp, MessageCircle, Users, TrendingUp, Download, Save } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { analysisApi, channelApi } from '../services/api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function ViralFinder() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [keywords, setKeywords] = useState('')
  const [minViralRatio, setMinViralRatio] = useState(3)
  const [maxSubscribers, setMaxSubscribers] = useState(100000)
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
      const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k)

      if (keywordList.length === 0) {
        setError('キーワードを入力してください')
        setLoading(false)
        return
      }

      const response = await fetch(`${API_URL}/api/v1/viral/find`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: keywordList,
          min_viral_ratio: parseFloat(minViralRatio),
          max_subscribers: parseInt(maxSubscribers),
          platforms: ['YouTube'],
          max_results: 20,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'バイラル動画検索に失敗しました')
      }

      const data = await response.json()
      setResult(data)

      // Save request for report generation
      setLastRequest({
        keywords: keywordList,
        min_viral_ratio: parseFloat(minViralRatio),
        max_subscribers: parseInt(maxSubscribers),
        platforms: ['YouTube'],
        max_results: 20,
        channel_id: selectedChannel || null,
      })
    } catch (err) {
      setError(err.message || 'バイラル動画検索に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReport = async () => {
    if (!lastRequest) return

    setDownloadingReport(true)
    try {
      const response = await fetch(`${API_URL}/api/v1/reports/viral-markdown`, {
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
      a.download = `バイラル動画レポート_${new Date().toISOString().split('T')[0]}.md`
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
      const requestKeywords = lastRequest.keywords || lastRequest.persona_keywords || []
      const keywordSummary = Array.isArray(requestKeywords)
        ? requestKeywords.slice(0, 3).join(' / ')
        : ''
      const summaryParts = []
      if (keywordSummary) summaryParts.push(keywordSummary)

      if (Array.isArray(result?.videos) && result.videos.length > 0) {
        const highestRatio = result.videos.reduce((max, video) => {
          if (typeof video?.viral_ratio !== 'number') {
            return max
          }
          return Math.max(max, video.viral_ratio)
        }, 0)

        if (highestRatio > 0) {
          summaryParts.push(`最高比率 ${highestRatio.toFixed(1)}x`)
        }
      }

      await analysisApi.saveRun(user.id, {
        analysis_type: 'viral',
        keywords: Array.isArray(requestKeywords) ? requestKeywords : [],
        platforms: lastRequest.platforms || ['YouTube'],
        summary: summaryParts.length > 0 ? summaryParts.join(' | ') : 'バイラル分析',
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
          <Zap className="h-8 w-8 mr-3 text-yellow-500" />
          バイラル動画発見ツール
        </h1>
        <p className="mt-2 text-gray-600">
          登録者数が少ないのに再生数が多い「バイラルポテンシャル」のある動画を発見します
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">検索条件</h2>

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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="例: 副業, ビジネス, スキルアップ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最小バイラル比率: {minViralRatio}倍
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={minViralRatio}
                  onChange={(e) => setMinViralRatio(e.target.value)}
                  className="w-full"
                />
                <p className="mt-1 text-xs text-gray-500">
                  再生数 ÷ 登録者数
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最大登録者数: {formatNumber(maxSubscribers)}
                </label>
                <input
                  type="range"
                  min="10000"
                  max="500000"
                  step="10000"
                  value={maxSubscribers}
                  onChange={(e) => setMaxSubscribers(e.target.value)}
                  className="w-full"
                />
                <p className="mt-1 text-xs text-gray-500">
                  この人数以下のチャンネルを検索
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  チャンネル（任意）
                </label>
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:bg-gray-400"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    検索中...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-2" />
                    バイラル動画を検索
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
                  className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-400"
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
                  className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:bg-gray-400"
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

              {/* Content Strategies */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="h-6 w-6 mr-2 text-yellow-600" />
                  コンテンツ戦略の提案
                </h2>
                <ul className="space-y-2">
                  {result.content_strategies.map((strategy, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-yellow-500 text-white text-xs font-bold mr-3">
                        {idx + 1}
                      </span>
                      <span className="text-gray-800">{strategy}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {(saveMessage || saveError) && (
                <div
                  className={`rounded-md px-4 py-2 text-sm ${
                    saveError
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {saveError || saveMessage}
                </div>
              )}

              {/* Viral Patterns */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  バイラル動画の共通パターン
                </h2>
                <ul className="space-y-2 text-gray-700">
                  {result.insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-2 text-yellow-500">✓</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Viral Videos */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  バイラル動画一覧（{result.videos.length}件）
                </h2>

                <div className="space-y-4">
                  {result.videos.map((video, idx) => (
                    <div
                      key={idx}
                      className="border-2 border-yellow-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-yellow-50"
                    >
                      <div className="flex justify-between items-start mb-3">
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

                      {/* Viral Ratio Badge */}
                      <div className="inline-flex items-center bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold mb-3">
                        <Zap className="h-4 w-4 mr-1" />
                        バイラル比率: {video.viral_ratio}倍
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                        <div className="bg-white rounded p-2">
                          <div className="flex items-center text-gray-600 mb-1">
                            <Users className="h-4 w-4 mr-1" />
                            登録者数
                          </div>
                          <div className="font-semibold text-gray-900">
                            {formatNumber(video.subscriber_count)}
                          </div>
                        </div>
                        <div className="bg-white rounded p-2">
                          <div className="flex items-center text-gray-600 mb-1">
                            <Eye className="h-4 w-4 mr-1" />
                            再生回数
                          </div>
                          <div className="font-semibold text-gray-900">
                            {formatNumber(video.view_count)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
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

                      {/* Why Viral */}
                      <div className="bg-white border-l-4 border-yellow-500 p-3 mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          なぜバイラルになったか:
                        </p>
                        <p className="text-sm text-gray-600">{video.why_viral}</p>
                      </div>

                      {/* Key Takeaways */}
                      {video.key_takeaways.length > 0 && (
                        <div className="bg-white rounded p-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            学べるポイント:
                          </p>
                          <ul className="space-y-1 text-sm text-gray-600">
                            {video.key_takeaways.map((takeaway, tidx) => (
                              <li key={tidx} className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>{takeaway}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {!result && !loading && (
            <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                左のフォームにキーワードを入力して、バイラル動画を検索してください
              </p>
              <p className="text-sm text-gray-400">
                登録者数が少ないのに再生数が多い動画を見つけて、成功パターンを学びましょう
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
