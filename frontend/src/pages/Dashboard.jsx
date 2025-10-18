import { Video, Lightbulb, TrendingUp, BarChart3 } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const features = [
    {
      name: 'AI企画案生成',
      description: 'ペルソナを入力して、戦略的なYouTubeチャンネル企画案を生成',
      icon: Lightbulb,
      href: '/planning',
      color: 'bg-yellow-500',
    },
    {
      name: 'トレンド分析',
      description: '直近3ヶ月のショート動画トレンドを分析（YouTube/TikTok/Instagram）',
      icon: TrendingUp,
      href: '/trends',
      color: 'bg-green-500',
    },
    {
      name: 'CSV分析',
      description: 'アナリティクスCSVから示唆とレポートを自動生成',
      icon: BarChart3,
      href: '/analytics',
      color: 'bg-blue-500',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="mt-2 text-gray-600">
          AI搭載のYouTubeコンテンツスタジオへようこそ
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <Link
              key={feature.name}
              to={feature.href}
              className="relative group bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div>
                <span className={`rounded-lg inline-flex p-3 ${feature.color} text-white ring-4 ring-white`}>
                  <Icon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900">
                  {feature.name}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {feature.description}
                </p>
              </div>
              <span
                className="absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
                aria-hidden="true"
              >
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
                </svg>
              </span>
            </Link>
          )
        })}
      </div>

      <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">使い方</h2>
        <div className="space-y-4 text-gray-600">
          <div>
            <h3 className="font-medium text-gray-900">1. AI企画案生成</h3>
            <p className="text-sm mt-1">
              ターゲットペルソナや動画のジャンルを入力すると、AIが戦略的なチャンネル企画案と動画コンセプトを提案します。
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">2. トレンド分析</h3>
            <p className="text-sm mt-1">
              YouTube、TikTok、Instagramの直近3ヶ月のトレンドショート動画を分析し、再生回数が多い動画をリストアップします。
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">3. CSV分析</h3>
            <p className="text-sm mt-1">
              YouTubeアナリティクスからダウンロードしたCSVファイルをアップロードすると、データ分析と改善提案を自動生成します。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
