import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { analysisApi } from '../services/api';
import { Loader2, AlertCircle } from 'lucide-react';

export default function AnalysisDetail() {
  const { analysisId } = useParams();
  const { user } = useAuth();
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.id || !analysisId) {
      setLoading(false);
      setError('ユーザー情報または分析IDが不足しています。');
      return;
    }

    const fetchAnalysisDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await analysisApi.getRun(user.id, analysisId);
        setAnalysisData(data);
      } catch (err) {
        console.error('Failed to fetch analysis detail:', err);
        setError(err.message || '分析詳細の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysisDetail();
  }, [user?.id, analysisId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        <p className="ml-3 text-gray-600">分析データを読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        <AlertCircle className="h-6 w-6 mr-2" />
        <p>{error}</p>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-600">
        <p>分析データが見つかりませんでした。</p>
      </div>
    );
  }

  const formatNumber = (value) =>
    new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 1 }).format(value);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">保存された分析: {analysisData.summary || analysisData.analysis_type}</h1>
      <p className="text-gray-600">分析タイプ: {analysisData.analysis_type}</p>
      <p className="text-gray-600">キーワード: {analysisData.keywords.join(', ')}</p>
      <p className="text-gray-600">プラットフォーム: {analysisData.platforms.join(', ')}</p>
      <p className="text-gray-600">作成日時: {new Date(analysisData.created_at).toLocaleString()}</p>

      {analysisData.result ? (
        <div className="space-y-8">
          {/* Overall Insights */}
          {analysisData.result.overall_insights && analysisData.result.overall_insights.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">全体的な示唆</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {analysisData.result.overall_insights.map((insight, index) => (
                  <li key={index}>{insight}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Platform-specific results */}
          {analysisData.result.platforms && analysisData.result.platforms.map((platformData, pIndex) => (
            <div key={pIndex} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{platformData.platform} 分析結果</h2>

              {platformData.insights && platformData.insights.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">プラットフォーム別示唆</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {platformData.insights.map((insight, index) => (
                      <li key={index}>{insight}</li>
                    ))}
                  </ul>
                </div>
              )}

              {platformData.videos && platformData.videos.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">動画一覧 ({platformData.videos.length}件)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {platformData.videos.map((video, vIndex) => (
                      <div key={vIndex} className="border border-gray-200 rounded-lg p-4 space-y-2">
                        {video.thumbnail_url && (
                          <a href={video.url} target="_blank" rel="noopener noreferrer">
                            <img src={video.thumbnail_url} alt={video.title} className="w-full h-auto rounded-md mb-2" />
                          </a>
                        )}
                        <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-red-600 hover:underline block">
                          {video.title}
                        </a>
                        <p className="text-sm text-gray-700">{video.channel_name}</p>
                        <div className="flex flex-wrap gap-x-4 text-sm text-gray-600">
                          {video.view_count && <span>再生: {formatNumber(video.view_count)}</span>}
                          {video.like_count && <span>高評価: {formatNumber(video.like_count)}</span>}
                          {video.comment_count && <span>コメント: {formatNumber(video.comment_count)}</span>}
                        </div>
                        {video.why_trending && (
                          <p className="text-sm text-gray-800 mt-2">
                            <span className="font-medium">トレンド理由:</span> {video.why_trending}
                          </p>
                        )}
                        {video.why_viral && (
                          <p className="text-sm text-gray-800 mt-2">
                            <span className="font-medium">バイラル理由:</span> {video.why_viral}
                          </p>
                        )}
                        {video.key_takeaways && video.key_takeaways.length > 0 && (
                          <div className="mt-2">
                            <span className="font-medium text-sm text-gray-800">学べるポイント:</span>
                            <ul className="list-disc list-inside text-sm text-gray-700 ml-4">
                              {video.key_takeaways.map((takeaway, tIndex) => (
                                <li key={tIndex}>{takeaway}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {video.tags && video.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {video.tags.map((tag, tIndex) => (
                              <span key={tIndex} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Viral-specific insights (if analysis_type is viral) */}
          {analysisData.analysis_type === 'viral' && analysisData.result.insights && analysisData.result.insights.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">バイラル動画の共通パターン</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {analysisData.result.insights.map((insight, index) => (
                  <li key={index}>{insight}</li>
                ))}
              </ul>
            </div>
          )}

          {analysisData.analysis_type === 'viral' && analysisData.result.content_strategies && analysisData.result.content_strategies.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">コンテンツ戦略の提案</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {analysisData.result.content_strategies.map((strategy, index) => (
                  <li key={index}>{strategy}</li>
                ))}
              </ul>
            </div>
          )}

        </div>
      ) : (
        <p className="text-gray-500">結果データがありません。</p>
      )}

      {analysisData.meta && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">メタデータ</h2>
          <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto">
            {JSON.stringify(analysisData.meta, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );}
