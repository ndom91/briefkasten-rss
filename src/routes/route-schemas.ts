const feedBodySchema = {
  type: 'object',
  required: ['userId', 'feedUrl'],
  properties: {
    userId: { type: 'string' },
    feedUrl: { type: 'string' },
  },
} as const

const postFeedSchema = {
  body: feedBodySchema,
}

export {
  postFeedSchema,
}
