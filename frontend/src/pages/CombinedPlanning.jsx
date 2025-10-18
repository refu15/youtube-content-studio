import { useState } from 'react'
import { Sparkles, Loader2, Download, Calendar, Target, TrendingUp } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function CombinedPlanning() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const [formData, setFormData] = useState({
    // Trend analysis params
    trendKeywords: '',
    platforms: {
      YouTube: true,
      TikTok: true,
      Instagram: true,
    },

    // Viral video params
    viralKeywords: '',
    minViralRatio: 3,
    maxSubscribers: 100000,

    // Channel info
    channelGenre: '',
    channelName: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setResult(null)

    try {
      const trendKeywordList = formData.trendKeywords.split(',').map(k => k.trim()).filter(k => k)
      const viralKeywordList = formData.viralKeywords.split(',').map(k => k.trim()).filter(k => k)
      const selectedPlatforms = Object.keys(formData.platforms).filter(p => formData.platforms[p])

      if (trendKeywordList.length === 0 || viralKeywordList.length === 0) {
        setError('トレンドとバイラルの両方のキーワードを入力してください')
        setLoading(false)
        return
      }

      if (!formData.channelGenre) {
        setError('チャンネルジャンルを入力してください')
        setLoading(false)
        return
      }

      const response = await fetch(`${API_URL}/api/v1/reports/combined-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trends_request: {
            persona_keywords: trendKeywordList,
            platforms: selectedPlatforms,
            max_results_per_platform: 10,
          },
          viral_request: {
            keywords: viralKeywordList,
            min_viral_ratio: parseFloat(formData.minViralRatio),
            max_subscribers: parseInt(formData.maxSubscribers),
            platforms: ['YouTube'],
            max_results: 20,
          },
          channel_genre: formData.channelGenre,
          channel_name: formData.channelName || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || '企画案生成に失敗しました')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err.message || '企画案生成に失敗しました')
    } finally {
      setLoading(false)
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
          <Sparkles className="h-8 w-8 mr-3 text-purple-500" />
          トレンド×バイラル 統合企画案
        </h1>
        <p className="mt-2 text-gray-600">
          トレンド分析とバイラル動画の調査結果を組み合わせて、戦略的な企画案を自動生成します
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">分析条件</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Trend Analysis Section */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">トレンド分析</h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    キーワード（カンマ区切り）*
                  </label>
                  <input
                    type="text"
                    value={formData.trendKeywords}
                    onChange={(e) => setFormData({ ...formData, trendKeywords: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="例: 副業, ビジネス"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    プラットフォーム
                  </label>
                  <div className="space-y-2">
                    {Object.keys(formData.platforms).map((platform) => (
                      <label key={platform} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.platforms[platform]}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              platforms: { ...formData.platforms, [platform]: e.target.checked },
                            })
                          }
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{platform}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Viral Video Section */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">バイラル動画検索</h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    キーワード（カンマ区切り）*
                  </label>
                  <input
                    type="text"
                    value={formData.viralKeywords}
                    onChange={(e) => setFormData({ ...formData, viralKeywords: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="例: 起業, フリーランス"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    最小バイラル比率: {formData.minViralRatio}倍
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={formData.minViralRatio}
                    onChange={(e) => setFormData({ ...formData, minViralRatio: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    最大登録者数: {formatNumber(formData.maxSubscribers)}
                  </label>
                  <input
                    type="range"
                    min="10000"
                    max="500000"
                    step="10000"
                    value={formData.maxSubscribers}
                    onChange={(e) => setFormData({ ...formData, maxSubscribers: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Channel Info Section */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">チャンネル情報</h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    チャンネルジャンル *
                  </label>
                  <input
                    type="text"
                    value={formData.channelGenre}
                    onChange={(e) => setFormData({ ...formData, channelGenre: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="例: ビジネス / 教育"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    チャンネル名（任意）
                  </label>
                  <input
                    type="text"
                    value={formData.channelName}
                    onChange={(e) => setFormData({ ...formData, channelName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="例: ビジネスマインドTV"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    分析中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    統合企画案を生成
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
              {/* Strategy */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="h-6 w-6 mr-2 text-purple-600" />
                  チャンネル戦略
                </h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">コンセプト</h3>
                    <p className="text-gray-900">{result.strategy.channel_concept}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">独自の価値</h3>
                    <p className="text-gray-900">{result.strategy.unique_value}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">ターゲット視聴者</h3>
                    <p className="text-gray-900">{result.strategy.target_audience}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">コンテンツの柱</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-900">
                      {result.strategy.content_pillars.map((pillar, idx) => (
                        <li key={idx}>{pillar}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">投稿頻度</h3>
                    <p className="text-gray-900">{result.strategy.posting_frequency}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">成長戦略</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-900">
                      {result.strategy.growth_strategy.map((strategy, idx) => (
                        <li key={idx}>{strategy}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Content Calendar */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="h-6 w-6 mr-2 text-purple-600" />
                  4週間コンテンツカレンダー
                </h2>

                <div className="space-y-6">
                  {result.calendar.map((week) => (
                    <div key={week.week} className="border-l-4 border-purple-500 pl-4">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        第{week.week}週: {week.theme}
                      </h3>
                      <div className="space-y-3">
                        {week.videos.map((video, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded">
                            <h4 className="font-medium text-gray-900">{video.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{video.description}</p>
                            <div className="mt-2 text-xs text-gray-500">
                              推奨尺: {video.estimated_length}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Initial Video Concepts */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="h-6 w-6 mr-2 text-purple-600" />
                  初期動画コンセプト
                </h2>

                <div className="space-y-4">
                  {result.strategy.video_concepts.map((video, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900">{video.title}</h3>
                      <p className="text-sm text-gray-600 mt-2">{video.description}</p>
                      <div className="mt-3">
                        <h4 className="text-xs font-medium text-gray-700 mb-1">冒頭フック:</h4>
                        <p className="text-sm text-gray-900">{video.hook}</p>
                      </div>
                      <div className="mt-3">
                        <h4 className="text-xs font-medium text-gray-700 mb-1">主要ポイント:</h4>
                        <ul className="list-disc list-inside text-sm text-gray-900">
                          {video.key_points.map((point, pidx) => (
                            <li key={pidx}>{point}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
                        <span>CTA: {video.cta}</span>
                        <span>推奨尺: {video.estimated_length}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {!result && !loading && (
            <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                左のフォームに情報を入力して、統合企画案を生成してください
              </p>
              <p className="text-sm text-gray-400">
                トレンド分析とバイラル動画の洞察を組み合わせた戦略的な企画案を自動生成します
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
