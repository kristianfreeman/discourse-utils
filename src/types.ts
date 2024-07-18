type Env = {
  CANNED_ID: string
  DEFAULT_RESPONSE: string
  DISCOURSE_TOKEN: string
  DISCOURSE_URL: string
  QUEUE: Queue<string>
}

type AcceptedAnswerWebhookResponse = {
  solved: {
    id: number,
    username: string,
    avatar_template: string,
    created_at: string,
    cooked: string,
    post_number: number,
    post_type: number,
    updated_at: string,
    reply_count: number,
    reply_to_post_number: number,
    quote_count: number,
    incoming_link_count: number,
    reads: number,
    score: number,
    topic_id: number,
    topic_slug: string,
    topic_title: string,
    category_id: number,
    primary_group_name: string,
    flair_name: string,
    flair_group_id: number,
    version: number,
    user_title: string,
    title_is_group: boolean,
    bookmarked: boolean,
    raw: string,
    moderator: boolean,
    admin: boolean,
    staff: boolean,
    user_id: number,
    hidden: boolean,
    trust_level: number,
    user_deleted: boolean,
    wiki: boolean,
    reviewable_score_count: number,
    reviewable_score_pending_count: number,
    topic_posts_count: number,
    topic_filtered_posts_count: number,
    topic_archetype: string,
    category_slug: string,
    user_cakedate: string,
    can_manage_category_expert_posts: boolean,
    reactions: any[],
    reaction_users_count: number,
    current_user_used_main_reaction: boolean
  }
}

type PartialPostResponse = {
  raw: string
}

export type {
  AcceptedAnswerWebhookResponse,
  Env,
  PartialPostResponse
}
