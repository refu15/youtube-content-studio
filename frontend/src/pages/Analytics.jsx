import { useState } from 'react'
import { BarChart3, Loader2, Upload, FileText, TrendingUp, Target, Lightbulb, CheckCircle, Download } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Analytics() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [file, setFile] = useState(null)
  const [downloadingReport, setDownloadingReport] = useState(false)
  const [lastFile, setLastFile] = useState(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('CSVファイルのみアップロード可能です')
        return
      }
      setFile(selectedFile)
      setError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!file) {
      setError('CSVファイルを選択してください')
      return
    }

    setError('')
    setLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${API_URL}/api/v1/analytics/analyze-csv`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'CSV分析に失敗しました')
      }

      const data = await response.json()
      setResult(data)

      // Save file for report generation
      setLastFile(file)
    } catch (err) {
      setError(err.message || 'CSV分析に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReport = async () => {
    if (!lastFile) return

    setDownloadingReport(true)
    try {
      const formData = new FormData()
      formData.append('file', lastFile)

      const response = await fetch(`${API_URL}/api/v1/reports/analytics-markdown`, {
        method: 'POST',
        body: formData,
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
      a.download = `アナリティクスレポート_${new Date().toISOString().split('T')[0]}.md`
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

  const formatNumber = (num) => {
    return num.toLocaleString('ja-JP')
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case '高':
        return 'bg-red-100 text-red-800 border-red-300'
      case '中':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case '低':
        return 'bg-green-100 text-green-800 border-green-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <BarChart3 className="h-8 w-8 mr-3 text-blue-500" />
          CSV分析レポート
        </h1>
        <p className="mt-2 text-gray-600">
          YouTubeアナリティクスのCSVをアップロードして、AIによる分析と改善提案を取得します
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">CSVアップロード</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  YouTubeアナリティクスCSV
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                      >
                        <span>ファイルを選択</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept=".csv"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">またはドラッグ&ドロップ</p>
                    </div>
                    <p className="text-xs text-gray-500">CSVファイルのみ</p>
                  </div>
                </div>
                {file && (
                  <div className="mt-2 flex items-center text-sm text-gray-600">
                    <FileText className="h-4 w-4 mr-2" />
                    {file.name}
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">
                  CSVの取得方法
                </h3>
                <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                  <li>YouTube Studioにアクセス</li>
                  <li>左メニューから「アナリティクス」を選択</li>
                  <li>「詳細」タブをクリック</li>
                  <li>右上の「エクスポート」→「CSV」を選択</li>
                </ol>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !file}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    分析中...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-5 w-5 mr-2" />
                    分析開始
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
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleDownloadReport}
                  disabled={downloadingReport}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
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

              {/* Channel Metrics */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  チャンネル全体のメトリクス
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">総再生回数</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatNumber(result.channel_metrics.total_views)}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">総視聴時間</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatNumber(result.channel_metrics.total_watch_time_hours)}h
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">平均視聴時間</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {Math.round(result.channel_metrics.average_view_duration_seconds)}s
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">分析動画数</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {result.channel_metrics.total_videos_analyzed}本
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 col-span-2">
                    <div className="text-sm text-gray-600 mb-1">期間</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {result.channel_metrics.date_range}
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Performers */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="h-6 w-6 mr-2 text-blue-600" />
                  トップパフォーマンス動画
                </h2>
                <div className="space-y-4">
                  {result.top_performers.map((performer, idx) => (
                    <div key={idx} className="bg-blue-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{performer.title}</h3>
                        <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                          {performer.metric_name}
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600 mb-2">
                        {formatNumber(Math.round(performer.metric_value))}
                        {performer.metric_name === 'クリック率' ? '%' : ''}
                      </div>
                      <p className="text-sm text-gray-700">{performer.why_successful}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Insights */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="h-6 w-6 mr-2 text-blue-600" />
                  重要な洞察と推奨事項
                </h2>
                <div className="space-y-4">
                  {result.insights.map((insight, idx) => (
                    <div key={idx} className="border-l-4 border-blue-500 bg-gray-50 p-4 rounded">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-700 mr-2">
                            {insight.category}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(insight.priority)}`}>
                            優先度: {insight.priority}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">発見:</span>
                          <span className="ml-2 text-gray-600">{insight.finding}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">推奨:</span>
                          <span className="ml-2 text-gray-600">{insight.recommendation}</span>
                        </div>
                        <div className="bg-green-50 p-2 rounded">
                          <span className="font-medium text-green-700">期待効果:</span>
                          <span className="ml-2 text-green-600">{insight.expected_impact}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content Recommendations */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Lightbulb className="h-6 w-6 mr-2 text-blue-600" />
                  コンテンツ戦略の推奨
                </h2>
                <ul className="space-y-2">
                  {result.content_recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold mr-3 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Optimization Tips */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  最適化のヒント
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.optimization_tips.map((tip, idx) => (
                    <div key={idx} className="flex items-start bg-gray-50 p-3 rounded">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Actions */}
              <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-green-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  次に取るべきアクション
                </h2>
                <ol className="space-y-2 list-decimal list-inside">
                  {result.next_actions.map((action, idx) => (
                    <li key={idx} className="text-gray-800 font-medium">
                      {action}
                    </li>
                  ))}
                </ol>
              </div>
            </>
          )}

          {!result && !loading && (
            <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                YouTubeアナリティクスのCSVファイルをアップロードしてください
              </p>
              <p className="text-sm text-gray-400">
                AIがデータを分析し、改善提案を生成します
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
