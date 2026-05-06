import { apiRequest } from '../auth';

function unwrapData(payload) {
    if (!payload || typeof payload !== 'object') {
        return null;
    }

    return payload.data && typeof payload.data === 'object' ? payload.data : payload;
}

function normalizeListResponse(payload) {
    const data = unwrapData(payload);

    return {
        data: Array.isArray(data) ? data : [],
        meta:
            payload && typeof payload === 'object' && payload.meta &&
            typeof payload.meta === 'object'
                ? payload.meta
                : {},
    };
}

function normalizeCursorParams({ cursor, limit } = {}) {
    const params = new URLSearchParams();

    if (cursor) {
        params.set('cursor', cursor);
    }

    if (typeof limit === 'number') {
        params.set('limit', String(limit));
    }

    const query = params.toString();

    return query ? `?${query}` : '';
}

export async function listFeed(token, options = {}) {
    const payload = await apiRequest(`/feed${normalizeCursorParams(options)}`, {
        method: 'GET',
        token,
    });

    return normalizeListResponse(payload);
}

export async function createPost(token, content) {
    const payload = await apiRequest('/posts', {
        method: 'POST',
        token,
        payload: { content },
    });

    return unwrapData(payload);
}

export async function listComments(token, postId, options = {}) {
    const payload = await apiRequest(
        `/posts/${postId}/comments${normalizeCursorParams(options)}`,
        {
            method: 'GET',
            token,
        },
    );

    return normalizeListResponse(payload);
}

export async function createComment(token, postId, content) {
    const payload = await apiRequest(`/posts/${postId}/comments`, {
        method: 'POST',
        token,
        payload: { content },
    });

    return unwrapData(payload);
}

export async function likePost(token, postId) {
    const payload = await apiRequest(`/posts/${postId}/likes`, {
        method: 'POST',
        token,
    });

    return unwrapData(payload);
}

export async function unlikePost(token, likeId) {
    const payload = await apiRequest(`/posts/${likeId}/likes`, {
        method: 'DELETE',
        token,
    });

    return unwrapData(payload);
}

export async function followUser(token, userId) {
    const payload = await apiRequest('/follows', {
        method: 'POST',
        token,
        payload: {
            targetId: userId,
            targetType: 'USER',
        },
    });

    return unwrapData(payload);
}
