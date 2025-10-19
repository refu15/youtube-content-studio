const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const parseErrorDetail = async (response, fallbackMessage) => {
  try {
    const data = await response.json()
    return data?.detail || fallbackMessage
  } catch (error) {
    return fallbackMessage
  }
}

export const planningApi = {
  async generateFullPlan(data) {
    const response = await fetch(`${API_URL}/api/v1/planning/full-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const detail = await parseErrorDetail(response, '企画案の生成に失敗しました')
      throw new Error(detail)
    }

    return response.json()
  },

  async generateStrategy(data) {
    const response = await fetch(`${API_URL}/api/v1/planning/strategy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const detail = await parseErrorDetail(response, '戦略の生成に失敗しました')
      throw new Error(detail)
    }

    return response.json()
  },

  async generateVideoConcepts(data) {
    const response = await fetch(`${API_URL}/api/v1/planning/video-concepts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const detail = await parseErrorDetail(response, '動画コンセプトの生成に失敗しました')
      throw new Error(detail)
    }

    return response.json()
  },
}

export const dashboardApi = {
  async getOverview(data) {
    const response = await fetch(`${API_URL}/api/v1/dashboard/overview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const detail = await parseErrorDetail(response, 'ダッシュボードの生成に失敗しました')
      throw new Error(detail)
    }

    return response.json()
  },
}

export const channelApi = {
  async getChannels(userId) {
    if (!userId) throw new Error('ユーザーIDが必要です');
    const response = await fetch(`${API_URL}/api/v1/channels/`, {
      headers: withUserHeader({}, userId),
    });
    if (!response.ok) {
      const detail = await parseErrorDetail(response, 'チャンネル一覧の取得に失敗しました');
      throw new Error(detail);
    }
    return response.json();
  },

  async addChannel(userId, channelUrl) {
    if (!userId) throw new Error('ユーザーIDが必要です');
    const response = await fetch(`${API_URL}/api/v1/channels/`, {
      method: 'POST',
      headers: withUserHeader({ 'Content-Type': 'application/json' }, userId),
      body: JSON.stringify({ channel_url: channelUrl }),
    });
    if (!response.ok) {
      const detail = await parseErrorDetail(response, 'チャンネルの登録に失敗しました');
      throw new Error(detail);
    }
    return response.json();
  },

  async deleteChannel(userId, channelId) {
    if (!userId) throw new Error('ユーザーIDが必要です');
    const response = await fetch(`${API_URL}/api/v1/channels/${channelId}`, {
      method: 'DELETE',
      headers: withUserHeader({}, userId),
    });
    if (!response.ok) {
      const detail = await parseErrorDetail(response, 'チャンネルの削除に失敗しました');
      throw new Error(detail);
    }
  },

  async getChannelStats(userId, channelId) {
    if (!userId) throw new Error('ユーザーIDが必要です');
    const response = await fetch(`${API_URL}/api/v1/channels/${channelId}/stats`, {
      headers: withUserHeader({}, userId),
    });
    if (!response.ok) {
      const detail = await parseErrorDetail(response, 'チャンネル統計の取得に失敗しました');
      throw new Error(detail);
    }
    return response.json();
  },

  async getChannelAnalyses(userId, channelId) {
    if (!userId) throw new Error('ユーザーIDが必要です');
    const response = await fetch(`${API_URL}/api/v1/channels/${channelId}/analyses`, {
      headers: withUserHeader({}, userId),
    });
    if (!response.ok) {
      const detail = await parseErrorDetail(response, 'チャンネル分析履歴の取得に失敗しました');
      throw new Error(detail);
    }
    return response.json();
  },

  async getChannelTopKeywords(userId, channelId) {
    if (!userId) throw new Error('ユーザーIDが必要です');
    const response = await fetch(`${API_URL}/api/v1/channels/${channelId}/top-keywords`, {
      headers: withUserHeader({}, userId),
    });
    if (!response.ok) {
      const detail = await parseErrorDetail(response, 'キーワード統計の取得に失敗しました');
      throw new Error(detail);
    }
    return response.json();
  },
};

export const statsApi = {
  async getTopKeywords(userId) {
    if (!userId) throw new Error('ユーザーIDが必要です');
    const response = await fetch(`${API_URL}/api/v1/stats/top-keywords`, {
      headers: withUserHeader({}, userId),
    });
    if (!response.ok) {
      const detail = await parseErrorDetail(response, 'キーワード統計の取得に失敗しました');
      throw new Error(detail);
    }
    return response.json();
  },
};

const withUserHeader = (headers, userId) => ({
  ...headers,
  ...(userId ? { 'X-User-Id': userId } : {}),
})

export const analysisApi = {
  async saveRun(userId, data) {
    if (!userId) {
      throw new Error('ユーザーIDが必要です')
    }

    const response = await fetch(`${API_URL}/api/v1/analysis`, {
      method: 'POST',
      headers: withUserHeader(
        {
          'Content-Type': 'application/json',
        },
        userId
      ),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const detail = await parseErrorDetail(response, '分析結果の保存に失敗しました')
      throw new Error(detail)
    }

    return response.json()
  },

  async listRuns(userId, params = {}) {
    if (!userId) {
      throw new Error('ユーザーIDが必要です')
    }

    const searchParams = new URLSearchParams()
    if (params.analysis_type) {
      searchParams.set('analysis_type', params.analysis_type)
    }
    if (params.limit) {
      searchParams.set('limit', params.limit)
    }
    if (params.cursor) {
      searchParams.set('cursor', params.cursor)
    }

    const queryString = searchParams.toString()
    const response = await fetch(
      `${API_URL}/api/v1/analysis${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
        headers: withUserHeader({}, userId),
      }
    )

    if (!response.ok) {
      const detail = await parseErrorDetail(response, '分析履歴の取得に失敗しました')
      throw new Error(detail)
    }

    return response.json()
  },

  async getRun(userId, analysisId) {
    if (!userId) {
      throw new Error('ユーザーIDが必要です')
    }

    const response = await fetch(`${API_URL}/api/v1/analysis/${analysisId}`, {
      method: 'GET',
      headers: withUserHeader({}, userId),
    })

    if (!response.ok) {
      const detail = await parseErrorDetail(response, '分析結果の取得に失敗しました')
      throw new Error(detail)
    }

    return response.json()
  },

  async deleteRun(userId, analysisId) {
    if (!userId) {
      throw new Error('ユーザーIDが必要です')
    }

    const response = await fetch(`${API_URL}/api/v1/analysis/${analysisId}`, {
      method: 'DELETE',
      headers: withUserHeader({}, userId),
    })

    if (!response.ok) {
      const detail = await parseErrorDetail(response, '分析結果の削除に失敗しました')
      throw new Error(detail)
    }
  },

  async getStats(userId) {
    if (!userId) {
      throw new Error('ユーザーIDが必要です')
    }

    const response = await fetch(`${API_URL}/api/v1/analysis/stats`, {
      method: 'GET',
      headers: withUserHeader({}, userId),
    })

    if (!response.ok) {
      const detail = await parseErrorDetail(response, '統計情報の取得に失敗しました')
      throw new Error(detail)
    }

    return response.json()
  },
}
