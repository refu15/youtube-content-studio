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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">保存された分析: {analysisData.summary || analysisData.analysis_type}</h1>
      <p className="text-gray-600">分析タイプ: {analysisData.analysis_type}</p>
      <p className="text-gray-600">キーワード: {analysisData.keywords.join(', ')}</p>
      <p className="text-gray-600">プラットフォーム: {analysisData.platforms.join(', ')}</p>
      <p className="text-gray-600">作成日時: {new Date(analysisData.created_at).toLocaleString()}</p>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">分析結果</h2>
        {analysisData.result ? (
          <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto">
            {JSON.stringify(analysisData.result, null, 2)}
          </pre>
        ) : (
          <p className="text-gray-500">結果データがありません。</p>
        )}
      </div>

      {analysisData.meta && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">メタデータ</h2>
          <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto">
            {JSON.stringify(analysisData.meta, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
