import { useState } from 'react'
import { Lightbulb, Loader2, Download, Calendar, Target, TrendingUp } from 'lucide-react'
import { planningApi } from '../services/api'

export default function Planning() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [downloadingReport, setDownloadingReport] = useState(false)
  const [lastRequest, setLastRequest] = useState(null)

  const [formData, setFormData] = useState({
    channel_name: '',
    channel_genre: '',
    persona: {
      age_range: '',
      gender: '',
      interests: '',
      pain_points: '',
      goals: '',
      content_preferences: '',
    },
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('persona.')) {
      const personaField = name.split('.')[1]
      setFormData((prev) => ({
        ...prev,
        persona: {
          ...prev.persona,
          [personaField]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setResult(null)

    try {
      // Convert comma-separated strings to arrays
      const requestData = {
        channel_name: formData.channel_name || null,
        channel_genre: formData.channel_genre,
        persona: {
          age_range: formData.persona.age_range,
          gender: formData.persona.gender,
          interests: formData.persona.interests.split(',').map((s) => s.trim()),
          pain_points: formData.persona.pain_points.split(',').map((s) => s.trim()),
          goals: formData.persona.goals.split(',').map((s) => s.trim()),
          content_preferences: formData.persona.content_preferences,
        },
      }

      const plan = await planningApi.generateFullPlan(requestData)
      setResult(plan)

      // Save request for report generation
      setLastRequest(requestData)
    } catch (err) {
      setError(err.message || '企画案生成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReport = async () => {
    if (!lastRequest) return

    setDownloadingReport(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/reports/planning-markdown`, {
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
      a.download = `企画案レポート_${new Date().toISOString().split('T')[0]}.md`
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Lightbulb className="h-8 w-8 mr-3 text-yellow-500" />
          AI企画案生成
        </h1>
        <p className="mt-2 text-gray-600">
          ペルソナとジャンルを入力して、戦略的なYouTubeチャンネル企画案を生成します
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">企画情報入力</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Channel Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                チャンネル名（任意）
              </label>
              <input
                type="text"
                name="channel_name"
                value={formData.channel_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="例: ビジネスマインドTV"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                チャンネルジャンル *
              </label>
              <input
                type="text"
                name="channel_genre"
                value={formData.channel_genre}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="例: ビジネス / 教育 / エンタメ"
              />
            </div>

            {/* Persona Info */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">ペルソナ情報</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    年齢層 *
                  </label>
                  <input
                    type="text"
                    name="persona.age_range"
                    value={formData.persona.age_range}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="例: 20-30代"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    性別 *
                  </label>
                  <input
                    type="text"
                    name="persona.gender"
                    value={formData.persona.gender}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="例: 男性 / 女性 / 全性別"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    興味関心（カンマ区切り）*
                  </label>
                  <input
                    type="text"
                    name="persona.interests"
                    value={formData.persona.interests}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="例: ビジネス, 自己啓発, 副業"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    悩み・課題（カンマ区切り）*
                  </label>
                  <input
                    type="text"
                    name="persona.pain_points"
                    value={formData.persona.pain_points}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="例: 時間がない, 給料が低い, スキル不足"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    目標（カンマ区切り）*
                  </label>
                  <input
                    type="text"
                    name="persona.goals"
                    value={formData.persona.goals}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="例: 副業で稼ぐ, スキルアップ, 転職"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    コンテンツの好み *
                  </label>
                  <input
                    type="text"
                    name="persona.content_preferences"
                    value={formData.persona.content_preferences}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="例: 短くて実践的な動画"
                  />
                </div>
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
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  生成中...
                </>
              ) : (
                <>
                  <Lightbulb className="h-5 w-5 mr-2" />
                  企画案を生成
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {result && (
            <>
              {/* Download Report Button */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleDownloadReport}
                  disabled={downloadingReport}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-400"
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

              {/* Strategy */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Target className="h-6 w-6 mr-2 text-red-600" />
                    チャンネル戦略
                  </h2>
                </div>

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
                  <Calendar className="h-6 w-6 mr-2 text-red-600" />
                  4週間コンテンツカレンダー
                </h2>

                <div className="space-y-6">
                  {result.calendar.map((week) => (
                    <div key={week.week} className="border-l-4 border-red-500 pl-4">
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
                  <TrendingUp className="h-6 w-6 mr-2 text-red-600" />
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
              <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                左のフォームに情報を入力して、AI企画案を生成してください
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
