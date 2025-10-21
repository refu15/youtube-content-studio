import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { analysisApi } from '../services/api';
import { Loader2, AlertCircle, History } from 'lucide-react';

export default function AnalysisHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      setError('ユーザー情報が不足しています。');
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await analysisApi.listRuns(user.id, { limit: 50 }); // Fetch more to allow filtering/sorting
        setHistory(response.items);
      } catch (err) {
        console.error('Failed to fetch analysis history:', err);
        setError(err.message || '分析履歴の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user?.id]);

  const formatHistoryDate = (isoString) => {
    try {
      return new Date(isoString).toLocaleString('ja-JP', {
        timeZone: 'Asia/Tokyo',
        hour12: false,
      });
    } catch {
      return isoString;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        <p className="ml-3 text-gray-600">分析履歴を読み込み中...</p>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <History className="h-8 w-8 text-gray-500" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">保存された分析履歴</h1>
          <p className="mt-1 text-gray-600">これまでの分析履歴を一覧で確認できます。</p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500">まだ保存された分析履歴はありません。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.map((item) => (
            <Link to={`/analysis/${item.id}`} key={item.id} className="block">
              <div className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors h-full flex flex-col">
                <p className="text-xs text-gray-400">{formatHistoryDate(item.created_at)}</p>
                <p className="mt-2 text-sm font-medium text-gray-900 flex-grow">
                  {item.summary || `保存した${item.analysis_type === 'trends' ? 'トレンド分析' : 'バイラル分析'}`}
                </p>
                {item.keywords?.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    キーワード: {item.keywords.slice(0, 3).join(', ')}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  タイプ: {item.analysis_type === 'trends' ? 'トレンド' : 'バイラル'}
                </p>
                <span className="mt-3 inline-block text-xs text-red-500 hover:underline">詳細を見る</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
