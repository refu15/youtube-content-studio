const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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
      const error = await response.json()
      throw new Error(error.detail || '企画案生成に失敗しました')
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
      const error = await response.json()
      throw new Error(error.detail || '戦略生成に失敗しました')
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
      const error = await response.json()
      throw new Error(error.detail || '動画コンセプト生成に失敗しました')
    }

    return response.json()
  },
}
