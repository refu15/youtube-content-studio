import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { channelApi } from '../services/api';
import { Plus, Trash2, Loader2, AlertCircle, Youtube } from 'lucide-react';

export default function ChannelManagement() {
  const { user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [newChannelUrl, setNewChannelUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedChannelId, setExpandedChannelId] = useState(null);
  const [channelDetails, setChannelDetails] = useState({ stats: null, analyses: [], topKeywords: [] });
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchChannels = async () => {
      try {
        setLoading(true);
        setError('');
        const fetchedChannels = await channelApi.getChannels(user.id);
        setChannels(fetchedChannels);
      } catch (err) {
        setError(err.message || 'チャンネルの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, [user?.id]);

  const handleAddChannel = async (e) => {
    e.preventDefault();
    if (!newChannelUrl.trim()) {
      setError('チャンネルURLを入力してください。');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const newChannel = await channelApi.addChannel(user.id, newChannelUrl);
      setChannels([newChannel, ...channels]);
      setNewChannelUrl('');
    } catch (err) {
      setError(err.message || 'チャンネルの登録に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteChannel = async (channelId) => {
    if (!window.confirm('このチャンネルを削除しますか？')) return;

    try {
      await channelApi.deleteChannel(user.id, channelId);
      setChannels(channels.filter((c) => c.id !== channelId));
    } catch (err) {
      setError(err.message || 'チャンネルの削除に失敗しました。');
    }
  };

  const handleToggleDetails = async (channelId) => {
    if (expandedChannelId === channelId) {
      setExpandedChannelId(null);
      return;
    }

    setExpandedChannelId(channelId);
    setDetailsLoading(true);
    setDetailsError('');
    try {
      const [stats, analyses, topKeywords] = await Promise.all([
        channelApi.getChannelStats(user.id, channelId),
        channelApi.getChannelAnalyses(user.id, channelId),
        channelApi.getChannelTopKeywords(user.id, channelId),
      ]);
      setChannelDetails({ stats, analyses: analyses.items, topKeywords });
    } catch (err) {
      setDetailsError(err.message || '詳細の取得に失敗しました。');
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Youtube className="h-8 w-8 text-red-500" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">チャンネル管理</h1>
          <p className="mt-1 text-gray-600">
            分析のベースとなるご自身のYouTubeチャンネルを登録・管理します。
          </p>
        </div>
      </div>

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <form onSubmit={handleAddChannel} className="p-6 space-y-4">
          <div>
            <label htmlFor="channelUrl" className="block text-sm font-medium text-gray-700 mb-2">
              新しいチャンネルURL
            </label>
            <div className="flex gap-2">
              <input
                id="channelUrl"
                type="url"
                value={newChannelUrl}
                onChange={(e) => setNewChannelUrl(e.target.value)}
                className="flex-grow w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                placeholder="https://www.youtube.com/channel/UC..."
                disabled={submitting}
              />
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>登録</span>
              </button>
            </div>
          </div>
          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">登録済みチャンネル</h2>
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-red-500" />
          </div>
        ) : channels.length === 0 ? (
          <p className="text-gray-500 text-sm">登録済みのチャンネルはありません。</p>
        ) : (
          <div className="space-y-3">
            {channels.map((channel) => (
              <div key={channel.id} className="bg-white border border-gray-200 rounded-xl shadow-sm transition-shadow hover:shadow-md">
                <div className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">{channel.channel_name}</p>
                    <a href={channel.channel_url} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-red-600">
                      {channel.channel_url}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleDetails(channel.id)}
                      className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                      aria-label="詳細を表示"
                    >
                      {expandedChannelId === channel.id ? '閉じる' : '詳細'}
                    </button>
                    <button
                      onClick={() => handleDeleteChannel(channel.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      aria-label="チャンネルを削除"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                {expandedChannelId === channel.id && (
                  <div className="border-t border-gray-200 p-4">
                    {detailsLoading && <Loader2 className="h-6 w-6 animate-spin text-red-500" />}
                    {detailsError && <p className="text-sm text-red-600">{detailsError}</p>}
                    {!detailsLoading && !detailsError && channelDetails.stats && (
                      <div>
                        <h3 className="font-semibold text-lg mb-2">チャンネル統計</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div className="bg-gray-100 p-3 rounded-lg">
                            <p className="text-sm text-gray-600">総分析回数</p>
                            <p className="text-2xl font-bold">{channelDetails.stats.total_runs}</p>
                          </div>
                          <div className="bg-gray-100 p-3 rounded-lg">
                            <p className="text-sm text-gray-600">トレンド分析</p>
                            <p className="text-2xl font-bold">{channelDetails.stats.trends_runs}</p>
                          </div>
                          <div className="bg-gray-100 p-3 rounded-lg">
                            <p className="text-sm text-gray-600">バイラル分析</p>
                            <p className="text-2xl font-bold">{channelDetails.stats.viral_runs}</p>
                          </div>
                          <div className="bg-gray-100 p-3 rounded-lg">
                            <p className="text-sm text-gray-600">発見動画数</p>
                            <p className="text-2xl font-bold">{channelDetails.stats.viral_videos}</p>
                          </div>
                        </div>
                        <h3 className="font-semibold text-lg mt-6 mb-2">分析履歴</h3>
                        {channelDetails.analyses.length === 0 ? (
                          <p className="text-sm text-gray-500">このチャンネルの分析履歴はありません。</p>
                        ) : (
                          <ul className="space-y-2">
                            {channelDetails.analyses.map(run => (
                              <li key={run.id} className="border rounded-lg p-3 text-sm">
                                <p className="font-semibold">{run.summary}</p>
                                <p className="text-xs text-gray-500">{new Date(run.created_at).toLocaleString('ja-JP')}</p>
                                <p className="text-xs text-gray-500">タイプ: {run.analysis_type}</p>
                              </li>
                            ))}
                          </ul>
                        )}
                        <h3 className="font-semibold text-lg mt-6 mb-2">よく使うキーワード</h3>
                        {channelDetails.topKeywords.length === 0 ? (
                          <p className="text-sm text-gray-500">このチャンネルのキーワードはありません。</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {channelDetails.topKeywords.map(kw => (
                              <span key={kw.keyword} className="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">
                                {kw.keyword} ({kw.count})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
