import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  BarChart3,
  ExternalLink,
  Flame,
  Globe,
  History,
  ListChecks,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  Video,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { analysisApi, dashboardApi, statsApi } from '../services/api'

const initialPlatforms = {
  YouTube: true,
}

const platformDescriptions = {
  YouTube: 'ショート動画を含めた最新のトレンドを取得します。',
}

const metricIcons = {
  total_trending_videos: Video,
  total_views: BarChart3,
  avg_views: TrendingUp,
  active_platforms: Globe,
  top_viral_ratio: Flame,
  avg_viral_ratio: Flame,
}

const formatNumber = (value) =>
  new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 1 }).format(value)

export default function Dashboard() {
  const { user } = useAuth()
  const [keywords, setKeywords] = useState('ショート動画, エデュテインメント')
  const [channelGoal, setChannelGoal] = useState('')
  const [platforms, setPlatforms] = useState(initialPlatforms)
  const [includeViral, setIncludeViral] = useState(true)
  const [minViralRatio, setMinViralRatio] = useState(3)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [trendHistory, setTrendHistory] = useState([])
  const [viralHistory, setViralHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [analysisStats, setAnalysisStats] = useState(null)
  const [topKeywords, setTopKeywords] = useState([]);

  const formatHistoryDate = (isoString) => {
    try {
      return new Date(isoString).toLocaleString('ja-JP', {
        timeZone: 'Asia/Tokyo',
        hour12: false,
      })
    } catch {
      return isoString
    }
  }

  const lastUpdated = useMemo(() => {
    if (!data?.generated_at) return null
    try {
      return new Date(data.generated_at).toLocaleString('ja-JP', {
        timeZone: 'Asia/Tokyo',
        hour12: false,
      })
    } catch {
      return null
    }
  }, [data])

  useEffect(() => {
    if (!user?.id) {
      setTrendHistory([])
      setViralHistory([])
      setAnalysisStats(null)
      return
    }

    let cancelled = false

    const fetchHistory = async () => {
      setHistoryLoading(true)
      setHistoryError('')
      try {
        const [trendResponse, viralResponse, statsResponse, topKeywordsResponse] = await Promise.all([
          analysisApi.listRuns(user.id, { analysis_type: 'trends', limit: 3 }),
          analysisApi.listRuns(user.id, { analysis_type: 'viral', limit: 3 }),
          analysisApi.getStats(user.id),
          statsApi.getTopKeywords(user.id),
        ]);

        if (cancelled) return;

        setTrendHistory(trendResponse.items || []);
        setViralHistory(viralResponse.items || []);
        setAnalysisStats(statsResponse);
        setTopKeywords(topKeywordsResponse || []);
      } catch (err) {
        if (cancelled) return
        setHistoryError(err.message || '分析履歴の取得に失敗しました')
        setAnalysisStats(null)
      } finally {
        if (!cancelled) {
          setHistoryLoading(false)
        }
      }
    }

    fetchHistory()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  const handleTogglePlatform = (platform) => {
    setPlatforms((prev) => ({
      ...prev,
      [platform]: !prev[platform],
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const keywordList = keywords
        .split(/[\n,]/)
        .map((k) => k.trim())
        .filter(Boolean)

      if (keywordList.length === 0) {
        setError('少なくとも1つキーワードを入力してください。')
        setLoading(false)
        return
      }

      const selectedPlatforms = Object.entries(platforms)
        .filter(([, enabled]) => enabled)
        .map(([name]) => name)

      if (selectedPlatforms.length === 0) {
        setError('分析するプラットフォームを選択してください。')
        setLoading(false)
        return
      }

      const payload = {
        persona_keywords: keywordList,
        channel_goal: channelGoal.trim() ? channelGoal.trim() : null,
        platforms: selectedPlatforms,
        include_viral: includeViral,
      }

      if (includeViral) {
        const ratioValue = Number(minViralRatio)
        payload.min_viral_ratio = Number.isFinite(ratioValue) && ratioValue > 0 ? ratioValue : 3
      }

      const response = await dashboardApi.getOverview(payload)
      setData(response)
    } catch (err) {
      console.error('Dashboard overview error:', err)
      setError(err.message || 'ダッシュボードの生成に失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <div className="flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-red-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
            <p className="mt-1 text-gray-600">
              トレンド・バイラルの両面からチャンネルの次の一手を設計しましょう。
            </p>
          </div>
        </div>
        {lastUpdated && (
          <p className="mt-4 inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
            最終更新: {lastUpdated}
          </p>
        )}
      </div>

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ペルソナ・キーワード <span className="text-red-500">*</span>
            </label>
            <textarea
              value={keywords}
              onChange={(event) => setKeywords(event.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
              placeholder="例: ショート動画, エデュテインメント, 20代女性"
            />
            <p className="mt-2 text-xs text-gray-500">
              カンマまたは改行で区切って複数のキーワードを入力できます。
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              チャンネルの目標（任意）
            </label>
            <input
              type="text"
              value={channelGoal}
              onChange={(event) => setChannelGoal(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
              placeholder="例: 半年で登録者を2万人まで伸ばす"
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700 mb-3">分析プラットフォーム</span>
            <div className="grid gap-3 md:grid-cols-3">
              {Object.keys(platforms).map((platform) => (
                <button
                  type="button"
                  key={platform}
                  onClick={() => handleTogglePlatform(platform)}
                  className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                    platforms[platform]
                      ? 'border-red-400 bg-red-50 text-red-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{platform}</span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        platforms[platform] ? 'bg-red-500' : 'bg-gray-300'
                      }`}
                    />
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-gray-500">
                    {platformDescriptions[platform]}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowAdvanced((prev) => !prev)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {showAdvanced ? '▲' : '▼'} 詳細設定を{showAdvanced ? '隠す' : '表示'}
            </button>

            {showAdvanced && (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={includeViral}
                    onChange={(event) => setIncludeViral(event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">バイラル分析も合わせて実行する</span>
                </label>

                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600 whitespace-nowrap">最小バイラル比率</label>
                  <input
                    type="number"
                    min={1}
                    step={0.5}
                    value={minViralRatio}
                    onChange={(event) => setMinViralRatio(event.target.value)}
                    disabled={!includeViral}
                    className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:bg-gray-100"
                  />
                  <span className="text-xs text-gray-500">再生数 ÷ 登録者数</span>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  ダッシュボードを更新
                </>
              )}
            </button>
            <span className="text-xs text-gray-500">
              Gemini と YouTube Data API を活用して、最新のデータをまとめます。
            </span>
          </div>
        </form>
      </section>

      {loading && (
        <div className="flex justify-center">
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin text-red-500" />
            分析を実行中です。1〜2分ほどかかる場合があります。
          </div>
        </div>
      )}

      {!data && !loading && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">ダッシュボードの活用例</h2>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              <li>• トレンドとバイラルの両面から企画案を検討できます。</li>
              <li>• プラットフォーム別の傾向を把握し優先順位を決められます。</li>
              <li>• 生成された示唆をそのまま企画書や台本の草案に転用できます。</li>
            </ul>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-red-50 via-white to-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">次のステップ</h2>
            <p className="mt-2 text-sm text-gray-600">
              ペルソナ像を入力して「ダッシュボードを更新」を押すと、最適な動画戦略に必要な要素がまとめて表示されます。
            </p>
          </div>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-10">
          {/* Quick Metrics */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900">主要指標</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.quick_metrics.map((metric) => {
                const Icon = metricIcons[metric.id] || BarChart3
                return (
                  <div
                    key={metric.id}
                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                      <span className="rounded-full bg-red-50 p-2 text-red-500">
                        <Icon className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-gray-900">{metric.value}</p>
                    {metric.delta && (
                      <p className="mt-1 text-xs font-medium text-red-600">{metric.delta}</p>
                    )}
                    {metric.context && (
                      <p className="mt-3 text-xs leading-relaxed text-gray-500">{metric.context}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* Trending highlights */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900">トレンドのハイライト</h2>
            </div>

            {data.trending.top_video && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-6 shadow-sm">
                <p className="text-xs font-medium text-red-600">最注目ショート</p>
                <h3 className="mt-2 text-lg font-semibold text-gray-900">
                  {data.trending.top_video.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {data.trending.top_video.channel_name} ／ {data.trending.top_video.platform}
                </p>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-600">
                  <span>再生数: {formatNumber(data.trending.top_video.view_count)}</span>
                  {data.trending.top_video.like_count && (
                    <span>高評価: {formatNumber(data.trending.top_video.like_count)}</span>
                  )}
                  {data.trending.top_video.comment_count && (
                    <span>コメント: {formatNumber(data.trending.top_video.comment_count)}</span>
                  )}
                </div>
                {data.trending.top_video.why_trending && (
                  <p className="mt-3 text-sm text-gray-700">
                    {data.trending.top_video.why_trending}
                  </p>
                )}
                {data.trending.top_video.url && (
                  <a
                    href={data.trending.top_video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    動画を開く
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}

            {data.trending.overall_insights.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">全体傾向</h3>
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  {data.trending.overall_insights.map((insight, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="mt-1 text-xs font-semibold text-red-500">●</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.trending.top_tags.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900">頻出ハッシュタグ</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.trending.top_tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
                    >
                      {tag.startsWith('#') ? tag : `#${tag}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              {data.trending.platform_summaries.map((platform) => (
                <div
                  key={platform.platform}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{platform.platform}</h3>
                      <p className="text-sm text-gray-500">
                        {platform.total_videos}本 / 合計 {formatNumber(platform.total_views)} 再生
                      </p>
                    </div>
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-500">
                      平均 {formatNumber(platform.average_views)} 再生
                    </span>
                  </div>

                  {platform.insights.length > 0 && (
                    <ul className="mt-4 space-y-2 text-sm text-gray-600">
                      {platform.insights.map((insight, index) => (
                        <li key={index} className="flex gap-2">
                          <span className="mt-1 text-xs text-red-400">•</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {platform.top_videos.length > 0 && (
                    <div className="mt-5 space-y-3">
                      {platform.top_videos.map((video, index) => (
                        <div key={video.video_id || index} className="rounded-lg border border-gray-200 p-4">
                          <p className="text-sm font-semibold text-gray-900">{video.title}</p>
                          <p className="mt-1 text-xs text-gray-500">{video.channel_name}</p>
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                            <span>再生 {formatNumber(video.view_count)}</span>
                            {video.like_count && <span>高評価 {formatNumber(video.like_count)}</span>}
                            {video.comment_count && (
                              <span>コメント {formatNumber(video.comment_count)}</span>
                            )}
                          </div>
                          {video.url && (
                            <a
                              href={video.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                            >
                              視聴する
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Viral highlights */}
          {data.viral && (
            <section className="space-y-6">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-red-500" />
                <h2 className="text-xl font-semibold text-gray-900">バイラルのチャンス</h2>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {data.viral.videos.slice(0, 3).map((video, index) => (
                  <div
                    key={video.video_id || index}
                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <p className="text-xs font-medium text-red-500">バイラル比率 {video.viral_ratio.toFixed(1)}x</p>
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">{video.title}</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {video.channel_name} ／ 登録者 {formatNumber(video.subscriber_count)} 人
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                      <span>再生 {formatNumber(video.view_count)}</span>
                      {video.like_count && <span>高評価 {formatNumber(video.like_count)}</span>}
                    </div>
                    {video.why_viral && (
                      <p className="mt-3 text-xs text-gray-700">{video.why_viral}</p>
                    )}
                    {video.url && (
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        動画を開く
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>

              {data.viral.insights.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900">バイラル動画の共通パターン</h3>
                  <ul className="mt-3 space-y-2 text-sm text-gray-700">
                    {data.viral.insights.map((insight, index) => (
                      <li key={index} className="flex gap-2">
                        <span className="mt-1 text-xs text-red-400">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {data.viral.content_strategies.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900">実行すべきコンテンツ戦略</h3>
                  <ul className="mt-3 space-y-2 text-sm text-gray-700">
                    {data.viral.content_strategies.map((strategy, index) => (
                      <li key={index} className="flex gap-2">
                        <span className="mt-1 text-xs text-red-400">•</span>
                        <span>{strategy}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Recommended actions */}
          {data.recommended_actions.length > 0 && (
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-red-500" />
                <h2 className="text-lg font-semibold text-gray-900">今すぐ取り組めるアクション</h2>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-gray-700">
                {data.recommended_actions.map((action, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="mt-1 text-xs text-red-400">✓</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">保存した分析</h2>
          </div>
          {historyLoading && (
            <span className="inline-flex items-center text-xs text-gray-500">
              <Loader2 className="mr-2 h-3 w-3 animate-spin text-gray-400" />
              最新の履歴を読み込み中
            </span>
          )}
        </div>

        {historyError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {historyError}
          </div>
        )}

        {analysisStats && !historyError && (
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">保存済み分析</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">
                {Number(analysisStats.total_runs ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">トレンド・バイラル全体の合計件数</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">トレンド分析</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">
                {Number(analysisStats.trends_runs ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">保存されたトレンド分析の件数</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">バイラル分析</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">
                {Number(analysisStats.viral_runs ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">保存されたバイラル分析の件数</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">発見したバイラル動画</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">
                {Number(analysisStats.viral_videos ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">保存済みバイラル分析に含まれる動画数</p>
            </div>
          </div>
        )}

        {topKeywords.length > 0 && (
          <div className="rounded-lg border border-gray-200 p-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">よく使うキーワード</h3>
            <div className="flex flex-wrap gap-2">
              {topKeywords.map(kw => (
                <span key={kw.keyword} className="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">
                  {kw.keyword} ({kw.count})
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">トレンド分析</p>
              <Link to="/trends" className="text-xs text-red-500 hover:text-red-600">
                詳細を見る
              </Link>
            </div>
            {trendHistory.length === 0 ? (
              <p className="text-sm text-gray-500">まだ保存されたトレンド分析はありません。</p>
            ) : (
              <ul className="space-y-3">
                {trendHistory.map((item) => (
                  <li key={item.id} className="rounded-md border border-gray-200 p-3">
                    <p className="text-xs text-gray-400">{formatHistoryDate(item.created_at)}</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {item.summary || '保存したトレンド分析'}
                    </p>
                    {item.keywords?.length > 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        {item.keywords.slice(0, 3).join(' / ')}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">バイラル分析</p>
              <Link to="/viral" className="text-xs text-red-500 hover:text-red-600">
                詳細を見る
              </Link>
            </div>
            {viralHistory.length === 0 ? (
              <p className="text-sm text-gray-500">まだ保存されたバイラル分析はありません。</p>
            ) : (
              <ul className="space-y-3">
                {viralHistory.map((item) => (
                  <li key={item.id} className="rounded-md border border-gray-200 p-3">
                    <p className="text-xs text-gray-400">{formatHistoryDate(item.created_at)}</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {item.summary || '保存したバイラル分析'}
                    </p>
                    {item.keywords?.length > 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        {item.keywords.slice(0, 3).join(' / ')}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link
          to="/planning"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-red-300 hover:shadow"
        >
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-red-500" />
            <h3 className="font-semibold text-gray-900">AI企画案生成</h3>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            ダッシュボードの示唆をもとに、チャンネル戦略と動画案を一括で作成します。
          </p>
        </Link>

        <Link
          to="/trends"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-red-300 hover:shadow"
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-red-500" />
            <h3 className="font-semibold text-gray-900">詳細トレンド分析</h3>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            さらに深掘りしたいテーマがあれば、プラットフォームごとの詳細レポートを確認。
          </p>
        </Link>

        <Link
          to="/analytics"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-red-300 hover:shadow"
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-red-500" />
            <h3 className="font-semibold text-gray-900">CSVアップロード分析</h3>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            過去のYouTube Analyticsデータをアップロードして、定量的な改善点を洗い出します。
          </p>
        </Link>
      </section>
    </div>
  )
}
